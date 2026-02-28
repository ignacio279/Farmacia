import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';

@Injectable()
export class WhatsAppService {
  private readonly baseUrl = 'https://graph.facebook.com/v21.0';
  private readonly accessToken: string;
  private readonly phoneNumberId: string;

  constructor(private config: ConfigService) {
    this.accessToken = this.config.get<string>('meta.accessToken') ?? '';
    this.phoneNumberId = this.config.get<string>('meta.phoneNumberId') ?? '';
  }

  async sendText(to: string, body: string): Promise<void> {
    const phoneNumberId = this.phoneNumberId;
    if (!phoneNumberId || !this.accessToken) {
      throw new Error('WhatsApp credentials not configured');
    }

    const url = `${this.baseUrl}/${phoneNumberId}/messages`;
    const normalizedTo = to.replace(/\D/g, '');
    if (!normalizedTo || normalizedTo.length < 10) {
      throw new Error('Invalid recipient phone number');
    }

    try {
      await axios.post(
        url,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: normalizedTo,
          type: 'text',
          text: {
            preview_url: false,
            body,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.accessToken}`,
          },
        },
      );
    } catch (err) {
      const axiosErr = err as AxiosError;
      const detail = axiosErr.response?.data
        ? JSON.stringify(axiosErr.response.data)
        : axiosErr.message;
      throw new Error(`WhatsApp send failed: ${detail}`);
    }
  }
}
