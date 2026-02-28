import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PdfSyncService } from './pdf-sync.service';

@Injectable()
export class PdfSyncScheduler {
  constructor(
    private config: ConfigService,
    private pdfSync: PdfSyncService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleSync() {
    const url = this.config.get<string>('siafar.pdfUrl');
    if (!url) return;

    const result = await this.pdfSync.sync();
    if (result.changed && result.rowsImported != null) {
      console.log(`PDF sync completed: ${result.rowsImported} rows imported`);
    } else if (result.error) {
      console.warn('PDF sync:', result.error);
    }
  }
}
