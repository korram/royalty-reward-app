import { Controller, Get } from '@nestjs/common';

@Controller({ path: 'chat', version: '1' })
export class ChatController {
  @Get('health')
  health() {
    return { ok: true, module: 'chat' };
  }
}
