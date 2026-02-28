import { Injectable } from '@nestjs/common';

export interface ParsedMedRow {
  monodroga: string;
  nombreComercial: string;
  presentacion: string;
  laboratorio: string;
  precio: number;
  precioPami: number | null;
}

@Injectable()
export class PdfParseService {
  /**
   * Parses PDF buffer and extracts medication rows.
   * SIAFAR PDF structure varies - this implements a generic tabular parser.
   * Adjust regex/column logic based on actual PDF format.
   */
  async parse(buffer: Buffer): Promise<ParsedMedRow[]> {
    const { PDFParse } = require('pdf-parse') as { PDFParse: new (opts: { data: Buffer }) => { getText: () => Promise<{ text: string }>; destroy: () => Promise<void> } };
    const parser = new PDFParse({ data: buffer });
    const data = await parser.getText();
    await parser.destroy();
    const text = data.text;

    if (!text || !text.trim()) {
      return [];
    }

    const rows = this.extractRows(text);
    return rows.map((r) => this.normalizeRow(r)).filter((r) => r.precio > 0);
  }

  private extractRows(text: string): Array<Record<string, string>> {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    const rows: Array<Record<string, string>> = [];

    for (const line of lines) {
      const row = this.parseLine(line);
      if (row && row.precio) {
        rows.push(row);
      }
    }

    return rows;
  }

  private parseLine(line: string): Record<string, string> | null {
    const row: Record<string, string> = {};
    let remaining = line;

    // Formato argentino: 18.790,00 (punto=miles, coma=decimales) o 363,10. Segundo precio puede ser " -".
    const arPrice = /\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2}/;
    const priceMatch = remaining.match(
      new RegExp(`(${arPrice.source})\\s*(${arPrice.source}|-)?\\s*$`),
    );
    if (priceMatch) {
      row.precio = this.normalizePrice(priceMatch[1]);
      if (priceMatch[2] && priceMatch[2] !== '-') row.precioPami = this.normalizePrice(priceMatch[2]);
      remaining = remaining.slice(0, priceMatch.index).trim();
    }

    if (!row.precio || parseFloat(row.precio) <= 0) return null;

    const parts = remaining.split(/\s{2,}|\t/).filter(Boolean);
    if (parts.length >= 4) {
      row.monodroga = parts[0] ?? '';
      row.nombreComercial = parts[1] ?? '';
      row.presentacion = parts[2] ?? '';
      row.laboratorio = parts[3] ?? '';
    } else if (parts.length === 1) {
      const parsed = this.parseSiafarLine(parts[0] ?? '');
      if (parsed) Object.assign(row, parsed);
    } else if (parts.length >= 2) {
      row.monodroga = parts[0] ?? '';
      row.nombreComercial = parts.slice(1, -2).join(' ') ?? '';
      row.presentacion = parts[parts.length - 2] ?? '';
      row.laboratorio = parts[parts.length - 1] ?? '';
    }

    return Object.keys(row).length > 1 ? row : null;
  }

  private normalizePrice(s: string): string {
    if (s.includes(',') && s.lastIndexOf(',') > s.lastIndexOf('.')) {
      return s.replace(/\./g, '').replace(',', '.');
    }
    return s.replace(',', '.');
  }

  private parseSiafarLine(text: string): Record<string, string> | null {
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length < 2) return null;

    const monodroga = words[0] ?? '';
    const laboratorio = words[words.length - 1] ?? '';
    const presMatch = text.match(/(\d+\s*(?:mg|ml|g|%|UI)\b[^A-Z]*?(?:comp|ov|tab|caps?|x\s*\d+)[^A-Z]*)/i);
    const presentacion = presMatch ? presMatch[1].trim() : '';
    const mid = text.slice(monodroga.length).replace(presentacion, '').replace(laboratorio, '').trim();
    const nombreComercial = mid.replace(/\s+/g, ' ').trim();

    return { monodroga, nombreComercial, presentacion, laboratorio };
  }

  private normalizeRow(row: Record<string, string>): ParsedMedRow {
    const precioStr = String(row.precio ?? '0').replace(',', '.');
    const precioPamiStr = row.precioPami?.replace(',', '.');
    return {
      monodroga: (row.monodroga ?? '').trim(),
      nombreComercial: (row.nombreComercial ?? '').trim(),
      presentacion: (row.presentacion ?? '').trim(),
      laboratorio: (row.laboratorio ?? '').trim(),
      precio: parseFloat(precioStr) || 0,
      precioPami: precioPamiStr ? parseFloat(precioPamiStr) : null,
    };
  }

  normalizeForSearch(row: ParsedMedRow): { searchText: string; normalizedName: string } {
    const searchText = [row.monodroga, row.nombreComercial, row.presentacion]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    const normalizedName = this.removeAccents(searchText);
    return { searchText, normalizedName };
  }

  private removeAccents(s: string): string {
    return s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }
}
