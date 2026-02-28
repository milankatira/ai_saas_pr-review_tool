import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Res,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { RefreshTokenDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubAuth() {
    // Guard redirects to GitHub
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubCallback(@Req() req: any, @Res() res: Response) {
    const { accessToken, profile } = req.user;

    const user = await this.authService.validateGithubUser(accessToken, profile);
    const tokens = await this.authService.generateTokens(user);

    // Redirect to frontend with tokens
    const frontendUrl = this.configService.get<string>('frontendUrl');
    const redirectUrl = new URL('/auth/callback', frontendUrl);
    redirectUrl.searchParams.set('token', tokens.accessToken);
    redirectUrl.searchParams.set('refreshToken', tokens.refreshToken);

    res.redirect(redirectUrl.toString());
  }

  @Post('refresh')
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    const tokens = await this.authService.refreshTokens(
      refreshTokenDto.refreshToken,
    );

    if (!tokens) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return tokens;
  }

  @Post('logout')
  async logout() {
    // In a production app, you might want to blacklist the refresh token
    return { message: 'Logged out successfully' };
  }
}
