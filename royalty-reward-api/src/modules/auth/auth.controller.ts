import { Controller, Get } from '@nestjs/common';

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  @Get('health')
  health() {
    return { ok: true, module: 'auth' };
  }
}
