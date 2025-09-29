import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtValidatePayload } from '../auth/strategies/jwt.strategy';
import { ApiStdResponses } from '../../common/docs/api-response.decorators';
import { CreateAddressDto, PatchMeDto, UpdateAddressDto } from './dto/users.dto';

@ApiTags('Users')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('health')
  health() {
    return { ok: true, module: 'users' };
  }

  @Get('me')
  @ApiOperation({ summary: 'Current user profile' })
  @ApiStdResponses({
    description: 'Profile',
    schema: {
      example: {
        id: 'cuid',
        email: 'user@example.com',
        name: 'User',
        phone: null,
        avatar: null,
        status: 'VERIFIED',
      },
    },
  })
  async getMe(@CurrentUser() user: JwtValidatePayload) {
    const me = await this.users.findById(user.sub);
    return me ? { ...me, passwordHash: undefined } : null;
  }

  @Patch('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiStdResponses({
    description: 'Updated profile',
    schema: {
      example: {
        id: 'cuid',
        email: 'user@example.com',
        name: 'Updated',
        phone: '0812345678',
      },
    },
  })
  async patchMe(
    @Body() dto: PatchMeDto,
    @CurrentUser() user: JwtValidatePayload,
  ) {
    const updated = await this.users.updateMe(user.sub, dto);
    return { ...updated, passwordHash: undefined };
  }

  // Addresses
  @Get('addresses')
  @ApiOperation({ summary: 'List my addresses' })
  @ApiStdResponses({
    description: 'Addresses',
    schema: { example: [{ id: 'cuid', label: 'Home', line1: '...', district: '...', province: '...', country: 'TH', postcode: '10110', isDefault: true }] },
  })
  async listAddresses(@CurrentUser() user: JwtValidatePayload) {
    return this.users.listAddresses(user.sub);
  }

  @Post('addresses')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create address' })
  @ApiStdResponses(
    {
      description: 'Created address',
      schema: { example: { id: 'cuid', label: 'Home', line1: '...', district: '...', province: '...', country: 'TH', postcode: '10110', isDefault: true } },
    },
    { description: 'Created', schema: { example: { id: 'cuid' } } },
  )
  async createAddress(
    @Body() dto: CreateAddressDto,
    @CurrentUser() user: JwtValidatePayload,
  ) {
    return this.users.createAddress(user.sub, dto);
  }

  @Patch('addresses/:id')
  @ApiOperation({ summary: 'Update address' })
  @ApiStdResponses({ description: 'Updated address', schema: { example: { id: 'cuid', label: 'Office' } } })
  async updateAddress(
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
    @CurrentUser() user: JwtValidatePayload,
  ) {
    return this.users.updateAddress(user.sub, id, dto);
  }

  @Delete('addresses/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete address' })
  @ApiStdResponses({ description: 'No content', schema: { example: {} } })
  async deleteAddress(
    @Param('id') id: string,
    @CurrentUser() user: JwtValidatePayload,
  ) {
    await this.users.deleteAddress(user.sub, id);
    return {};
  }
}
