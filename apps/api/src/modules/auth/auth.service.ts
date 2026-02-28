import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { UserDocument } from '../users/schemas/user.schema';
import { Profile } from 'passport-github2';
import { TokenResponse } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private usersService: UsersService,
  ) {}

  async validateGithubUser(
    accessToken: string,
    profile: Profile,
  ): Promise<UserDocument> {
    const githubId = profile.id;
    const email =
      profile.emails?.[0]?.value || `${profile.username}@github.local`;

    const user = await this.usersService.upsertByGithubId(githubId, {
      githubId,
      username: profile.username || profile.displayName,
      email,
      avatarUrl: profile.photos?.[0]?.value,
      accessToken, // Store GitHub access token (should be encrypted in production)
    });

    return user;
  }

  async generateTokens(user: UserDocument): Promise<TokenResponse> {
    const payload = {
      sub: user._id.toString(),
      username: user.username,
      email: user.email,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: this.configService.get<string>('jwt.expiresIn'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: this.configService.get<string>('jwt.refreshExpiresIn'),
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 3600, // 1 hour in seconds
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  async refreshTokens(refreshToken: string): Promise<TokenResponse | null> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        return null;
      }

      return this.generateTokens(user);
    } catch {
      return null;
    }
  }
}
