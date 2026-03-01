import { Controller, Get, Headers, Param, Query, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatMessageService } from './chat-message.service';

@Controller('conversations')
export class ConversationsController {
  constructor(
    private chatMessage: ChatMessageService,
    private config: ConfigService,
  ) {}

  @Get()
  async list(@Headers('x-api-key') apiKey: string) {
    this.checkApiKey(apiKey);
    const list = await this.chatMessage.getConversations();
    return { count: list.length, conversations: list };
  }

  @Get(':waUserId/messages')
  async getMessages(
    @Headers('x-api-key') apiKey: string,
    @Param('waUserId') waUserId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    this.checkApiKey(apiKey);
    const limitN = Math.min(100, Math.max(1, parseInt(limit ?? '50', 10) || 50));
    const offsetN = Math.max(0, parseInt(offset ?? '0', 10) || 0);
    const result = await this.chatMessage.getMessages(waUserId, limitN, offsetN);
    return result;
  }

  private checkApiKey(apiKey: string): void {
    const expected = this.config.get<string>('send.apiKey');
    if (expected && apiKey !== expected) {
      throw new UnauthorizedException('Invalid API key');
    }
  }
}
