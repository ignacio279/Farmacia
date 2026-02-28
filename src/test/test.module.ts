import { Module } from '@nestjs/common';
import { HandlersModule } from '../handlers/handlers.module';
import { MedSearchModule } from '../med-search/med-search.module';
import { OpenaiIntentModule } from '../openai-intent/openai-intent.module';
import { PdfSyncModule } from '../pdf-sync/pdf-sync.module';
import { TestController } from './test.controller';

@Module({
  imports: [HandlersModule, PdfSyncModule, MedSearchModule, OpenaiIntentModule],
  controllers: [TestController],
})
export class TestModule {}
