import {
  Body,
  Controller,
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
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtValidatePayload } from '../auth/strategies/jwt.strategy';
import { CheckoutDto } from './dto/checkout.dto';
import { UpdateOrderStatusDto } from './dto/update-status.dto';
import { ApiStdResponses } from '../../common/docs/api-response.decorators';
import { LimitOffsetDto } from '../../common/dto/pagination.dto';

@ApiTags('Orders')
@Controller({ path: 'orders', version: '1' })
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get('health')
  health() {
    return { ok: true, module: 'orders' };
  }

  // Checkout
  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Checkout current cart into an order (single-shop)' })
  @ApiStdResponses({ description: 'Order', schema: { example: { id: 'oid', code: 'ORD-XXXX', status: 'PENDING' } } })
  checkout(@CurrentUser() user: JwtValidatePayload, @Body() dto: CheckoutDto) {
    return this.orders.checkout(user.sub, dto);
  }

  // Customer list/detail
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'List my orders' })
  @ApiStdResponses({ description: 'List', schema: { example: { items: [], total: 0, limit: 20, offset: 0 } } })
  listMy(@CurrentUser() user: JwtValidatePayload, @Query() q: LimitOffsetDto) {
    return this.orders.listMy(user.sub, q);
  }

  @Get('me/:orderId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get my order detail' })
  @ApiStdResponses({ description: 'Order', schema: { example: { id: 'oid', items: [] } } })
  getMy(@CurrentUser() user: JwtValidatePayload, @Param('orderId') orderId: string) {
    return this.orders.getMy(user.sub, orderId);
  }

  // Shop list
  @Get('shops/:shopId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('orders.read')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'List shop orders' })
  @ApiStdResponses({ description: 'List', schema: { example: { items: [], total: 0, limit: 20, offset: 0 } } })
  listShop(@Param('shopId') shopId: string, @Query() q: LimitOffsetDto) {
    return this.orders.listShop(shopId, q);
  }

  // Admin list/detail
  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'List all orders (ADMIN)' })
  @ApiStdResponses({ description: 'List', schema: { example: { items: [], total: 0, limit: 20, offset: 0 } } })
  listAdmin(@Query() q: LimitOffsetDto) {
    return this.orders.listAdmin(q);
  }

  @Get('admin/:orderId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get order (ADMIN)' })
  @ApiStdResponses({ description: 'Order', schema: { example: { id: 'oid', items: [] } } })
  getAdmin(@Param('orderId') orderId: string) {
    return this.orders.getAdmin(orderId);
  }

  // Update status (ADMIN)
  @Patch('admin/:orderId/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Update order status (ADMIN)' })
  @ApiStdResponses({ description: 'Order', schema: { example: { id: 'oid', status: 'PAID' } } })
  updateStatusAdmin(@Param('orderId') orderId: string, @Body() dto: UpdateOrderStatusDto) {
    return this.orders.updateStatus(orderId, dto.status);
  }
}
