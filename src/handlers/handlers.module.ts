import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RateLimitService } from '../common/rate-limit.service';
import { PdfVersion } from '../entities/pdf-version.entity';
import { QueryLog } from '../entities/query-log.entity';
import { ConversationModule } from '../conversation/conversation.module';
import { MedSearchModule } from '../med-search/med-search.module';
import { OpenaiIntentModule } from '../openai-intent/openai-intent.module';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { MessageHandlerService } from './message-handler.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([QueryLog, PdfVersion]),
    ConversationModule,
    MedSearchModule,
    OpenaiIntentModule,
    WhatsAppModule,
  ],
  providers: [MessageHandlerService, RateLimitService],
  exports: [MessageHandlerService],
})
export class HandlersModule {}
