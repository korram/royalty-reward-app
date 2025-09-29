import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtValidatePayload } from '../auth/strategies/jwt.strategy';
import { ApiStdResponses } from '../../common/docs/api-response.decorators';

@ApiTags('Notifications')
@Controller({ path: 'notifications', version: '1' })
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get('health')
  health() {
    return { ok: true, module: 'notifications' };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'List notifications' })
  @ApiStdResponses({ description: 'List', schema: { example: { items: [], total: 0, limit: 20, offset: 0 } } })
  list(
    @CurrentUser() user: JwtValidatePayload,
    @Query('unreadOnly') unreadOnly?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.notifications.list(user.sub, {
      unreadOnly: unreadOnly === 'true',
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }

  @Post(':id/read')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiStdResponses({ description: 'Updated', schema: { example: { id: 'nid', readAt: new Date().toISOString() } } })
  markRead(@CurrentUser() user: JwtValidatePayload, @Param('id') id: string) {
    return this.notifications.markRead(user.sub, id);
  }

  @Post('read-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiStdResponses({ description: 'OK', schema: { example: { success: true } } })
  markAllRead(@CurrentUser() user: JwtValidatePayload) {
    return this.notifications.markAllRead(user.sub);
  }
}
