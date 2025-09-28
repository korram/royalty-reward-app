import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis, { Redis as RedisClient } from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client!: RedisClient;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const url = this.config.get<string>('REDIS_URL') || 'redis://localhost:6379';
    this.client = new Redis(url, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
    });
  }

  async onModuleDestroy() {
    if (this.client) await this.client.quit();
  }

  getClient(): RedisClient {
    return this.client;
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
}
