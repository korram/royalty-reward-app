import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { TokenService } from '../auth/token.service';
import { ChatService } from './chat.service';
import { PrismaService } from '../common/prisma.service';
import { MessageRole } from '@prisma/client';
import { RedisService } from '../common/redis.service';
import { ChatChannel, type ChatEvent } from './chat.events';

@WebSocketGateway({ namespace: '/ws', cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit, OnModuleDestroy {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly tokens: TokenService,
    private readonly chat: ChatService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private unsubPattern?: () => Promise<void>;

  async onModuleInit() {
    // Subscribe to all chat channels and fan-out to socket rooms
    this.unsubPattern = await this.redis.psubscribe(ChatChannel.pattern, (raw, channel) => {
      try {
        const evt = JSON.parse(raw) as ChatEvent;
        const room = `conv:${evt.conversationId}`;
        if (evt.type === 'message') {
          this.server.to(room).emit('chat:message:new', evt.data);
        } else if (evt.type === 'read') {
          this.server.to(room).emit('chat:message:read', evt.data);
        }
      } catch (e) {
        // swallow malformed events
      }
    });
  }

  async onModuleDestroy() {
    if (this.unsubPattern) await this.unsubPattern();
  }

  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      const payload = await this.tokens.verifyAccess(token);
      client.data.user = payload; // { sub, roles, email, jti }
    } catch (e) {
      client.emit('error', { message: 'Unauthorized' });
      client.disconnect(true);
      return;
    }
  }

  async handleDisconnect(_client: Socket) {
    // no-op for now
  }

  private extractToken(client: Socket) {
    const auth = client.handshake.auth?.token || client.handshake.headers['authorization'] || client.handshake.query['token'];
    if (!auth) throw new Error('Missing token');
    const raw = Array.isArray(auth) ? auth[0] : auth;
    return raw.startsWith('Bearer ') ? raw.slice(7) : raw;
  }

  private async assertParticipant(userId: string, conversationId: string): Promise<{ role: MessageRole; shopId: string | null }> {
    const conv = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conv) throw new Error('Conversation not found');
    if (conv.buyerUserId === userId) return { role: MessageRole.BUYER, shopId: conv.shopId ?? null };
    if (conv.shopId) {
      const staff = await this.prisma.shopStaff.findUnique({ where: { shopId_userId: { shopId: conv.shopId, userId } } });
      if (staff) return { role: MessageRole.SELLER, shopId: conv.shopId };
    }
    throw new Error('Not a participant');
  }

  // Join a conversation room and backfill last N messages
  @SubscribeMessage('chat:join')
  async join(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string; backfill?: number },
  ) {
    const user = client.data.user as { sub: string } | undefined;
    if (!user) throw new Error('Unauthorized');
    const { conversationId, backfill = 30 } = payload || ({} as any);
    await this.assertParticipant(user.sub, conversationId);
    const room = `conv:${conversationId}`;
    await client.join(room);
    const msgs = await this.chat.listMessages(user.sub, conversationId, backfill, 0);
    client.emit('chat:messages:backfill', { conversationId, items: msgs });
    return { ok: true, room };
  }

  // Send a message and broadcast
  @SubscribeMessage('chat:message:send')
  async send(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string; body: string; attachments?: unknown },
  ) {
    const user = client.data.user as { sub: string } | undefined;
    if (!user) throw new Error('Unauthorized');
    const { conversationId, body, attachments } = payload || ({} as any);
    const msg = await this.chat.sendMessage(user.sub, conversationId, body, attachments);
    // Do not emit here; rely on Redis event to broadcast to all instances
    return { ok: true, id: msg.id };
  }

  // Mark read and notify
  @SubscribeMessage('chat:message:read')
  async read(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string; readUpToId?: string },
  ) {
    const user = client.data.user as { sub: string } | undefined;
    if (!user) throw new Error('Unauthorized');
    const { conversationId, readUpToId } = payload || ({} as any);
    const res = await this.chat.markRead(user.sub, conversationId, readUpToId);
    // Do not emit here; rely on Redis event to broadcast to all instances
    return { ok: true, updated: res.updated };
  }
}
