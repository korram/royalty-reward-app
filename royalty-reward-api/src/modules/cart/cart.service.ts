import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AddItemDto, UpdateItemDto } from './dto/cart.dto';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  // Utilities
  private async ensureVariantPurchasable(variantId: string) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: true },
    });
    if (!variant || !variant.product) throw new NotFoundException('Variant not found');
    if (!variant.isActive) throw new BadRequestException('Variant is inactive');
    if (variant.product.status !== 'ACTIVE') throw new BadRequestException('Product is not available');
    return variant;
  }

  private computeTotals(items: { qty: number; unitPrice: any }[]) {
    // Prisma Decimal can be used directly for multiplication, but here we cast to number for simplicity
    const subtotal = items.reduce((sum, it) => sum + Number(it.unitPrice) * it.qty, 0);
    return { subtotal };
  }

  // User cart
  async getOrCreateUserCart(userId: string, currency = 'THB') {
    let cart = await this.prisma.cart.findFirst({ where: { userId }, include: { items: true } });
    if (!cart) {
      cart = await this.prisma.cart.create({ data: { userId, currency }, include: { items: true } });
    }
    const totals = this.computeTotals(cart.items);
    return { ...cart, ...totals };
  }

  async setUserCartCurrency(userId: string, currency: string) {
    const cart = await this.prisma.cart.findFirst({ where: { userId }, include: { items: true } });
    if (!cart) return this.prisma.cart.create({ data: { userId, currency } });
    if (cart.items.length > 0 && cart.currency !== currency) {
      throw new BadRequestException('Cannot change currency when cart has items');
    }
    return this.prisma.cart.update({ where: { id: cart.id }, data: { currency } });
  }

  async addUserItem(userId: string, dto: AddItemDto) {
    const variant = await this.ensureVariantPurchasable(dto.variantId);
    let cart = await this.prisma.cart.findFirst({ where: { userId } });
    if (!cart) {
      cart = await this.prisma.cart.create({ data: { userId, currency: variant.currency } });
    }
    if (cart.currency !== variant.currency) {
      throw new BadRequestException('Cart currency mismatch');
    }
    const item = await this.prisma.cartItem.upsert({
      where: { cartId_variantId: { cartId: cart.id, variantId: variant.id } },
      update: { qty: { increment: dto.qty } },
      create: {
        cartId: cart.id,
        productId: variant.productId,
        variantId: variant.id,
        qty: dto.qty,
        unitPrice: variant.price,
      },
    });
    const full = await this.prisma.cart.findUnique({ where: { id: cart.id }, include: { items: true } });
    const totals = this.computeTotals(full!.items);
    return { ...full!, ...totals, lastItem: item };
  }

  async updateUserItem(userId: string, itemId: string, dto: UpdateItemDto) {
    const cart = await this.prisma.cart.findFirst({ where: { userId } });
    if (!cart) throw new NotFoundException('Cart not found');
    const item = await this.prisma.cartItem.findUnique({ where: { id: itemId } });
    if (!item || item.cartId !== cart.id) throw new NotFoundException('Item not found');
    if (dto.qty === 0) {
      await this.prisma.cartItem.delete({ where: { id: itemId } });
    } else {
      await this.prisma.cartItem.update({ where: { id: itemId }, data: { qty: dto.qty } });
    }
    const full = await this.prisma.cart.findUnique({ where: { id: cart.id }, include: { items: true } });
    const totals = this.computeTotals(full!.items);
    return { ...full!, ...totals };
  }

  async removeUserItem(userId: string, itemId: string) {
    const cart = await this.prisma.cart.findFirst({ where: { userId } });
    if (!cart) throw new NotFoundException('Cart not found');
    const item = await this.prisma.cartItem.findUnique({ where: { id: itemId } });
    if (!item || item.cartId !== cart.id) throw new NotFoundException('Item not found');
    await this.prisma.cartItem.delete({ where: { id: itemId } });
    const full = await this.prisma.cart.findUnique({ where: { id: cart.id }, include: { items: true } });
    const totals = this.computeTotals(full!.items);
    return { ...full!, ...totals };
  }

  async mergeSessionIntoUser(userId: string, sessionKey: string) {
    const src = await this.prisma.cart.findUnique({ where: { sessionKey }, include: { items: true } });
    if (!src) return { merged: 0 };
    let dst = await this.prisma.cart.findFirst({ where: { userId } });
    if (!dst) {
      dst = await this.prisma.cart.create({ data: { userId, currency: src.currency } });
    }
    if (dst.currency !== src.currency && src.items.length > 0) {
      throw new BadRequestException('Cannot merge carts with different currencies');
    }
    let mergedCount = 0;
    for (const it of src.items) {
      await this.prisma.cartItem.upsert({
        where: { cartId_variantId: { cartId: dst.id, variantId: it.variantId! } },
        update: { qty: { increment: it.qty } },
        create: {
          cartId: dst.id,
          productId: it.productId!,
          variantId: it.variantId!,
          qty: it.qty,
          unitPrice: it.unitPrice,
        },
      });
      mergedCount += 1;
    }
    await this.prisma.cart.delete({ where: { id: src.id } }).catch(() => undefined);
    return { merged: mergedCount };
  }

  // Session cart
  async createSessionCart(sessionKey: string, currency: string) {
    const exists = await this.prisma.cart.findUnique({ where: { sessionKey } });
    if (exists) return exists;
    return this.prisma.cart.create({ data: { sessionKey, currency } });
  }

  async getSessionCart(sessionKey: string) {
    const cart = await this.prisma.cart.findUnique({ where: { sessionKey }, include: { items: true } });
    if (!cart) throw new NotFoundException('Session cart not found');
    const totals = this.computeTotals(cart.items);
    return { ...cart, ...totals };
  }

  async setSessionCartCurrency(sessionKey: string, currency: string) {
    const cart = await this.prisma.cart.findUnique({ where: { sessionKey }, include: { items: true } });
    if (!cart) return this.prisma.cart.create({ data: { sessionKey, currency } });
    if (cart.items.length > 0 && cart.currency !== currency) {
      throw new BadRequestException('Cannot change currency when cart has items');
    }
    return this.prisma.cart.update({ where: { id: cart.id }, data: { currency } });
  }

  async addSessionItem(sessionKey: string, dto: AddItemDto) {
    const variant = await this.ensureVariantPurchasable(dto.variantId);
    const cart = await this.prisma.cart.upsert({
      where: { sessionKey },
      update: {},
      create: { sessionKey, currency: variant.currency },
    });
    if (cart.currency !== variant.currency) throw new BadRequestException('Cart currency mismatch');
    await this.prisma.cartItem.upsert({
      where: { cartId_variantId: { cartId: cart.id, variantId: variant.id } },
      update: { qty: { increment: dto.qty } },
      create: {
        cartId: cart.id,
        productId: variant.productId,
        variantId: variant.id,
        qty: dto.qty,
        unitPrice: variant.price,
      },
    });
    const full = await this.prisma.cart.findUnique({ where: { id: cart.id }, include: { items: true } });
    const totals = this.computeTotals(full!.items);
    return { ...full!, ...totals };
  }

  async updateSessionItem(sessionKey: string, itemId: string, dto: UpdateItemDto) {
    const cart = await this.prisma.cart.findUnique({ where: { sessionKey } });
    if (!cart) throw new NotFoundException('Cart not found');
    const item = await this.prisma.cartItem.findUnique({ where: { id: itemId } });
    if (!item || item.cartId !== cart.id) throw new NotFoundException('Item not found');
    if (dto.qty === 0) {
      await this.prisma.cartItem.delete({ where: { id: itemId } });
    } else {
      await this.prisma.cartItem.update({ where: { id: itemId }, data: { qty: dto.qty } });
    }
    const full = await this.prisma.cart.findUnique({ where: { id: cart.id }, include: { items: true } });
    const totals = this.computeTotals(full!.items);
    return { ...full!, ...totals };
  }

  async removeSessionItem(sessionKey: string, itemId: string) {
    const cart = await this.prisma.cart.findUnique({ where: { sessionKey } });
    if (!cart) throw new NotFoundException('Cart not found');
    const item = await this.prisma.cartItem.findUnique({ where: { id: itemId } });
    if (!item || item.cartId !== cart.id) throw new NotFoundException('Item not found');
    await this.prisma.cartItem.delete({ where: { id: itemId } });
    const full = await this.prisma.cart.findUnique({ where: { id: cart.id }, include: { items: true } });
    const totals = this.computeTotals(full!.items);
    return { ...full!, ...totals };
  }
}
