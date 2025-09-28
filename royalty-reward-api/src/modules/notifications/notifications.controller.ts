import { Controller, Get } from '@nestjs/common';

@Controller({ path: 'notifications', version: '1' })
export class NotificationsController {
  @Get('health')
  health() {
    return { ok: true, module: 'notifications' };
  }
}
