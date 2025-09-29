import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import * as Prisma from '@prisma/client';

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: Prisma.OrderStatus })
  @IsEnum(Prisma.OrderStatus)
  status!: Prisma.OrderStatus;
}
