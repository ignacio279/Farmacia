import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('broadcast_contacts')
export class BroadcastContact {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** WhatsApp user ID (teléfono con código de país, sin +). Opcional para clientes creados a mano. */
  @Column({ name: 'wa_user_id', unique: true, nullable: true, length: 20 })
  @Index()
  waUserId: string | null;

  @Column({ type: 'varchar', nullable: true, length: 100 })
  name: string | null;

  @Column({ type: 'varchar', nullable: true, length: 255 })
  email: string | null;

  @Column({ type: 'varchar', nullable: true, length: 10 })
  birthday: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
