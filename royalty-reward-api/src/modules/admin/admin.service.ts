import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(from?: Date, to?: Date) {
    const dateRange = from || to ? { createdAt: { gte: from ?? undefined, lte: to ?? undefined } } : {};
    const paidStatuses: OrderStatus[] = [
      OrderStatus.PAID,
      OrderStatus.FULFILLING,
      OrderStatus.SHIPPED,
      OrderStatus.COMPLETED,
    ];
    const paidWhere = {
      status: { in: paidStatuses },
      ...dateRange,
    };

    const [byStatus, paidOrders, totals] = await this.prisma.$transaction([
      this.prisma.order.groupBy({ by: ['status'], _count: true, where: dateRange, orderBy: { status: 'asc' } }),
      this.prisma.order.count({ where: paidWhere }),
      this.prisma.order.aggregate({ _sum: { total: true }, where: paidWhere }),
    ]);

    const gmvTotal = Number(totals._sum.total ?? 0);
    const aov = paidOrders > 0 ? gmvTotal / paidOrders : 0;

    const customersDistinct = await this.prisma.order.findMany({
      where: { ...paidWhere, userId: { not: null } },
      distinct: ['userId'],
      select: { userId: true },
    });

    return {
      orderCountsByStatus: byStatus.map((r) => ({ status: r.status, count: (r as any)._count })),
      gmvTotal,
      aov,
      customersCount: customersDistinct.length,
    };
  }

  async topSkus(from?: Date, to?: Date, limit = 10) {
    const whereItems = from || to
      ? {
          order: {
            status: { in: [OrderStatus.PAID, OrderStatus.FULFILLING, OrderStatus.SHIPPED, OrderStatus.COMPLETED] },
            createdAt: { gte: from ?? undefined, lte: to ?? undefined },
          },
        }
      : {};

    const rows = await this.prisma.orderItem.groupBy({
      by: ['variantId', 'productId', 'skuSnapshot', 'nameSnapshot'],
      _sum: { lineTotal: true, qty: true },
      where: whereItems,
      take: limit,
      orderBy: { _sum: { lineTotal: 'desc' } },
    });

    return rows.map((r) => ({
      variantId: r.variantId,
      productId: r.productId,
      sku: r.skuSnapshot,
      name: r.nameSnapshot,
      qtySum: Number(r._sum.qty ?? 0),
      revenueSum: Number(r._sum.lineTotal ?? 0),
    }));
  }

  async byShop(from?: Date, to?: Date) {
    const rows = await this.prisma.order.groupBy({
      by: ['shopId'],
      _count: true,
      _sum: { total: true },
      where: from || to ? { createdAt: { gte: from ?? undefined, lte: to ?? undefined } } : {},
      orderBy: { _sum: { total: 'desc' } },
    });
    return rows.map((r) => ({ shopId: r.shopId, ordersCount: (r as any)._count, gmv: Number(r._sum.total ?? 0) }));
  }
}
