import { Injectable } from '@nestjs/common';
import { WhatsAppService } from '../whatsapp/whatsapp.service';

@Injectable()
export class SendService {
  constructor(private whatsapp: WhatsAppService) {}

  async send(to: string, body: string): Promise<void> {
    await this.whatsapp.sendText(to, body);
  }
}
