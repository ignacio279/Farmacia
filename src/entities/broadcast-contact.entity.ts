import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('broadcast_contacts')
export class BroadcastContact {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** WhatsApp user ID (teléfono con código de país, sin +) */
  @Column({ name: 'wa_user_id', unique: true })
  @Index()
  waUserId: string;

  @Column({ type: 'varchar', nullable: true, length: 100 })
  name: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
