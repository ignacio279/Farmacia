import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatMessage } from '../entities/chat-message.entity';
import { ChatMessageService } from './chat-message.service';
import { ConversationsController } from './conversations.controller';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([ChatMessage])],
  controllers: [ConversationsController],
  providers: [ChatMessageService],
  exports: [ChatMessageService],
})
export class ConversationsModule {}
