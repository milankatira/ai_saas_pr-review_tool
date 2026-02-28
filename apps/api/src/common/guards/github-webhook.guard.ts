import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';

@Injectable()
export class GithubWebhookGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const signature = request.headers['x-hub-signature-256'];

    if (!signature) {
      throw new UnauthorizedException('Missing GitHub signature header');
    }

    const secret = this.configService.get<string>('github.webhookSecret');
    if (!secret) {
      throw new UnauthorizedException('Webhook secret not configured');
    }

    const rawBody = request.rawBody;
    if (!rawBody) {
      throw new UnauthorizedException('Missing request body');
    }

    const expectedSignature =
      'sha256=' +
      createHmac('sha256', secret).update(rawBody).digest('hex');

    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
      throw new UnauthorizedException('Invalid GitHub signature');
    }

    return true;
  }
}
