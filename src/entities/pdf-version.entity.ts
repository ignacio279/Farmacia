import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('pdf_versions')
export class PdfVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 512, nullable: true })
  etag: string | null;

  @Column({ name: 'last_modified', type: 'timestamp', nullable: true })
  lastModified: Date | null;

  @Column({ name: 'content_length', type: 'int', nullable: true })
  contentLength: number | null;

  @Column({ name: 'content_hash' })
  contentHash: string;

  @Column({ name: 'fetched_at', type: 'timestamp' })
  fetchedAt: Date;

  @Column({ name: 'rows_imported', default: 0 })
  rowsImported: number;
}
