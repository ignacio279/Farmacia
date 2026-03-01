import {
  Controller,
  Get,
  Headers,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import type { Response } from 'express';
import { MessageHandlerService } from '../handlers/message-handler.service';
import { WebhookSignatureGuard } from './webhook.verification.guard';
import { BroadcastService } from '../broadcast/broadcast.service';
import { ChatMessageService } from '../conversations/chat-message.service';

@Controller('webhook/whatsapp')
export class WebhookController {
  constructor(
    private config: ConfigService,
    private messageHandler: MessageHandlerService,
    private broadcastService: BroadcastService,
    private chatMessage: ChatMessageService,
  ) {}

  @Get()
  verify(@Query() query: Record<string, string>, @Res() res: Response) {
    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    const challenge = query['hub.challenge'];

    const verifyToken = this.config.get<string>('webhook.verifyToken') ?? '';

    if (mode === 'subscribe' && token === verifyToken) {
      return res.status(200).send(challenge);
    }

    return res.status(403).send('Verification failed');
  }

  @Post()
  @UseGuards(WebhookSignatureGuard)
  async receive(@Req() req: Request, @Res() res: Response) {
    const body = req.body as {
      object?: string;
      entry?: Array<{
        id?: string;
        changes?: Array<{
          value?: {
            messages?: Array<{
              from: string;
              type: string;
              text?: { body: string };
            }>;
          };
        }>;
      }>;
    };

    res.status(200).send('EVENT_RECEIVED');

    if (body?.object !== 'whatsapp_business_account') {
      return;
    }

    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const messages = change.value?.messages ?? [];
        for (const msg of messages) {
          if (msg.type === 'text' && msg.text?.body) {
            this.chatMessage.saveIncoming(msg.from, msg.text.body).catch(() => {});
            this.broadcastService.addContact(msg.from).catch(() => {});
            this.messageHandler
              .handle(msg.from, msg.text.body)
              .catch((err) => console.error('Message handler error:', err));
          }
        }
      }
    }
  }
}
