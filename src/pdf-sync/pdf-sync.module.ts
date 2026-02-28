import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedPrice } from '../entities/med-price.entity';
import { PdfVersion } from '../entities/pdf-version.entity';
import { PdfParseModule } from '../pdf-parse/pdf-parse.module';
import { PdfSyncScheduler } from './pdf-sync.scheduler';
import { PdfSyncService } from './pdf-sync.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([PdfVersion, MedPrice]),
    PdfParseModule,
  ],
  providers: [PdfSyncService, PdfSyncScheduler],
  exports: [PdfSyncService],
})
export class PdfSyncModule {}
