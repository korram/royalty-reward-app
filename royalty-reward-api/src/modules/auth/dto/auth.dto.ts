import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;
}

export class LoginDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  password!: string;
}

export class ForgotDto {
  @ApiProperty()
  @IsEmail()
  email!: string;
}

export class ResetDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;
}

export class VerifyEmailDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token!: string;
}

export class RefreshDto {
  @ApiProperty({
    required: false,
    description: 'Optional if refresh_token cookie is present',
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}

export type JwtUser = {
  sub: string;
  email: string;
  roles: string[];
};

export type Tokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds for access token
};
