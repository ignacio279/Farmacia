import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from '../entities/chat-message.entity';

export interface ConversationListItem {
  waUserId: string;
  lastMessageAt: Date;
  lastMessagePreview: string;
}

@Injectable()
export class ChatMessageService {
  constructor(
    @InjectRepository(ChatMessage)
    private repo: Repository<ChatMessage>,
  ) {}

  async saveIncoming(waUserId: string, text: string): Promise<void> {
    const normalized = waUserId.replace(/\D/g, '');
    if (!normalized || !text?.trim()) return;
    const msg = this.repo.create({
      waUserId: normalized,
      direction: 'in',
      text: text.trim(),
    });
    await this.repo.save(msg);
  }

  async saveOutgoing(waUserId: string, text: string): Promise<void> {
    const normalized = waUserId.replace(/\D/g, '');
    if (!normalized || !text?.trim()) return;
    const msg = this.repo.create({
      waUserId: normalized,
      direction: 'out',
      text: text.trim(),
    });
    await this.repo.save(msg);
  }

  async getConversations(): Promise<ConversationListItem[]> {
    const raw = await this.repo
      .createQueryBuilder('m')
      .select('m.wa_user_id', 'waUserId')
      .addSelect('MAX(m.created_at)', 'lastMessageAt')
      .groupBy('m.wa_user_id')
      .getRawMany();

    const list: ConversationListItem[] = [];
    for (const r of raw) {
      const last = await this.repo.findOne({
        where: { waUserId: r.waUserId },
        order: { createdAt: 'DESC' },
      });
      list.push({
        waUserId: r.waUserId,
        lastMessageAt: new Date(r.lastMessageAt),
        lastMessagePreview: (last?.text ?? '').slice(0, 80),
      });
    }
    list.sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());
    return list;
  }

  async getMessages(
    waUserId: string,
    limit = 50,
    offset = 0,
  ): Promise<{ messages: ChatMessage[]; total: number }> {
    const normalized = waUserId.replace(/\D/g, '');
    const [messages, total] = await this.repo.findAndCount({
      where: { waUserId: normalized },
      order: { createdAt: 'ASC' },
      take: limit,
      skip: offset,
    });
    return { messages, total };
  }
}
