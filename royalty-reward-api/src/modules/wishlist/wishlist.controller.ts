import { Controller, Get } from '@nestjs/common';

@Controller({ path: 'wishlist', version: '1' })
export class WishlistController {
  @Get('health')
  health() {
    return { ok: true, module: 'wishlist' };
  }
}
