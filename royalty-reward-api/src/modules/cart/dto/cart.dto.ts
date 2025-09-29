import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class AddItemDto {
  @ApiProperty({ description: 'Variant ID to add' })
  @IsString()
  variantId!: string;

  @ApiPropertyOptional({ description: 'Optional product ID validation' })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiProperty({ minimum: 1, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  qty: number = 1;
}

export class UpdateItemDto {
  @ApiProperty({ minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  qty!: number;
}

export class MergeCartDto {
  @ApiProperty({ description: 'Guest session cart key' })
  @IsString()
  sessionKey!: string;
}

export class SetCurrencyDto {
  @ApiProperty({ description: 'ISO 4217 currency code, e.g. THB' })
  @IsString()
  currency!: string;
}
