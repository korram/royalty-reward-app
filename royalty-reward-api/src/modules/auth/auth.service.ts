import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../common/prisma.service';
import { RedisService } from '../common/redis.service';
import { RegisterDto, LoginDto, RefreshDto, ResetDto, ForgotDto, VerifyEmailDto, Tokens } from './dto/auth.dto';
import { TokenService } from './token.service';
import { randomUUID } from 'crypto';

@Injectable()
export class AuthService {
  private readonly FP_TTL = 60 * 15; // 15m
  private readonly VERIFY_TTL = 60 * 60 * 24; // 24h

  constructor(
    private readonly users: UsersService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly tokens: TokenService,
  ) {}

  // Local: Register
  async register(dto: RegisterDto) {
    const exists = await this.users.findByEmail(dto.email);
    if (exists) throw new BadRequestException('Email already registered');
    const hash = await argon2.hash(dto.password);
    const user = await this.users.createUser({ email: dto.email, passwordHash: hash, name: dto.name });
    const roles = await this.users.getUserRoleNames(user.id);
    const { token: accessToken, expiresIn } = await this.tokens.signAccessToken({ id: user.id, email: user.email }, roles);
    const { token: refreshToken } = await this.tokens.signRefreshToken({ id: user.id });

    // create verify token (dev: return token)
    const verifyToken = randomUUID();
    await this.redis.set(this.verifyKey(verifyToken), user.id, this.VERIFY_TTL);

    return {
      user: this.safeUser(user),
      tokens: { accessToken, refreshToken, expiresIn } as Tokens,
      verifyToken, // TODO: email this token to user
    };
  }

  // Local: Login
  async login(dto: LoginDto) {
    const user = await this.users.findByEmail(dto.email);
    if (!user || !user.passwordHash) throw new UnauthorizedException('Invalid credentials');
    const ok = await argon2.verify(user.passwordHash, dto.password).catch(() => false);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    const roles = await this.users.getUserRoleNames(user.id);
    const { token: accessToken, expiresIn } = await this.tokens.signAccessToken({ id: user.id, email: user.email }, roles);
    const { token: refreshToken } = await this.tokens.signRefreshToken({ id: user.id });
    return { user: this.safeUser(user), tokens: { accessToken, refreshToken, expiresIn } as Tokens };
  }

  // Refresh with rotation + reuse detection
  async refresh(userInput: RefreshDto & { cookieToken?: string }) {
    const raw = userInput.refreshToken || userInput.cookieToken;
    if (!raw) throw new UnauthorizedException('No refresh token');
    let payload: { sub: string; jti: string };
    try {
      payload = await this.tokens.verifyRefresh(raw);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // reuse detection
    const valid = await this.tokens.compareRefresh(payload.sub, payload.jti, raw);
    if (!valid) {
      // Token verified but not found in store => reuse attempt
      await this.tokens.revokeAll(payload.sub);
      throw new UnauthorizedException('Detected refresh token reuse');
    }

    // rotate: delete old and issue new
    await this.tokens.deleteRefresh(payload.sub, payload.jti);

    const user = await this.users.findById(payload.sub);
    if (!user) throw new UnauthorizedException('User not found');
    const roles = await this.users.getUserRoleNames(user.id);
    const { token: accessToken, expiresIn } = await this.tokens.signAccessToken({ id: user.id, email: user.email }, roles);
    const { token: refreshToken } = await this.tokens.signRefreshToken({ id: user.id });
    return { user: this.safeUser(user), tokens: { accessToken, refreshToken, expiresIn } as Tokens };
  }

  async logout(userId: string) {
    await this.tokens.revokeAll(userId);
    return { success: true };
  }

  // Forgot/Reset/Verify email
  async forgot(dto: ForgotDto) {
    const user = await this.users.findByEmail(dto.email);
    if (!user) return { success: true }; // do not reveal
    const token = randomUUID();
    await this.redis.set(this.fpKey(token), user.id, this.FP_TTL);
    // TODO: send email with token
    return { success: true, token }; // dev only
  }

  async reset(dto: ResetDto) {
    const userId = await this.redis.get(this.fpKey(dto.token));
    if (!userId) throw new BadRequestException('Invalid or expired token');
    const hash = await argon2.hash(dto.password);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } });
    await this.tokens.revokeAll(userId);
    await this.redis.del(this.fpKey(dto.token));
    return { success: true };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const userId = await this.redis.get(this.verifyKey(dto.token));
    if (!userId) throw new BadRequestException('Invalid or expired token');
    await this.prisma.user.update({ where: { id: userId }, data: { status: 'VERIFIED' } });
    await this.redis.del(this.verifyKey(dto.token));
    return { success: true };
  }

  async me(userId: string) {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    return this.safeUser(user);
  }

  private fpKey(token: string) {
    return `auth:fp:${token}`;
  }

  private verifyKey(token: string) {
    return `auth:verify:${token}`;
  }

  private safeUser(user: any) {
    const { passwordHash, ...rest } = user;
    return rest;
  }
}
