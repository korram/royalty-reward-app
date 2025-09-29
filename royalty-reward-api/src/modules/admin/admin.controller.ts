import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiStdResponses } from '../../common/docs/api-response.decorators';

@ApiTags('Admin')
@Controller({ path: 'admin', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth('JWT')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('stats/overview')
  @ApiOperation({ summary: 'Overview stats' })
  @ApiStdResponses({ description: 'Overview', schema: { example: { gmvTotal: 1234.56, aov: 123.45 } } })
  overview(@Query('from') from?: string, @Query('to') to?: string) {
    return this.admin.overview(from ? new Date(from) : undefined, to ? new Date(to) : undefined);
  }

  @Get('stats/top-skus')
  @ApiOperation({ summary: 'Top SKUs by revenue' })
  @ApiStdResponses({ description: 'List', schema: { example: [] } })
  topSkus(@Query('from') from?: string, @Query('to') to?: string, @Query('limit') limit?: string) {
    return this.admin.topSkus(from ? new Date(from) : undefined, to ? new Date(to) : undefined, limit ? Number(limit) : 10);
  }

  @Get('stats/shops')
  @ApiOperation({ summary: 'Per-shop aggregates' })
  @ApiStdResponses({ description: 'List', schema: { example: [] } })
  byShop(@Query('from') from?: string, @Query('to') to?: string) {
    return this.admin.byShop(from ? new Date(from) : undefined, to ? new Date(to) : undefined);
  }
}
