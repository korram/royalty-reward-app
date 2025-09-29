import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNumberString, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVariantDto {
  @ApiProperty({ minLength: 1 })
  @IsString()
  @MinLength(1)
  sku!: string;

  @ApiProperty({ description: 'Decimal as string, e.g. 199.99' })
  @IsString()
  price!: string;

  @ApiProperty({ minLength: 3, maxLength: 3, example: 'THB' })
  @IsString()
  currency!: string;

  @ApiPropertyOptional({ description: 'JSON object of attributes' })
  @IsOptional()
  attrs?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Compare-at price as string' })
  @IsOptional()
  @IsString()
  compareAtPrice?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stockQty?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateVariantDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ description: 'Decimal as string' })
  @IsOptional()
  @IsString()
  price?: string;

  @ApiPropertyOptional({ minLength: 3, maxLength: 3 })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'JSON object of attributes' })
  @IsOptional()
  attrs?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Compare-at price as string' })
  @IsOptional()
  @IsString()
  compareAtPrice?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stockQty?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
