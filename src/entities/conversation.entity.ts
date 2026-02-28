import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ConversationState {
  IDLE = 'idle',
  PENDING_SELECTION = 'pending_selection',
}

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'wa_user_id', unique: true })
  @Index()
  waUserId: string;

  @Column({ type: 'varchar', length: 32, default: ConversationState.IDLE })
  state: ConversationState;

  @Column({ type: 'jsonb', nullable: true })
  context: {
    candidatos?: Array<{
      id: string;
      monodroga: string;
      nombre: string;
      presentacion: string;
      laboratorio: string;
      precio: number;
    }>;
    productoSeleccionado?: {
      id: string;
      monodroga: string;
      nombreComercial: string;
      presentacion: string;
      laboratorio: string;
      precio: number;
    };
  } | null;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
