import { Controller, Get } from '@nestjs/common';

@Controller({ path: 'cart', version: '1' })
export class CartController {
  @Get('health')
  health() {
    return { ok: true, module: 'cart' };
  }
}
