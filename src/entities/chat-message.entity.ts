import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type ChatMessageDirection = 'in' | 'out';

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'wa_user_id', length: 20 })
  @Index()
  waUserId: string;

  @Column({ type: 'varchar', length: 10 })
  direction: ChatMessageDirection;

  @Column({ type: 'text' })
  text: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
