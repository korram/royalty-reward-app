import { Controller, Get } from '@nestjs/common';

@Controller({ path: 'search', version: '1' })
export class SearchController {
  @Get('health')
  health() {
    return { ok: true, module: 'search' };
  }
}
