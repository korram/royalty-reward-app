import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtValidatePayload } from '../auth/strategies/jwt.strategy';
import { ApiStdResponses } from '../../common/docs/api-response.decorators';
import { ListQueryDto, SendMessageDto, StartConversationDto } from './dto/chat.dto';

@ApiTags('Chat')
@Controller({ path: 'chat', version: '1' })
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get('health')
  health() {
    return { ok: true, module: 'chat' };
  }

  // Buyer: start a conversation
  @Post('conversations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Start a conversation (buyer ↔ shop)' })
  @ApiStdResponses({ description: 'Created', schema: { example: { id: 'cid', status: 'OPEN' } } })
  start(@CurrentUser() user: JwtValidatePayload, @Body() dto: StartConversationDto) {
    return this.chat.start(user.sub, dto.shopId);
  }

  // Buyer: list own conversations
  @Get('conversations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'List my conversations' })
  @ApiStdResponses({ description: 'List', schema: { example: [] } })
  listMy(@CurrentUser() user: JwtValidatePayload, @Query() q: ListQueryDto) {
    const limit = q.limit ? Number(q.limit) : 20;
    const offset = q.offset ? Number(q.offset) : 0;
    return this.chat.listMy(user.sub, limit, offset);
  }

  // Shop: list conversations
  @Get('shops/:shopId/conversations')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('chat.read')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'List conversations for a shop' })
  @ApiStdResponses({ description: 'List', schema: { example: [] } })
  listShop(@Param('shopId') shopId: string, @Query() q: ListQueryDto) {
    const limit = q.limit ? Number(q.limit) : 20;
    const offset = q.offset ? Number(q.offset) : 0;
    return this.chat.listShopConversations(shopId, limit, offset);
  }

  // Messages
  @Get('conversations/:id/messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'List messages in a conversation' })
  @ApiStdResponses({ description: 'List', schema: { example: [] } })
  listMessages(
    @CurrentUser() user: JwtValidatePayload,
    @Param('id') id: string,
    @Query() q: ListQueryDto,
  ) {
    const limit = q.limit ? Number(q.limit) : 50;
    const offset = q.offset ? Number(q.offset) : 0;
    return this.chat.listMessages(user.sub, id, limit, offset);
  }

  @Post('conversations/:id/messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Send message in a conversation' })
  @ApiStdResponses({ description: 'Created', schema: { example: { id: 'mid' } } })
  sendMessage(@CurrentUser() user: JwtValidatePayload, @Param('id') id: string, @Body() dto: SendMessageDto) {
    return this.chat.sendMessage(user.sub, id, dto.body, dto.attachments);
  }

  @Post('conversations/:id/read')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Mark messages as read up to a message id' })
  @ApiStdResponses({ description: 'OK', schema: { example: { updated: 3 } } })
  markRead(
    @CurrentUser() user: JwtValidatePayload,
    @Param('id') id: string,
    @Query('readUpToId') readUpToId?: string,
  ) {
    return this.chat.markRead(user.sub, id, readUpToId);
  }
}
