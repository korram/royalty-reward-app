import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { JwtValidatePayload } from '../strategies/jwt.strategy';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );
    if (!required || required.length === 0) return true;

    const req = ctx
      .switchToHttp()
      .getRequest<{
        user?: JwtValidatePayload;
        params?: Record<string, unknown>;
        headers: Record<string, unknown>;
        query?: Record<string, unknown>;
      }>();
    const user = req.user;
    if (!user) return false;

    // Admin bypass
    if (user.roles?.includes('ADMIN')) return true;

    // Resolve shopId from params/header/query
    const shopId =
      (req.params?.['shopId'] as string | undefined) ||
      (req.headers['x-shop-id'] as string | undefined) ||
      (req.query?.['shopId'] as string | undefined);
    if (!shopId) return false; // scoped permissions must provide shopId

    const staff = await this.prisma.shopStaff.findUnique({
      where: { shopId_userId: { shopId, userId: user.sub } },
      select: { permissions: true },
    });
    if (!staff) return false;

    const userPerms = new Set<string>(staff.permissions || []);
    return required.every((p) => userPerms.has(p));
  }
}
