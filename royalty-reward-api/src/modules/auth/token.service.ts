import { Injectable } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import * as argon2 from 'argon2';
import { RedisService } from '../common/redis.service';

export type AccessPayload = {
  sub: string;
  email: string;
  roles: string[];
  jti: string;
  type: 'access';
};

export type RefreshPayload = {
  sub: string;
  jti: string;
  type: 'refresh';
};

@Injectable()
export class TokenService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessTtlSec: number;
  private readonly refreshTtlSec: number;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly redis: RedisService,
  ) {
    this.accessSecret = this.config.get<string>('JWT_ACCESS_SECRET') || 'dev_access_secret';
    this.refreshSecret = this.config.get<string>('JWT_REFRESH_SECRET') || 'dev_refresh_secret';
    this.accessTtlSec = Number(
      this.config.get<string>('JWT_ACCESS_EXPIRES', '900'),
    ); // 15m
    this.refreshTtlSec = Number(
      this.config.get<string>('JWT_REFRESH_EXPIRES', '604800'),
    ); // 7d
  }

  async signAccessToken(user: { id: string; email: string }, roles: string[]) {
    const jti = randomUUID();
    const payload: AccessPayload = {
      sub: user.id,
      email: user.email,
      roles,
      jti,
      type: 'access',
    };
    const opts: JwtSignOptions = {
      secret: this.accessSecret,
      expiresIn: this.accessTtlSec,
    };
    const token = await this.jwt.signAsync(payload, opts);
    return { token, expiresIn: this.accessTtlSec, jti };
  }

  async signRefreshToken(user: { id: string }) {
    const jti = randomUUID();
    const payload: RefreshPayload = { sub: user.id, jti, type: 'refresh' };
    const opts: JwtSignOptions = {
      secret: this.refreshSecret,
      expiresIn: this.refreshTtlSec,
    };
    const token = await this.jwt.signAsync(payload, opts);
    // store hashed token by user and jti
    const hash = await argon2.hash(token);
    await this.storeRefreshHash(user.id, jti, hash);
    return { token, jti, expiresIn: this.refreshTtlSec };
  }

  async verifyAccess(token: string): Promise<AccessPayload> {
    return this.jwt.verifyAsync(token, { secret: this.accessSecret });
  }

  async verifyRefresh(token: string): Promise<RefreshPayload> {
    return this.jwt.verifyAsync(token, { secret: this.refreshSecret });
  }

  private key(userId: string, jti: string) {
    return `auth:rt:${userId}:${jti}`;
  }

  async storeRefreshHash(userId: string, jti: string, hash: string) {
    await this.redis.set(this.key(userId, jti), hash, this.refreshTtlSec);
  }

  async deleteRefresh(userId: string, jti: string) {
    await this.redis.del(this.key(userId, jti));
  }

  async revokeAll(userId: string) {
    await this.redis.scanDel(`auth:rt:${userId}:`);
  }

  async compareRefresh(userId: string, jti: string, token: string) {
    const hash = await this.redis.get(this.key(userId, jti));
    if (!hash) return false;
    return argon2.verify(hash, token).catch(() => false);
  }
}
