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
import { ReviewsService } from './reviews.service';
import { CreateReviewDto, ProductReviewsQueryDto, ReplyReviewDto, UpdateReviewStatusDto } from './dto/review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtValidatePayload } from '../auth/strategies/jwt.strategy';
import { ApiStdResponses } from '../../common/docs/api-response.decorators';

@ApiTags('Reviews')
@Controller({ path: 'reviews', version: '1' })
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get('health')
  health() {
    return { ok: true, module: 'reviews' };
  }

  // Public: list by product
  @Get('products/:productId')
  @ApiOperation({ summary: 'List published reviews by product' })
  @ApiStdResponses({ description: 'List', schema: { example: { items: [], total: 0, limit: 20, offset: 0 } } })
  listByProduct(@Param('productId') productId: string, @Query() q: ProductReviewsQueryDto) {
    return this.reviews.listByProduct(productId, q);
  }

  // Customer: create
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create review (only if purchased and order COMPLETED)' })
  @ApiStdResponses({ description: 'Created', schema: { example: { id: 'rid', status: 'PENDING' } } })
  create(@CurrentUser() user: JwtValidatePayload, @Body() dto: CreateReviewDto) {
    return this.reviews.create(user.sub, dto);
  }

  // Shop moderation
  @Get('shops/:shopId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('reviews.read')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'List reviews for a shop (all statuses)' })
  @ApiStdResponses({ description: 'List', schema: { example: { items: [], total: 0, limit: 20, offset: 0 } } })
  listShop(@Param('shopId') shopId: string, @Query() q: { limit?: number; offset?: number }) {
    return this.reviews.listShopReviews(shopId, q);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Update review status (ADMIN)' })
  @ApiStdResponses({ description: 'Updated', schema: { example: { id: 'rid', status: 'PUBLISHED' } } })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateReviewStatusDto) {
    return this.reviews.updateStatus(id, dto.status);
  }

  @Post(':id/reply')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('reviews.reply')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Reply to review (shop staff)' })
  @ApiStdResponses({ description: 'Updated', schema: { example: { id: 'rid', repliedByShopUserId: 'uid' } } })
  reply(@CurrentUser() user: JwtValidatePayload, @Param('id') id: string, @Body() _dto: ReplyReviewDto) {
    return this.reviews.reply(user.sub, id);
  }
}
