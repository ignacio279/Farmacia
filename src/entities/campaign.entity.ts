import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type CampaignType = 'discount' | 'birthday' | 'announcement' | 'custom';

@Entity('campaigns')
export class Campaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20 })
  type: CampaignType;

  @Column({ type: 'varchar', length: 200, nullable: true })
  title: string | null;

  @Column({ type: 'text' })
  message: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'timestamp', name: 'sent_at', nullable: true })
  sentAt: Date | null;

  @Column({ type: 'int', name: 'sent_count', default: 0 })
  sentCount: number;

  @Column({ type: 'int', name: 'failed_count', default: 0 })
  failedCount: number;
}
