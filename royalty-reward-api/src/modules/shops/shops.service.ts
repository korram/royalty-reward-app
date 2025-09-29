import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateShopDto, UpdateShopDto, InviteStaffDto, UpdateStaffDto } from './dto/shop.dto';

@Injectable()
export class ShopsService {
  constructor(private readonly prisma: PrismaService) {}

  async adminList(params: { limit?: number; offset?: number }) {
    const take = params.limit ?? 20;
    const skip = params.offset ?? 0;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.shop.findMany({ take, skip, orderBy: { createdAt: 'desc' } }),
      this.prisma.shop.count(),
    ]);
    return { items, total, limit: take, offset: skip };
  }

  async create(dto: CreateShopDto) {
    return this.prisma.shop.create({
      data: {
        slug: dto.slug,
        name: dto.name,
        description: dto.description,
        ownerUserId: dto.ownerUserId,
        status: 'ACTIVE',
      },
    });
  }

  async findByIdOrSlug(idOrSlug: string) {
    return this.prisma.shop.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    });
  }

  async adminUpdate(shopId: string, dto: UpdateShopDto) {
    return this.prisma.shop.update({ where: { id: shopId }, data: dto });
  }

  async adminDelete(shopId: string) {
    return this.prisma.shop.delete({ where: { id: shopId } });
  }

  // Staff
  async listStaff(shopId: string) {
    return this.prisma.shopStaff.findMany({
      where: { shopId },
      include: { user: { select: { id: true, email: true, name: true } } },
      orderBy: { role: 'asc' },
    });
  }

  async addStaff(shopId: string, dto: InviteStaffDto) {
    return this.prisma.shopStaff.upsert({
      where: { shopId_userId: { shopId, userId: dto.userId } },
      update: { role: dto.role, permissions: dto.permissions ?? [] },
      create: {
        shopId,
        userId: dto.userId,
        role: dto.role,
        permissions: dto.permissions ?? [],
      },
    });
  }

  async updateStaff(shopId: string, userId: string, dto: UpdateStaffDto) {
    return this.prisma.shopStaff.update({
      where: { shopId_userId: { shopId, userId } },
      data: { role: dto.role, permissions: dto.permissions },
    });
  }

  async removeStaff(shopId: string, userId: string) {
    return this.prisma.shopStaff.delete({
      where: { shopId_userId: { shopId, userId } },
    });
  }
}
