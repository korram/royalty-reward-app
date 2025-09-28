import { Controller, Get } from '@nestjs/common';

@Controller({ path: 'roles', version: '1' })
export class RolesController {
  @Get('health')
  health() {
    return { ok: true, module: 'roles' };
  }
}
