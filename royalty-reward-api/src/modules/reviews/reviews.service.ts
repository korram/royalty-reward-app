import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateReviewDto } from './dto/review.dto';
import type { Prisma, ReviewStatus } from '@prisma/client';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertPurchasedAndCompleted(userId: string, productId: string) {
    const purchased = await this.prisma.orderItem.findFirst({
      where: {
        productId,
        order: { userId, status: 'COMPLETED' },
      },
      select: { id: true },
    });
    if (!purchased)
      throw new BadRequestException('You can review only after completing a purchase');
  }

  // Public list (published only)
  async listByProduct(productId: string, params: { limit?: number; offset?: number; sort?: 'createdAt' | 'rating'; order?: 'asc' | 'desc' }) {
    const take = params.limit ?? 20;
    const skip = params.offset ?? 0;
    const orderBy: Prisma.ReviewOrderByWithRelationInput =
      params.sort === 'rating' ? { rating: params.order ?? 'desc' } : { createdAt: params.order ?? 'desc' };
    const where: Prisma.ReviewWhereInput = { productId, status: 'PUBLISHED' };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.review.findMany({ where, take, skip, orderBy }),
      this.prisma.review.count({ where }),
    ]);
    return { items, total, limit: take, offset: skip };
  }

  // Customer create
  async create(userId: string, dto: CreateReviewDto) {
    await this.assertPurchasedAndCompleted(userId, dto.productId);
    return this.prisma.review.create({
      data: {
        productId: dto.productId,
        userId,
        rating: dto.rating,
        title: dto.title,
        body: dto.body,
        status: 'PENDING',
      },
    });
  }

  // Shop moderation
  async listShopReviews(shopId: string, params: { limit?: number; offset?: number }) {
    const take = params.limit ?? 20;
    const skip = params.offset ?? 0;
    const where: Prisma.ReviewWhereInput = { product: { shopId } };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.review.findMany({ where, take, skip, orderBy: { createdAt: 'desc' } }),
      this.prisma.review.count({ where }),
    ]);
    return { items, total, limit: take, offset: skip };
  }

  async updateStatus(id: string, status: ReviewStatus) {
    const rv = await this.prisma.review.findUnique({ where: { id } });
    if (!rv) throw new NotFoundException('Review not found');
    return this.prisma.review.update({ where: { id }, data: { status } });
  }

  async reply(shopUserId: string, id: string) {
    const rv = await this.prisma.review.findUnique({ where: { id } });
    if (!rv) throw new NotFoundException('Review not found');
    // schema has only repliedByShopUserId; store responder
    return this.prisma.review.update({ where: { id }, data: { repliedByShopUserId: shopUserId } });
  }
}
