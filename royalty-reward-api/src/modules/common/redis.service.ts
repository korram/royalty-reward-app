import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis, { Redis as RedisClient } from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client!: RedisClient;
  private subscriber!: RedisClient;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const url = this.config.get<string>('REDIS_URL') || 'redis://localhost:6379';
    this.client = new Redis(url, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
    });
    this.subscriber = new Redis(url, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
    });
  }

  async onModuleDestroy() {
    if (this.subscriber) await this.subscriber.quit();
    if (this.client) await this.client.quit();
  }

  getClient(): RedisClient {
    return this.client;
  }

  getSubscriber(): RedisClient {
    return this.subscriber;
  }

  async set(key: string, value: string, ttlSeconds?: number) {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string) {
    return this.client.get(key);
  }

  async del(key: string | string[]) {
    if (Array.isArray(key)) return this.client.del(...key);
    return this.client.del(key);
  }

  async scanDel(prefix: string) {
    const keys: string[] = [];
    let cursor = '0';
    do {
      const [nextCursor, results] = await this.client.scan(
        cursor,
        'MATCH',
        `${prefix}*`,
        'COUNT',
        100,
      );
      cursor = nextCursor;
      keys.push(...results);
    } while (cursor !== '0');
    if (keys.length) await this.client.del(...keys);
    return keys.length;
  }

  async publish(channel: string, payload: unknown) {
    const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return this.client.publish(channel, data);
  }

  async subscribe(channel: string, handler: (message: string, channel: string) => void) {
    const sub = this.subscriber;
    const onMessage = (ch: string, msg: string) => {
      if (ch === channel) handler(msg, ch);
    };
    sub.on('message', onMessage);
    await sub.subscribe(channel);
    return async () => {
      sub.off('message', onMessage);
      await sub.unsubscribe(channel);
    };
  }

  async psubscribe(pattern: string, handler: (message: string, channel: string) => void) {
    const sub = this.subscriber;
    const onPMessage = (_pattern: string, ch: string, msg: string) => {
      handler(msg, ch);
    };
    sub.on('pmessage', onPMessage);
    await sub.psubscribe(pattern);
    return async () => {
      sub.off('pmessage', onPMessage);
      await sub.punsubscribe(pattern);
    };
  }
}
