import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { RedisService } from '../common/redis.service';
import type { Prisma } from '@prisma/client';
import { MessageRole } from '@prisma/client';
import { ChatChannel, type ChatEvent } from './chat.events';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService, private readonly redis: RedisService) {}

  async start(userId: string, shopId: string) {
    const existing = await this.prisma.conversation.findFirst({ where: { buyerUserId: userId, shopId, status: 'OPEN' } });
    if (existing) return existing;
    return this.prisma.conversation.create({ data: { buyerUserId: userId, shopId, status: 'OPEN' } });
  }

  async listMy(userId: string, limit = 20, offset = 0) {
    return this.prisma.conversation.findMany({ where: { buyerUserId: userId }, take: limit, skip: offset, orderBy: { updatedAt: 'desc' } });
  }

  async listShopConversations(shopId: string, limit = 20, offset = 0) {
    return this.prisma.conversation.findMany({ where: { shopId }, take: limit, skip: offset, orderBy: { updatedAt: 'desc' } });
  }

  private async assertParticipant(userId: string, convId: string): Promise<{ role: MessageRole; shopId: string | null }> {
    const conv = await this.prisma.conversation.findUnique({ where: { id: convId } });
    if (!conv) throw new NotFoundException('Conversation not found');
    if (conv.buyerUserId === userId) return { role: MessageRole.BUYER, shopId: conv.shopId ?? null };
    if (conv.shopId) {
      const staff = await this.prisma.shopStaff.findUnique({ where: { shopId_userId: { shopId: conv.shopId, userId } } });
      if (staff) return { role: MessageRole.SELLER, shopId: conv.shopId };
    }
    throw new ForbiddenException('Not a participant');
  }

  async listMessages(userId: string, conversationId: string, limit = 50, offset = 0) {
    await this.assertParticipant(userId, conversationId);
    return this.prisma.message.findMany({
      where: { conversationId },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'asc' },
    });
  }

  async sendMessage(userId: string, conversationId: string, body: string, attachments?: unknown) {
    const { role } = await this.assertParticipant(userId, conversationId);
    const msg = await this.prisma.message.create({
      data: {
        conversationId,
        senderUserId: userId,
        role,
        body,
        attachments: attachments as unknown as Prisma.InputJsonValue,
      },
    });
    await this.prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
    const event: ChatEvent = {
      type: 'message',
      conversationId,
      data: {
        id: msg.id,
        conversationId: msg.conversationId,
        senderUserId: msg.senderUserId,
        role: msg.role,
        body: msg.body,
        attachments: msg.attachments as unknown,
        createdAt: msg.createdAt.toISOString(),
      },
    };
    await this.redis.publish(ChatChannel.message(conversationId), event);
    return msg;
  }

  async markRead(userId: string, conversationId: string, readUpToId?: string) {
    const { role } = await this.assertParticipant(userId, conversationId);
    let threshold: Date | undefined;
    if (readUpToId) {
      const m = await this.prisma.message.findUnique({ where: { id: readUpToId } });
      if (!m || m.conversationId !== conversationId) throw new NotFoundException('Message not in conversation');
      threshold = m.createdAt;
    }
    const where: Prisma.MessageWhereInput = {
      conversationId,
      role: role === MessageRole.BUYER ? MessageRole.SELLER : MessageRole.BUYER,
      readAt: null,
      ...(threshold ? { createdAt: { lte: threshold } } : {}),
    };
    const res = await this.prisma.message.updateMany({ where, data: { readAt: new Date() } });
    const event: ChatEvent = {
      type: 'read',
      conversationId,
      data: { byUserId: userId, readUpToId, updated: res.count },
    };
    await this.redis.publish(ChatChannel.read(conversationId), event);
    return { updated: res.count };
  }
}
