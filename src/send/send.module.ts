import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { SendController } from './send.controller';
import { SendService } from './send.service';

@Module({
  imports: [ConfigModule, WhatsAppModule],
  controllers: [SendController],
  providers: [SendService],
})
export class SendModule {}
