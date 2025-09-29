import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateWishlistDto, UpdateWishlistDto, AddWishlistItemDto } from './dto/wishlist.dto';

@Injectable()
export class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

  // Wishlists
  async listMy(userId: string) {
    return this.prisma.wishlist.findMany({ where: { userId }, orderBy: { name: 'asc' } });
  }

  async create(userId: string, dto: CreateWishlistDto) {
    return this.prisma.wishlist.create({ data: { userId, name: dto.name } });
  }

  private async ensureOwner(userId: string, wishlistId: string) {
    const wl = await this.prisma.wishlist.findUnique({ where: { id: wishlistId } });
    if (!wl) throw new NotFoundException('Wishlist not found');
    if (wl.userId !== userId) throw new ForbiddenException('Not owner');
    return wl;
  }

  async update(userId: string, wishlistId: string, dto: UpdateWishlistDto) {
    await this.ensureOwner(userId, wishlistId);
    return this.prisma.wishlist.update({ where: { id: wishlistId }, data: { name: dto.name } });
  }

  async remove(userId: string, wishlistId: string) {
    await this.ensureOwner(userId, wishlistId);
    await this.prisma.wishlist.delete({ where: { id: wishlistId } });
    return { success: true };
  }

  // Items
  async listItems(userId: string, wishlistId: string) {
    await this.ensureOwner(userId, wishlistId);
    return this.prisma.wishlistItem.findMany({
      where: { wishlistId },
      orderBy: { id: 'desc' },
      include: { product: { select: { id: true, name: true, slug: true } }, variant: { select: { id: true, sku: true } } },
    });
  }

  async addItem(userId: string, wishlistId: string, dto: AddWishlistItemDto) {
    await this.ensureOwner(userId, wishlistId);
    try {
      return await this.prisma.wishlistItem.create({
        data: { wishlistId, productId: dto.productId, variantId: dto.variantId ?? null },
      });
    } catch (e) {
      // handle unique constraint
      throw new BadRequestException('Item already exists in wishlist');
    }
  }

  async removeItem(userId: string, wishlistId: string, itemId: string) {
    await this.ensureOwner(userId, wishlistId);
    const item = await this.prisma.wishlistItem.findUnique({ where: { id: itemId } });
    if (!item || item.wishlistId !== wishlistId) throw new NotFoundException('Item not found');
    await this.prisma.wishlistItem.delete({ where: { id: itemId } });
    return { success: true };
  }
}
