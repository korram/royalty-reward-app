import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CheckoutDto {
  @ApiPropertyOptional({ description: 'Shipping address ID (optional)' })
  @IsOptional()
  @IsString()
  shippingAddressId?: string;

  @ApiPropertyOptional({ description: 'Billing address ID (optional)' })
  @IsOptional()
  @IsString()
  billingAddressId?: string;
}
