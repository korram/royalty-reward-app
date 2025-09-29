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
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtValidatePayload } from '../auth/strategies/jwt.strategy';
import { AddItemDto, MergeCartDto, SetCurrencyDto, UpdateItemDto } from './dto/cart.dto';
import { ApiStdResponses } from '../../common/docs/api-response.decorators';

@ApiTags('Cart')
@Controller({ path: 'cart', version: '1' })
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Get('health')
  health() {
    return { ok: true, module: 'cart' };
  }

  // User cart (JWT)
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get or create my cart' })
  @ApiStdResponses({ description: 'Cart', schema: { example: { id: 'cid', currency: 'THB', items: [], subtotal: 0 } } })
  me(@CurrentUser() user: JwtValidatePayload) {
    return this.cart.getOrCreateUserCart(user.sub);
  }

  @Post('me/currency')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set my cart currency' })
  @ApiStdResponses({ description: 'Updated', schema: { example: { id: 'cid', currency: 'THB' } } })
  setMyCurrency(@CurrentUser() user: JwtValidatePayload, @Body() dto: SetCurrencyDto) {
    return this.cart.setUserCartCurrency(user.sub, dto.currency);
  }

  @Post('me/items')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add item to my cart' })
  @ApiStdResponses({ description: 'Cart', schema: { example: { id: 'cid', items: [{ id: 'iid', qty: 2 }] } } })
  addMyItem(@CurrentUser() user: JwtValidatePayload, @Body() dto: AddItemDto) {
    return this.cart.addUserItem(user.sub, dto);
  }

  @Patch('me/items/:itemId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Update my cart item qty (0 to remove)' })
  @ApiStdResponses({ description: 'Cart', schema: { example: { id: 'cid', items: [] } } })
  updateMyItem(
    @CurrentUser() user: JwtValidatePayload,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateItemDto,
  ) {
    return this.cart.updateUserItem(user.sub, itemId, dto);
  }

  @Delete('me/items/:itemId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove my cart item' })
  @ApiStdResponses({ description: 'No content', schema: { example: {} } })
  async removeMyItem(@CurrentUser() user: JwtValidatePayload, @Param('itemId') itemId: string) {
    await this.cart.removeUserItem(user.sub, itemId);
    return {};
  }

  @Post('me/merge')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Merge session cart into my cart' })
  @ApiStdResponses({ description: 'Merged', schema: { example: { merged: 2 } } })
  merge(@CurrentUser() user: JwtValidatePayload, @Body() dto: MergeCartDto) {
    return this.cart.mergeSessionIntoUser(user.sub, dto.sessionKey);
  }

  // Session cart (guest)
  @Post('session/:sessionKey')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create guest cart for a session key' })
  @ApiStdResponses({ description: 'Created', schema: { example: { id: 'cid', sessionKey: 'sess', currency: 'THB' } } })
  createSession(@Param('sessionKey') sessionKey: string, @Body() dto: SetCurrencyDto) {
    return this.cart.createSessionCart(sessionKey, dto.currency);
  }

  @Get('session/:sessionKey')
  @ApiOperation({ summary: 'Get guest session cart' })
  @ApiStdResponses({ description: 'Cart', schema: { example: { id: 'cid', items: [], subtotal: 0 } } })
  getSession(@Param('sessionKey') sessionKey: string) {
    return this.cart.getSessionCart(sessionKey);
  }

  @Post('session/:sessionKey/currency')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set currency for guest session cart' })
  @ApiStdResponses({ description: 'Updated', schema: { example: { id: 'cid', currency: 'THB' } } })
  setSessionCurrency(@Param('sessionKey') sessionKey: string, @Body() dto: SetCurrencyDto) {
    return this.cart.setSessionCartCurrency(sessionKey, dto.currency);
  }

  @Post('session/:sessionKey/items')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add item to guest session cart' })
  @ApiStdResponses({ description: 'Cart', schema: { example: { id: 'cid', items: [{ id: 'iid', qty: 1 }] } } })
  addSessionItem(@Param('sessionKey') sessionKey: string, @Body() dto: AddItemDto) {
    return this.cart.addSessionItem(sessionKey, dto);
  }

  @Patch('session/:sessionKey/items/:itemId')
  @ApiOperation({ summary: 'Update qty of guest session cart item (0 to remove)' })
  @ApiStdResponses({ description: 'Cart', schema: { example: { id: 'cid', items: [] } } })
  updateSessionItem(
    @Param('sessionKey') sessionKey: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateItemDto,
  ) {
    return this.cart.updateSessionItem(sessionKey, itemId, dto);
  }

  @Delete('session/:sessionKey/items/:itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove item from guest session cart' })
  @ApiStdResponses({ description: 'No content', schema: { example: {} } })
  async removeSessionItem(@Param('sessionKey') sessionKey: string, @Param('itemId') itemId: string) {
    await this.cart.removeSessionItem(sessionKey, itemId);
    return {};
  }
}
