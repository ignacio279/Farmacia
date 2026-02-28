import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OpenaiIntentService } from './openai-intent.service';

@Module({
  imports: [ConfigModule],
  providers: [OpenaiIntentService],
  exports: [OpenaiIntentService],
})
export class OpenaiIntentModule {}
