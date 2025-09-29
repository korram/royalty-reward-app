import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtValidatePayload } from '../auth/strategies/jwt.strategy';
import { CreatePaymentIntentDto } from './dto/create-intent.dto';
import { ApiStdResponses } from '../../common/docs/api-response.decorators';

@ApiTags('Payments')
@Controller({ path: 'payments', version: '1' })
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get('health')
  health() {
    return { ok: true, module: 'payments' };
  }

  // Create payment intent for an order
  @Post('orders/:orderId/intents')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create payment intent for an order' })
  @ApiStdResponses({ description: 'Intent', schema: { example: { id: 'pi_xxx', clientSecret: 'pi_xxx_secret_xxx' } } })
  createIntent(
    @CurrentUser() user: JwtValidatePayload,
    @Param('orderId') orderId: string,
    @Body() dto: CreatePaymentIntentDto,
  ) {
    return this.payments.createIntent(user.sub, orderId, dto);
  }

  // Webhook receiver (provider-agnostic)
  @Post('webhooks/:provider')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Payment provider webhook (provider-agnostic)' })
  @ApiStdResponses({ description: 'OK', schema: { example: { ok: true } } })
  webhook(@Param('provider') provider: string, @Headers('x-signature') sig: string | undefined, @Body() body: unknown) {
    return this.payments.handleWebhook(provider, sig, body);
  }
}
