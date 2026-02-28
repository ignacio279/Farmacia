import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MedPrice } from '../entities/med-price.entity';

export interface MedSearchResult {
  id: string;
  monodroga: string;
  nombreComercial: string;
  presentacion: string;
  laboratorio: string;
  precio: number;
  precioPami: number | null;
}

@Injectable()
export class MedSearchService {
  constructor(
    @InjectRepository(MedPrice)
    private repo: Repository<MedPrice>,
  ) {}

  async search(query: string, limit = 10): Promise<MedSearchResult[]> {
    const q = (query ?? '').trim();
    if (!q) return [];

    const normalized = this.normalize(q);
    let results = await this.doSearch(q, normalized, limit);
    if (results.length === 0 && q.length >= 3) {
      const words = q.split(/\s+/).filter((w) => w.length >= 2);
      const firstWord = words[0] ?? q;
      const corrected = await this.findClosestMonodroga(firstWord);
      if (corrected) {
        const newQuery = words.length > 1 ? [corrected, ...words.slice(1)].join(' ') : corrected;
        results = await this.doSearch(newQuery, this.normalize(newQuery), limit);
      }
    }
    return results;
  }

  private async doSearch(
    q: string,
    normalized: string,
    limit: number,
  ): Promise<MedSearchResult[]> {
    const words = q.split(/\s+/).filter((w) => w.length >= 1);

    const qb = this.repo
      .createQueryBuilder('m')
      .orderBy('m.precio', 'ASC')
      .limit(limit * 2);

    if (words.length > 1) {
      const params: Record<string, string> = {};
      words.forEach((w, i) => {
        params[`w${i}`] = `%${w}%`;
      });
      const andClause = words
        .map((_, i) => `(m.search_text ILIKE :w${i} OR m.nombre_comercial ILIKE :w${i} OR m.monodroga ILIKE :w${i})`)
        .join(' AND ');
      qb.where(andClause, params);
    } else {
      const term = `%${q}%`;
      const n = `%${normalized}%`;
      qb.where(
        'm.nombre_comercial ILIKE :q OR m.monodroga ILIKE :q OR m.search_text ILIKE :q OR m.normalized_name ILIKE :n',
        { q: term, n },
      );
    }

    const exact = await qb.getMany();
    return this.rankAndDedupe(exact, q, normalized).slice(0, limit).map(this.toResult);
  }

  private async findClosestMonodroga(query: string): Promise<string | null> {
    const short = await this.repo
      .createQueryBuilder('m')
      .select('DISTINCT m.monodroga')
      .where('LENGTH(m.monodroga) <= 30')
      .andWhere("m.monodroga NOT LIKE '%,%'")
      .getRawMany();
    const candidates = short.map((r) => (r.monodroga ?? '').trim()).filter(Boolean);
    const q = query.toLowerCase();
    // Permitir más errores: según longitud (ej. 2 para palabras cortas, hasta 4 para largas)
    const maxEdits = Math.min(4, Math.max(2, Math.ceil(q.length / 3)));
    let best: string | null = null;
    let bestDist = maxEdits + 1;
    for (const c of candidates) {
      const d = this.levenshtein(q, c.toLowerCase());
      if (d <= maxEdits && d < bestDist) {
        bestDist = d;
        best = c;
      }
    }
    return best;
  }

  private levenshtein(a: string, b: string): number {
    const m = a.length;
    const n = b.length;
    const dp: number[][] = Array(m + 1)
      .fill(null)
      .map(() => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost,
        );
      }
    }
    return dp[m][n];
  }

  async getById(id: string): Promise<MedSearchResult | null> {
    const row = await this.repo.findOne({ where: { id } });
    return row ? this.toResult(row) : null;
  }

  /**
   * Devuelve monodrogas únicas que existen en la base (para debug).
   */
  async getDistinctMonodrogas(limit = 50): Promise<string[]> {
    const rows = await this.repo
      .createQueryBuilder('m')
      .select('DISTINCT m.monodroga')
      .where('LENGTH(m.monodroga) <= 50')
      .orderBy('m.monodroga')
      .limit(limit)
      .getRawMany();
    return rows.map((r) => r.monodroga).filter(Boolean);
  }

  async findAlternatives(
    monodroga: string,
    _wantsCheapest: boolean,
    excludeId?: string,
    limit = 5,
  ): Promise<MedSearchResult[]> {
    let qb = this.repo
      .createQueryBuilder('m')
      .where('m.monodroga ILIKE :monodroga', { monodroga });

    if (excludeId) {
      qb = qb.andWhere('m.id != :id', { id: excludeId });
    }

    qb = qb.orderBy('m.precio', 'ASC').limit(limit);

    const rows = await qb.getMany();
    return rows.map(this.toResult);
  }

  private rankAndDedupe(
    rows: MedPrice[],
    query: string,
    normalized: string,
  ): MedPrice[] {
    const seen = new Set<string>();
    const scored = rows.map((r) => {
      const key = `${r.monodroga}|${r.nombreComercial}|${r.presentacion}|${r.laboratorio}`;
      if (seen.has(key)) return { row: r, score: -1 };
      seen.add(key);

      const nc = r.nombreComercial.toLowerCase();
      const md = r.monodroga.toLowerCase();
      const nn = r.normalizedName;
      const ql = query.toLowerCase();

      let score = 0;
      if (nc === ql || md === ql) score = 100;
      else if (nc.includes(ql) || md.includes(ql) || nn.includes(normalized)) score = 50;
      else score = 10;

      return { row: r, score };
    });

    return scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((s) => s.row);
  }

  private normalize(s: string): string {
    return s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  private toResult(row: MedPrice): MedSearchResult {
    return {
      id: row.id,
      monodroga: row.monodroga,
      nombreComercial: row.nombreComercial,
      presentacion: row.presentacion,
      laboratorio: row.laboratorio,
      precio: Number(row.precio),
      precioPami: row.precioPami ? Number(row.precioPami) : null,
    };
  }
}
