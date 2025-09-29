import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreatePaymentIntentDto {
  @ApiProperty({ description: 'Payment provider, e.g. stripe, omise, promptpay' })
  @IsString()
  provider!: string;

  @ApiPropertyOptional({ description: 'Return URL after payment (if applicable)' })
  @IsOptional()
  @IsString()
  returnUrl?: string;
}
