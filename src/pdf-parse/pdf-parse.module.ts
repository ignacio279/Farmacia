import { Module } from '@nestjs/common';
import { PdfParseService } from './pdf-parse.service';

@Module({
  providers: [PdfParseService],
  exports: [PdfParseService],
})
export class PdfParseModule {}
