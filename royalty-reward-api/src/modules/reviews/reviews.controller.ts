import { Controller, Get } from '@nestjs/common';

@Controller({ path: 'reviews', version: '1' })
export class ReviewsController {
  @Get('health')
  health() {
    return { ok: true, module: 'reviews' };
  }
}
