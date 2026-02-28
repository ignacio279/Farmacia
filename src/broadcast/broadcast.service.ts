import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BroadcastContact } from '../entities/broadcast-contact.entity';
import { Campaign, CampaignType } from '../entities/campaign.entity';
import { WhatsAppService } from '../whatsapp/whatsapp.service';

const DELAY_MS = 1500;

@Injectable()
export class BroadcastService {
  constructor(
    @InjectRepository(BroadcastContact)
    private repo: Repository<BroadcastContact>,
    @InjectRepository(Campaign)
    private campaignRepo: Repository<Campaign>,
    private whatsapp: WhatsAppService,
    private config: ConfigService,
  ) {}

  async addContact(waUserId: string, name?: string): Promise<BroadcastContact | null> {
    const normalized = waUserId.replace(/\D/g, '');
    if (!normalized || normalized.length < 10) return null;
    const existing = await this.repo.findOne({ where: { waUserId: normalized } });
    if (existing) return existing;
    const contact = this.repo.create({
      waUserId: normalized,
      name: name?.trim() || null,
    });
    return this.repo.save(contact);
  }

  async getAllContacts(): Promise<BroadcastContact[]> {
    return this.repo.find({ order: { createdAt: 'ASC' } });
  }

  async sendToAll(message: string): Promise<{ sent: number; failed: number }> {
    const contacts = await this.getAllContacts();
    let sent = 0;
    let failed = 0;
    for (const c of contacts) {
      try {
        await this.whatsapp.sendText(c.waUserId, message);
        sent++;
        await this.delay(DELAY_MS);
      } catch {
        failed++;
      }
    }
    return { sent, failed };
  }

  /**
   * Envía una campaña de marketing a todos los contactos.
   * En el mensaje podés usar {{name}} para personalizar con el nombre del contacto.
   */
  async sendCampaign(
    type: CampaignType,
    message: string,
    title?: string,
  ): Promise<{ campaignId: string; sent: number; failed: number }> {
    const campaign = this.campaignRepo.create({
      type,
      title: title?.trim() || null,
      message: message.trim(),
    });
    await this.campaignRepo.save(campaign);

    const contacts = await this.getAllContacts();
    let sent = 0;
    let failed = 0;
    for (const c of contacts) {
      try {
        const text = this.applyTemplate(message.trim(), c.name);
        await this.whatsapp.sendText(c.waUserId, text);
        sent++;
        await this.delay(DELAY_MS);
      } catch {
        failed++;
      }
    }

    campaign.sentAt = new Date();
    campaign.sentCount = sent;
    campaign.failedCount = failed;
    await this.campaignRepo.save(campaign);

    return { campaignId: campaign.id, sent, failed };
  }

  async getCampaigns(limit = 20): Promise<Campaign[]> {
    return this.campaignRepo.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  private applyTemplate(message: string, name: string | null): string {
    const displayName = name?.trim() || 'cliente';
    return message.replace(/\{\{\s*name\s*\}\}/gi, displayName);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }
}
