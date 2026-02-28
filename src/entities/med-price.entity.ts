import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity('med_prices')
@Unique(['monodroga', 'nombreComercial', 'presentacion', 'laboratorio'])
export class MedPrice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  monodroga: string;

  @Column({ name: 'nombre_comercial' })
  nombreComercial: string;

  @Column()
  presentacion: string;

  @Column()
  laboratorio: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  precio: number;

  @Column({ name: 'precio_pami', type: 'decimal', precision: 12, scale: 2, nullable: true })
  precioPami: number | null;

  @Column({ name: 'search_text', type: 'text' })
  searchText: string;

  @Column({ name: 'normalized_name' })
  @Index()
  normalizedName: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
