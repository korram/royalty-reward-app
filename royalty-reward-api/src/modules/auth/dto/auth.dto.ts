import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  IsEnum
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export const OAUTH_PROVIDERS = ['google', 'facebook'] as const;
export type OAuthProviderParam = (typeof OAUTH_PROVIDERS)[number];

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


export class OAuthLoginDto {
  @ApiProperty({ enum: OAUTH_PROVIDERS })
  @IsEnum(OAUTH_PROVIDERS)
  provider!: OAuthProviderParam;

  // google: ใช้ idToken, facebook: ใช้ accessToken
  @ApiProperty({ description: 'Google idToken หรือ Facebook accessToken' })
  @IsString()
  token!: string;

  @ApiPropertyOptional({ description: 'optional: ชื่อที่ได้จาก provider' })
  @IsOptional()
  @IsString()
  name?: string;
}

export class OAuthUnlinkDto {
  @ApiProperty({ enum: OAUTH_PROVIDERS })
  @IsEnum(OAUTH_PROVIDERS)
  provider!: OAuthProviderParam;
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
