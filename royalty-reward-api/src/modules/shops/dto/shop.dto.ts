import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString, IsUrl, MinLength } from 'class-validator';
import * as Prisma from '@prisma/client';

export class CreateShopDto {
  @ApiProperty({ minLength: 3 })
  @IsString()
  @MinLength(3)
  slug!: string;

  @ApiProperty({ minLength: 3 })
  @IsString()
  @MinLength(3)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Owner user id (optional, admin-set)' })
  @IsOptional()
  @IsString()
  ownerUserId?: string;
}

export class UpdateShopDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'INACTIVE'] })
  @IsOptional()
  @IsString()
  status?: string;
}

export class InviteStaffDto {
  @ApiProperty()
  @IsString()
  userId!: string;

  @ApiProperty({ enum: Prisma.ShopStaffRole, example: Prisma.ShopStaffRole.STAFF })
  @IsEnum(Prisma.ShopStaffRole)
  role!: Prisma.ShopStaffRole;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];
}

export class UpdateStaffDto {
  @ApiPropertyOptional({ enum: Prisma.ShopStaffRole, example: Prisma.ShopStaffRole.STAFF })
  @IsOptional()
  @IsEnum(Prisma.ShopStaffRole)
  role?: Prisma.ShopStaffRole;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];
}
