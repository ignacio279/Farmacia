import { Body, Controller, Get, Headers, Post, Query, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BroadcastService } from './broadcast.service';

const CAMPAIGN_TYPES = ['discount', 'birthday', 'announcement', 'custom'] as const;

@Controller('broadcast')
export class BroadcastController {
  constructor(
    private broadcast: BroadcastService,
    private config: ConfigService,
  ) {}

  @Get('contacts')
  async listContacts(@Headers('x-api-key') apiKey: string) {
    this.checkApiKey(apiKey);
    const contacts = await this.broadcast.getAllContacts();
    return { count: contacts.length, contacts: contacts.map((c) => ({ id: c.id, waUserId: c.waUserId, name: c.name })) };
  }

  @Post()
  async send(
    @Headers('x-api-key') apiKey: string,
    @Body() body: { message: string },
  ) {
    this.checkApiKey(apiKey);
    const message = (body?.message ?? '').trim();
    if (!message) {
      return { ok: false, error: 'message is required' };
    }
    const { sent, failed } = await this.broadcast.sendToAll(message);
    return { ok: true, sent, failed };
  }

  @Get('campaigns')
  async listCampaigns(
    @Headers('x-api-key') apiKey: string,
    @Query('limit') limit?: string,
  ) {
    this.checkApiKey(apiKey);
    const n = Math.min(100, Math.max(1, parseInt(limit ?? '20', 10) || 20));
    const campaigns = await this.broadcast.getCampaigns(n);
    return {
      count: campaigns.length,
      campaigns: campaigns.map((c) => ({
        id: c.id,
        type: c.type,
        title: c.title,
        message: c.message,
        createdAt: c.createdAt,
        sentAt: c.sentAt,
        sentCount: c.sentCount,
        failedCount: c.failedCount,
      })),
    };
  }

  @Post('campaigns')
  async sendCampaign(
    @Headers('x-api-key') apiKey: string,
    @Body() body: { type: string; title?: string; message: string },
  ) {
    this.checkApiKey(apiKey);
    const message = (body?.message ?? '').trim();
    if (!message) {
      return { ok: false, error: 'message is required' };
    }
    const type = (body?.type ?? 'custom').toLowerCase();
    if (!CAMPAIGN_TYPES.includes(type as typeof CAMPAIGN_TYPES[number])) {
      return { ok: false, error: `type must be one of: ${CAMPAIGN_TYPES.join(', ')}` };
    }
    const { campaignId, sent, failed } = await this.broadcast.sendCampaign(
      type as 'discount' | 'birthday' | 'announcement' | 'custom',
      message,
      body?.title,
    );
    return { ok: true, campaignId, sent, failed };
  }

  private checkApiKey(apiKey: string): void {
    const expected = this.config.get<string>('send.apiKey');
    if (expected && apiKey !== expected) {
      throw new UnauthorizedException('Invalid API key');
    }
  }
}
