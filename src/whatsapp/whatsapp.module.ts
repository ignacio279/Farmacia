import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConversationsModule } from '../conversations/conversations.module';
import { WhatsAppService } from './whatsapp.service';

@Module({
  imports: [ConfigModule, ConversationsModule],
  providers: [WhatsAppService],
  exports: [WhatsAppService],
})
export class WhatsAppModule {}
