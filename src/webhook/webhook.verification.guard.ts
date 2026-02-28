import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import { Request } from 'express';

@Injectable()
export class WebhookSignatureGuard implements CanActivate {
  constructor(private config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { rawBody?: Buffer }>();
    const signature = request.headers['x-hub-signature-256'] as string;
    const appSecret = this.config.get<string>('meta.appSecret') ?? '';

    if (!signature) {
      throw new UnauthorizedException('Missing webhook signature');
    }

    if (!appSecret) {
      console.warn('META_APP_SECRET not set - skipping webhook signature verification');
      return true;
    }

    const rawBody = request.rawBody ?? Buffer.from(JSON.stringify(request.body ?? {}));
    const expectedSignature = `sha256=${createHmac('sha256', appSecret)
      .update(rawBody)
      .digest('hex')}`;

    if (signature !== expectedSignature) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    return true;
  }
}
