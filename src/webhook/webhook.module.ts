import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BroadcastModule } from '../broadcast/broadcast.module';
import { HandlersModule } from '../handlers/handlers.module';
import { WebhookController } from './webhook.controller';

@Module({
  imports: [ConfigModule, HandlersModule, BroadcastModule],
  controllers: [WebhookController],
})
export class WebhookModule {}
