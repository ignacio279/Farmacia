import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('query_logs')
export class QueryLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'wa_user_id' })
  @Index()
  waUserId: string;

  @Column()
  intent: string;

  @Column({ name: 'query_text', type: 'text' })
  queryText: string;

  @Column({ name: 'found_count', default: 0 })
  foundCount: number;

  @Column({ name: 'response_sent_at', type: 'timestamp', nullable: true })
  responseSentAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
