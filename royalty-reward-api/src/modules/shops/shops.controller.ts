import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ShopsService } from './shops.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { ApiStdResponses } from '../../common/docs/api-response.decorators';
import {
  CreateShopDto,
  InviteStaffDto,
  UpdateShopDto,
  UpdateStaffDto,
} from './dto/shop.dto';
import { LimitOffsetDto } from '../../common/dto/pagination.dto';

@ApiTags('Shops')
@Controller({ path: 'shops', version: '1' })
export class ShopsController {
  constructor(private readonly shops: ShopsService) {}

  @Get('health')
  health() {
    return { ok: true, module: 'shops' };
  }

  // Admin list
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'List all shops (ADMIN)' })
  @ApiStdResponses({
    description: 'List shops',
    schema: { example: { items: [{ id: 'cuid', slug: 'my-shop', name: 'My Shop' }], total: 1, limit: 20, offset: 0 } },
  })
  async list(@Query() q: LimitOffsetDto) {
    return this.shops.adminList(q);
  }

  // Admin create
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create shop (ADMIN)' })
  @ApiStdResponses(
    { description: 'Created shop', schema: { example: { id: 'cuid', slug: 'new-shop', name: 'New Shop' } } },
    { description: 'Created', schema: { example: { id: 'cuid' } } },
  )
  async create(@Body() dto: CreateShopDto) {
    return this.shops.create(dto);
  }

  // Public get by id/slug
  @Get(':idOrSlug')
  @ApiOperation({ summary: 'Get shop by id or slug (public)' })
  @ApiStdResponses({ description: 'Shop', schema: { example: { id: 'cuid', slug: 'my-shop', name: 'My Shop' } } })
  async getOne(@Param('idOrSlug') idOrSlug: string) {
    return this.shops.findByIdOrSlug(idOrSlug);
  }

  // Admin update
  @Patch(':shopId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Update shop (ADMIN)' })
  @ApiStdResponses({ description: 'Updated shop', schema: { example: { id: 'cuid', name: 'Updated Shop' } } })
  async update(@Param('shopId') shopId: string, @Body() dto: UpdateShopDto) {
    return this.shops.adminUpdate(shopId, dto);
  }

  // Admin delete
  @Delete(':shopId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete shop (ADMIN)' })
  @ApiStdResponses({ description: 'No content', schema: { example: {} } })
  async remove(@Param('shopId') shopId: string) {
    await this.shops.adminDelete(shopId);
    return {};
  }

  // Staff management (owner/admin via PermissionsGuard; ADMIN allowed via RolesGuard bypass)
  @Get(':shopId/staff')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('staff.read')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'List staff (owner/admin)' })
  @ApiStdResponses({ description: 'Staff list', schema: { example: [{ userId: 'uid', role: 'STAFF', permissions: [] }] } })
  async listStaff(@Param('shopId') shopId: string) {
    return this.shops.listStaff(shopId);
  }

  @Post(':shopId/staff')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('staff.create')
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Invite/add staff (owner/admin)' })
  @ApiStdResponses(
    { description: 'Created staff', schema: { example: { shopId: 'sid', userId: 'uid', role: 'STAFF', permissions: [] } } },
    { description: 'Created', schema: { example: { shopId: 'sid', userId: 'uid' } } },
  )
  async addStaff(@Param('shopId') shopId: string, @Body() dto: InviteStaffDto) {
    return this.shops.addStaff(shopId, dto);
  }

  @Patch(':shopId/staff/:userId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('staff.update')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Update staff (owner/admin)' })
  @ApiStdResponses({ description: 'Updated staff', schema: { example: { shopId: 'sid', userId: 'uid', role: 'OWNER' } } })
  async updateStaff(
    @Param('shopId') shopId: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateStaffDto,
  ) {
    return this.shops.updateStaff(shopId, userId, dto);
  }

  @Delete(':shopId/staff/:userId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('staff.delete')
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove staff (owner/admin)' })
  @ApiStdResponses({ description: 'No content', schema: { example: {} } })
  async removeStaff(@Param('shopId') shopId: string, @Param('userId') userId: string) {
    await this.shops.removeStaff(shopId, userId);
    return {};
  }
}
