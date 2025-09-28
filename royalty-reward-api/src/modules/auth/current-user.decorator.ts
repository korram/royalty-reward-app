import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { JwtValidatePayload } from './strategies/jwt.strategy';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtValidatePayload => {
    const req = ctx
      .switchToHttp()
      .getRequest<Request & { user: JwtValidatePayload }>();
    return req.user;
  },
);
