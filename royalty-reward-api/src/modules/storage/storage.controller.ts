import { Controller, Get } from '@nestjs/common';

@Controller({ path: 'storage', version: '1' })
export class StorageController {
  @Get('health')
  health() {
    return { ok: true, module: 'storage' };
  }
}
