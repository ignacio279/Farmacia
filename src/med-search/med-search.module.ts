import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedPrice } from '../entities/med-price.entity';
import { MedSearchService } from './med-search.service';

@Module({
  imports: [TypeOrmModule.forFeature([MedPrice])],
  providers: [MedSearchService],
  exports: [MedSearchService],
})
export class MedSearchModule {}
