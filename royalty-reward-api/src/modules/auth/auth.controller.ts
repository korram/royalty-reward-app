import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import {
  ForgotDto,
  LoginDto,
  RefreshDto,
  RegisterDto,
  ResetDto,
  VerifyEmailDto,
  OAuthLoginDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';
// import { JwtValidatePayload } from './strategies/jwt.strategy';
import type { JwtValidatePayload } from './strategies/jwt.strategy';

@ApiTags('Auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Get('health')
  health() {
    return { ok: true, module: 'auth' };
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register with email & password' })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.register(dto);
    this.setRefreshCookie(res, result.tokens.refreshToken);
    return result;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email & password' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.login(dto);
    this.setRefreshCookie(res, result.tokens.refreshToken);
    return result;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth('refresh_token')
  @ApiOperation({ summary: 'Rotate refresh token and issue new access token' })
  async refresh(
    @Body() dto: RefreshDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookieToken = this.getCookie(req, 'refresh_token');
    const result = await this.auth.refresh({ ...dto, cookieToken });
    this.setRefreshCookie(res, result.tokens.refreshToken);
    return result;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Logout and revoke all refresh tokens' })
  async logout(
    @CurrentUser() user: JwtValidatePayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.auth.logout(user.sub);
    res.clearCookie('refresh_token', { path: '/' });
    return { success: true };
  }

  @Post('forgot')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset email' })
  async forgot(@Body() dto: ForgotDto) {
    return this.auth.forgot(dto);
  }

  @Post('reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  async reset(@Body() dto: ResetDto) {
    return this.auth.reset(dto);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email with token' })
  async verify(@Body() dto: VerifyEmailDto) {
    return this.auth.verifyEmail(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOkResponse({ description: 'Current user profile' })
  async me(@CurrentUser() user: JwtValidatePayload) {
    return this.auth.me(user.sub);
  }

  private setRefreshCookie(res: Response, token: string) {
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('refresh_token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'strict' : 'lax',
      path: '/',
    });
  }

  private getCookie(req: Request, name: string): string | undefined {
    const cookie = req.headers.cookie;
    if (!cookie) return undefined;
    const parts = cookie.split(/;\s*/);
    for (const p of parts) {
      const [k, ...v] = p.split('=');
      if (k === name) return decodeURIComponent(v.join('='));
    }
    return undefined;
  }

  // @Post('verify-facebook')
  // @HttpCode(HttpStatus.OK)
  // @ApiOperation({ summary: 'Verify Facebook access token' })
  // async verifyFacebookAccessToken(
  //   @Body() dto: OAuthLoginDto,
  //   @Res({ passthrough: true }) res: Response,
  // ) {
  //   const result = await this.auth.verifyGoogleIdToken(dto);
  //   this.setRefreshCookie(res, result);
  //   return result;
  // }

  // @Post('verify-google')
  // @HttpCode(HttpStatus.OK)
  // @ApiOperation({ summary: 'Verify Google ID token' })
  // async verifyGoogleIdToken(
  //   @Body() dto: OAuthLoginDto,
  //   @Res({ passthrough: true }) res: Response,
  // ) {
  //   const result = await this.auth.verifyFacebookAccessToken(dto);
  //   this.setRefreshCookie(res, result.tokens.refreshToken);
  //   return result;
  // }
  
}
