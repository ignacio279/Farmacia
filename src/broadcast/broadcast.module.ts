import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BroadcastContact } from '../entities/broadcast-contact.entity';
import { Campaign } from '../entities/campaign.entity';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { BroadcastController } from './broadcast.controller';
import { BroadcastService } from './broadcast.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([BroadcastContact, Campaign]),
    ConfigModule,
    WhatsAppModule,
  ],
  controllers: [BroadcastController],
  providers: [BroadcastService],
  exports: [BroadcastService],
})
export class BroadcastModule {}
