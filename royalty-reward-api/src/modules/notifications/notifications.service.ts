import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, options: { unreadOnly?: boolean; limit?: number; offset?: number }) {
    const where = { userId, ...(options.unreadOnly ? { readAt: null } : {}) } as const;
    const take = options.limit ?? 20;
    const skip = options.offset ?? 0;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({ where, take, skip, orderBy: { createdAt: 'desc' } }),
      this.prisma.notification.count({ where }),
    ]);
    return { items, total, limit: take, offset: skip };
  }

  async markRead(userId: string, id: string) {
    const nf = await this.prisma.notification.findUnique({ where: { id } });
    if (!nf || nf.userId !== userId) throw new NotFoundException('Notification not found');
    return this.prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
    return { success: true };
  }
}
