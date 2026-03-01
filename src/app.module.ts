import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/configuration';
import { BroadcastContact } from './entities/broadcast-contact.entity';
import { Campaign } from './entities/campaign.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { Conversation } from './entities/conversation.entity';
import { MedPrice } from './entities/med-price.entity';
import { PdfVersion } from './entities/pdf-version.entity';
import { QueryLog } from './entities/query-log.entity';
import { PdfSyncModule } from './pdf-sync/pdf-sync.module';
import { SendModule } from './send/send.module';
import { TestModule } from './test/test.module';
import { WebhookModule } from './webhook/webhook.module';
import { BroadcastModule } from './broadcast/broadcast.module';
import { ConversationsModule } from './conversations/conversations.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: (() => {
        const base = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/farmacia';
        if (!process.env.DATABASE_URL) return base;
        const sep = base.includes('?') ? '&' : '?';
        return base + sep + 'sslmode=disable';
      })(),
      entities: [MedPrice, PdfVersion, Conversation, QueryLog, BroadcastContact, Campaign, ChatMessage],
      synchronize: true,
    }),
    WebhookModule,
    SendModule,
    BroadcastModule,
    ConversationsModule,
    TestModule,
    PdfSyncModule,
  ],
})
export class AppModule {}
