import { Controller, Get } from '@nestjs/common';

@Controller({ path: 'shops', version: '1' })
export class ShopsController {
  @Get('health')
  health() {
    return { ok: true, module: 'shops' };
  }
}
