import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import axios from 'axios';
import { Repository } from 'typeorm';
import { MedPrice } from '../entities/med-price.entity';
import { PdfVersion } from '../entities/pdf-version.entity';
import { PdfParseService } from '../pdf-parse/pdf-parse.service';

@Injectable()
export class PdfSyncService {
  constructor(
    private config: ConfigService,
    private pdfParse: PdfParseService,
    @InjectRepository(PdfVersion)
    private pdfVersionRepo: Repository<PdfVersion>,
    @InjectRepository(MedPrice)
    private medPriceRepo: Repository<MedPrice>,
  ) {}

  async sync(force = false): Promise<{ changed: boolean; rowsImported?: number; error?: string }> {
    const url = this.config.get<string>('siafar.pdfUrl');
    if (!url) {
      return { changed: false, error: 'SIAFAR_PDF_URL not configured' };
    }

    try {
      const headRes = await axios.head(url, { validateStatus: () => true, timeout: 30000 });
      if (headRes.status !== 200) {
        console.warn('PDF HEAD failed:', headRes.status);
        return { changed: false, error: 'PDF not available, using last cached version' };
      }

      const etag = headRes.headers['etag'] ?? null;
      const lastModified = headRes.headers['last-modified']
        ? new Date(headRes.headers['last-modified'])
        : null;
      const contentLength = headRes.headers['content-length']
        ? parseInt(String(headRes.headers['content-length']), 10)
        : null;

      if (!force) {
        const [lastVersion] = await this.pdfVersionRepo.find({
          order: { fetchedAt: 'DESC' as const },
          take: 1,
        });

        if (lastVersion) {
          const sameEtag = !etag || lastVersion.etag === etag;
          const sameLastModified =
            !lastModified || (lastVersion.lastModified && lastVersion.lastModified.getTime() === lastModified.getTime());
          const sameLength = contentLength == null || Number(lastVersion.contentLength) === contentLength;

          if (sameEtag && sameLastModified && sameLength) {
            return { changed: false };
          }
        }
      }

      const getRes = await axios.get(url, { responseType: 'arraybuffer', timeout: 60000 });
      const buffer = Buffer.from(getRes.data);
      const contentHash = createHash('sha256').update(buffer).digest('hex');

      if (!force) {
        const [lastVersion] = await this.pdfVersionRepo.find({
          order: { fetchedAt: 'DESC' as const },
          take: 1,
        });
        if (lastVersion && lastVersion.contentHash === contentHash) {
          return { changed: false };
        }
      }

      const rows = await this.pdfParse.parse(buffer);
      if (force && rows.length > 0) {
        await this.medPriceRepo.clear();
      }
      const toUpsert = rows.map((r) => {
        const { searchText, normalizedName } = this.pdfParse.normalizeForSearch(r);
        const entity = this.medPriceRepo.create({
          monodroga: r.monodroga,
          nombreComercial: r.nombreComercial,
          presentacion: r.presentacion,
          laboratorio: r.laboratorio,
          precio: r.precio,
          precioPami: r.precioPami,
          searchText,
          normalizedName,
        });
        return entity;
      });

      const count = toUpsert.length;
      if (count > 0) {
        await this.medPriceRepo.manager.transaction(async (manager) => {
          for (const entity of toUpsert) {
            await manager
              .createQueryBuilder()
              .insert()
              .into(MedPrice)
              .values({
                monodroga: entity.monodroga,
                nombreComercial: entity.nombreComercial,
                presentacion: entity.presentacion,
                laboratorio: entity.laboratorio,
                precio: entity.precio,
                precioPami: entity.precioPami,
                searchText: entity.searchText,
                normalizedName: entity.normalizedName,
              })
              .orUpdate(
                ['precio', 'precio_pami', 'search_text', 'normalized_name', 'updated_at'],
                ['monodroga', 'nombre_comercial', 'presentacion', 'laboratorio'],
              )
              .execute();
          }
        });
      }

      const version = this.pdfVersionRepo.create({
        etag,
        lastModified,
        contentLength: contentLength ?? null,
        contentHash,
        fetchedAt: new Date(),
        rowsImported: count,
      });
      await this.pdfVersionRepo.save(version);

      return { changed: true, rowsImported: count };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const stack = err instanceof Error ? err.stack : undefined;
      console.error('PDF sync error:', msg, stack);
      return { changed: false, error: msg };
    }
  }
}
