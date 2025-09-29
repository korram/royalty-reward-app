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
import { WishlistService } from './wishlist.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtValidatePayload } from '../auth/strategies/jwt.strategy';
import { AddWishlistItemDto, CreateWishlistDto, UpdateWishlistDto } from './dto/wishlist.dto';
import { ApiStdResponses } from '../../common/docs/api-response.decorators';

@ApiTags('Wishlist')
@Controller({ path: 'wishlist', version: '1' })
export class WishlistController {
  constructor(private readonly wishlist: WishlistService) {}

  @Get('health')
  health() {
    return { ok: true, module: 'wishlist' };
  }

  // Wishlists
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'List my wishlists' })
  @ApiStdResponses({ description: 'List', schema: { example: [{ id: 'wid', name: 'Favorites' }] } })
  list(@CurrentUser() user: JwtValidatePayload) {
    return this.wishlist.listMy(user.sub);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create wishlist' })
  @ApiStdResponses({ description: 'Created', schema: { example: { id: 'wid', name: 'Favorites' } } })
  create(@CurrentUser() user: JwtValidatePayload, @Body() dto: CreateWishlistDto) {
    return this.wishlist.create(user.sub, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Rename wishlist' })
  @ApiStdResponses({ description: 'Updated', schema: { example: { id: 'wid', name: 'New name' } } })
  update(@CurrentUser() user: JwtValidatePayload, @Param('id') id: string, @Body() dto: UpdateWishlistDto) {
    return this.wishlist.update(user.sub, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete wishlist' })
  @ApiStdResponses({ description: 'No content', schema: { example: {} } })
  async remove(@CurrentUser() user: JwtValidatePayload, @Param('id') id: string) {
    await this.wishlist.remove(user.sub, id);
    return {};
  }

  // Items
  @Get(':id/items')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'List wishlist items' })
  @ApiStdResponses({ description: 'List', schema: { example: [{ id: 'itemId', productId: 'pid' }] } })
  listItems(@CurrentUser() user: JwtValidatePayload, @Param('id') id: string) {
    return this.wishlist.listItems(user.sub, id);
  }

  @Post(':id/items')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add item to wishlist' })
  @ApiStdResponses({ description: 'Created', schema: { example: { id: 'itemId' } } })
  addItem(@CurrentUser() user: JwtValidatePayload, @Param('id') id: string, @Body() dto: AddWishlistItemDto) {
    return this.wishlist.addItem(user.sub, id, dto);
  }

  @Delete(':id/items/:itemId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove wishlist item' })
  @ApiStdResponses({ description: 'No content', schema: { example: {} } })
  async removeItem(
    @CurrentUser() user: JwtValidatePayload,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
  ) {
    await this.wishlist.removeItem(user.sub, id, itemId);
    return {};
  }
}
