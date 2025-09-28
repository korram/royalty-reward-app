import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import { RedisService } from './redis.service';

@Module({
  imports: [
    // Global config so ConfigService can be injected anywhere
    ConfigModule.forRoot({ isGlobal: true }),
  ],
  providers: [PrismaService, RedisService],
  exports: [PrismaService, RedisService],
})
export class CommonModule {}
