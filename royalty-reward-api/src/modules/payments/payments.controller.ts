import { Controller, Get } from '@nestjs/common';

@Controller({ path: 'payments', version: '1' })
export class PaymentsController {
  @Get('health')
  health() {
    return { ok: true, module: 'payments' };
  }
}
