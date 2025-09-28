import { Controller, Get } from '@nestjs/common';

@Controller({ path: 'audit', version: '1' })
export class AuditController {
  @Get('health')
  health() {
    return { ok: true, module: 'audit' };
  }
}
