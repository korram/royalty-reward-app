import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreatePaymentIntentDto } from './dto/create-intent.dto';
import type { Prisma } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  private makeClientSecret() {
    return 'pi_' + Math.random().toString(36).slice(2) + '_secret_' + Math.random().toString(36).slice(2);
  }

  async createIntent(userId: string, orderId: string, dto: CreatePaymentIntentDto) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId) throw new UnauthorizedException('Not your order');
    if (order.paymentStatus !== 'UNPAID') throw new BadRequestException('Order already paid or refunded');

    const amount = order.total; // Decimal
    const currency = order.currency;
    const intent = await this.prisma.paymentIntent.create({
      data: {
        orderId: order.id,
        provider: dto.provider,
        clientSecret: this.makeClientSecret(),
        status: 'requires_payment',
        amount: amount as any,
        currency,
        raw: { provider: dto.provider, createdAt: new Date().toISOString() } as unknown as Prisma.InputJsonValue,
        transactions: {
          create: {
            type: 'CHARGE',
            status: 'created',
            raw: { meta: 'intent created' } as unknown as Prisma.InputJsonValue,
          },
        },
      },
      include: { transactions: true },
    });
    return intent;
  }

  // Webhook handler: provider-agnostic shape
  async handleWebhook(provider: string, signature: string | undefined, rawBody: unknown) {
    // TODO: verify signature with env secret per provider
    if (!signature) throw new UnauthorizedException('Missing signature');

    const evtObj = typeof rawBody === 'string' ? (JSON.parse(rawBody) as unknown) : rawBody;
    const evt = evtObj as Record<string, unknown>;
    // expected minimal: { intentId: string, status: 'succeeded' | 'failed' }
    const intentId = typeof evt.intentId === 'string' ? evt.intentId : undefined;
    const status = typeof evt.status === 'string' ? evt.status : undefined;
    if (!intentId || !status) throw new BadRequestException('Invalid webhook payload');

    if (status === 'succeeded') {
      await this.prisma.$transaction(async (tx) => {
        const intent = await tx.paymentIntent.update({
          where: { id: intentId },
          data: {
            status: 'succeeded',
            transactions: {
              create: { type: 'CHARGE', status: 'success', raw: evt as unknown as Prisma.InputJsonValue },
            },
          },
        });
        // fetch order with items separately to satisfy strict typing
        const ord = await tx.order.findUnique({ where: { id: intent.orderId }, include: { items: true } });
        if (!ord) return;
        // mark order paid
        await tx.order.update({
          where: { id: intent.orderId },
          data: { paymentStatus: 'PAID', status: 'PAID' },
        });

        // decrement inventory for each variant line
        for (const item of ord.items) {
          if (!item.variantId) continue;
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stockQty: { decrement: item.qty } },
          });
          await tx.inventoryLog.create({
            data: {
              variantId: item.variantId,
              delta: -item.qty,
              reason: 'ORDER_PAID',
              refType: 'ORDER',
              refId: intent.orderId,
            },
          });
        }
      });
    } else if (status === 'failed') {
      await this.prisma.paymentIntent.update({
        where: { id: intentId },
        data: {
          status: 'failed',
          transactions: {
            create: { type: 'CHARGE', status: 'failed', raw: evt as unknown as Prisma.InputJsonValue },
          },
        },
      });
    }

    return { ok: true };
  }
}
