import { Controller, Get } from '@nestjs/common';

@Controller({ path: 'orders', version: '1' })
export class OrdersController {
  @Get('health')
  health() {
    return { ok: true, module: 'orders' };
  }
}
