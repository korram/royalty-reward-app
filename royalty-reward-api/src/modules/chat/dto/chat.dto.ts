import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class StartConversationDto {
  @ApiProperty()
  @IsString()
  shopId!: string;
}

export class SendMessageDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  body!: string;

  @ApiPropertyOptional({ description: 'Arbitrary JSON' })
  @IsOptional()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  attachments?: any;
}

export class ListQueryDto {
  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  // string here; controller should cast with Number()
  limit?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  offset?: string;
}
