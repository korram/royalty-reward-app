import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import * as Prisma from '@prisma/client';
import { CheckoutDto } from './dto/checkout.dto';

const ALLOWED_TRANSITIONS: Record<Prisma.OrderStatus, Prisma.OrderStatus[]> = {
  PENDING: ['PAID', 'CANCELLED'],
  PAID: ['FULFILLING', 'REFUNDED', 'CANCELLED'],
  FULFILLING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['COMPLETED', 'REFUNDED'],
  COMPLETED: [],
  CANCELLED: [],
  REFUNDED: [],
};

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  private makeOrderCode() {
    return 'ORD-' + Math.random().toString(36).slice(2, 10).toUpperCase();
  }

  async checkout(userId: string, dto: CheckoutDto) {
    const cart = await this.prisma.cart.findFirst({
      where: { userId },
      include: { items: { include: { variant: { include: { product: true } } } } },
    });
    if (!cart || cart.items.length === 0) throw new BadRequestException('Cart is empty');

    // Ensure single shop per order
    const shopIds = new Set(
      cart.items
        .map((it) => it.variant?.product?.shopId)
        .filter((v): v is string => !!v),
    );
    if (shopIds.size !== 1) throw new BadRequestException('Cart contains items from multiple shops');
    const shopId = [...shopIds][0];

    const subtotal = cart.items.reduce((s, it) => s + Number(it.unitPrice) * it.qty, 0);
    const shippingFee = 0;
    const discountTotal = 0;
    const taxTotal = 0;
    const total = subtotal + shippingFee - discountTotal + taxTotal;

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          userId,
          shopId,
          code: this.makeOrderCode(),
          status: 'PENDING',
          subtotal: subtotal as any,
          shippingFee: shippingFee as any,
          discountTotal: discountTotal as any,
          taxTotal: taxTotal as any,
          total: total as any,
          currency: cart.currency,
          paymentStatus: 'UNPAID',
          shippingAddressId: dto.shippingAddressId,
          billingAddressId: dto.billingAddressId,
        },
      });

      // items
      for (const it of cart.items) {
        if (!it.variant || !it.variant.product) continue;
        await tx.orderItem.create({
          data: {
            orderId: created.id,
            productId: it.productId ?? undefined,
            variantId: it.variantId ?? undefined,
            nameSnapshot: it.variant.product.name,
            skuSnapshot: it.variant.sku,
            qty: it.qty,
            unitPrice: it.unitPrice,
            lineTotal: (Number(it.unitPrice) * it.qty) as any,
          },
        });
      }

      // clear cart
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      return created;
    });

    return order;
  }

  // Customer list/detail
  async listMy(userId: string, params: { limit?: number; offset?: number }) {
    const take = params.limit ?? 20;
    const skip = params.offset ?? 0;
    const where = { userId };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({ where, take, skip, orderBy: { createdAt: 'desc' } }),
      this.prisma.order.count({ where }),
    ]);
    return { items, total, limit: take, offset: skip };
  }

  async getMy(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order || order.userId !== userId) throw new NotFoundException('Order not found');
    return order;
  }

  // Shop side
  async listShop(shopId: string, params: { limit?: number; offset?: number }) {
    const take = params.limit ?? 20;
    const skip = params.offset ?? 0;
    const where = { shopId };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({ where, take, skip, orderBy: { createdAt: 'desc' } }),
      this.prisma.order.count({ where }),
    ]);
    return { items, total, limit: take, offset: skip };
  }

  async getAdmin(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async listAdmin(params: { limit?: number; offset?: number }) {
    const take = params.limit ?? 20;
    const skip = params.offset ?? 0;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({ take, skip, orderBy: { createdAt: 'desc' } }),
      this.prisma.order.count(),
    ]);
    return { items, total, limit: take, offset: skip };
  }

  async updateStatus(orderId: string, next: Prisma.OrderStatus) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    const allowed = ALLOWED_TRANSITIONS[order.status as Prisma.OrderStatus] ?? [];
    if (!allowed.includes(next)) throw new BadRequestException('Invalid status transition');
    return this.prisma.order.update({ where: { id: orderId }, data: { status: next } });
  }
}
