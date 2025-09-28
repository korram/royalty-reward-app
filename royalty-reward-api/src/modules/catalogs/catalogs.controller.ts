import { Controller, Get } from '@nestjs/common';

@Controller({ path: 'catalogs', version: '1' })
export class CatalogsController {
  @Get('health')
  health() {
    return { ok: true, module: 'catalogs' };
  }
}
