import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RateLimitService } from '../common/rate-limit.service';
import { ConversationState } from '../entities/conversation.entity';
import { MedSearchService, MedSearchResult } from '../med-search/med-search.service';
import type { IntentResult } from '../openai-intent/openai-intent.service';
import { OpenaiIntentService } from '../openai-intent/openai-intent.service';
import { QueryLog } from '../entities/query-log.entity';
import { ConversationService } from '../conversation/conversation.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';

@Injectable()
export class MessageHandlerService {
  constructor(
    private openaiIntent: OpenaiIntentService,
    private medSearch: MedSearchService,
    private conversation: ConversationService,
    private whatsapp: WhatsAppService,
    private rateLimit: RateLimitService,
    private config: ConfigService,
    @InjectRepository(QueryLog)
    private queryLogRepo: Repository<QueryLog>,
  ) {}

  /**
   * Procesa el mensaje y devuelve la respuesta (para tests sin WhatsApp).
   */
  async processMessage(waUserId: string, text: string): Promise<string> {
    const rateLimitMsg = 'Pasaron muchas consultas seguidas. Esperá un ratito y probá de nuevo.';
    if (!this.rateLimit.check(waUserId)) {
      return rateLimitMsg;
    }

    const conv = await this.conversation.getOrCreate(waUserId);
    let intent: IntentResult;
    let response: string;
    let foundCount = 0;

    if (conv.state === ConversationState.PENDING_SELECTION) {
      const idx = this.parseSelectionIndex(text);
      if (idx !== null) {
        intent = { intent: 'PRICE', queryText: text, wantsCheapest: false };
        const resolved = await this.conversation.resolveSelection(waUserId, idx);
        if (resolved) {
          response = await this.formatPriceResponse([{
            id: resolved.id,
            monodroga: resolved.monodroga,
            nombreComercial: resolved.nombreComercial,
            presentacion: resolved.presentacion,
            laboratorio: resolved.laboratorio,
            precio: resolved.precio,
            precioPami: null,
          }]);
          foundCount = 1;
        } else {
          response = 'Opción no válida. Escribime de nuevo el nombre del medicamento para buscar.';
        }
      } else {
        await this.conversation.clearSelection(waUserId);
        intent = await this.openaiIntent.classify(text);
        const result = await this.processIntent(waUserId, intent);
        response = result.response;
        foundCount = result.foundCount;
      }
    } else {
      intent = await this.openaiIntent.classify(text);
      const result = await this.processIntent(waUserId, intent);
      response = result.response;
      foundCount = result.foundCount;
    }

    await this.logQuery(waUserId, intent?.intent ?? 'UNKNOWN', text, foundCount);
    return response;
  }

  async handle(waUserId: string, text: string): Promise<void> {
    const response = await this.processMessage(waUserId, text);
    const welcome = (this.config.get<string>('welcome.message') ?? '').trim();
    const textToSend = welcome ? `${welcome}\n\n${response}` : response;
    await this.whatsapp.sendText(waUserId, textToSend);
  }

  private async processIntent(
    waUserId: string,
    intent: IntentResult,
  ): Promise< { response: string; foundCount: number }> {
    switch (intent.intent) {
      case 'GREETING':
        return { response: this.getGreetingMessage(), foundCount: 0 };
      case 'HELP':
        return { response: this.getHelpMessage(), foundCount: 0 };
      case 'PRICE':
        return this.handlePrice(waUserId, intent);
      case 'ALTERNATIVES':
        return this.handleAlternatives(waUserId, intent);
      default:
        if (this.looksLikeGreeting(intent.queryText)) {
          return { response: this.getGreetingMessage(), foundCount: 0 };
        }
        return this.handlePrice(waUserId, intent);
    }
  }

  private looksLikeGreeting(text: string): boolean {
    const t = text.toLowerCase().trim();
    return /^(hola|holi|buenas|buen día|hey|hi|qué tal|como va|holis|ola)$/i.test(t) || t.length <= 2;
  }

  private async handlePrice(
    waUserId: string,
    intent: IntentResult,
  ): Promise<{ response: string; foundCount: number }> {
    const q = intent.queryText;
    if (!q || !q.trim()) {
      return { response: 'Escribime el nombre del medicamento o la monodroga y te paso el precio.', foundCount: 0 };
    }

    const results = await this.medSearch.search(q, 100);

    if (results.length === 0) {
      return { response: 'No encontré ese medicamento en la lista. Probá con otro nombre o con la monodroga (por ej. ibuprofeno, metformina).', foundCount: 0 };
    }

    if (results.length > 15) {
      const med = q.trim();
      const suggestions = this.buildSpecificationSuggestions(results, med);
      const msg = `Hay ${results.length} opciones. Para filtrar, escribime miligramos, laboratorio o marca:\n\n${suggestions}`;
      return { response: msg, foundCount: results.length };
    }

    return {
      response: await this.formatPriceResponse(results),
      foundCount: results.length,
    };
  }

  private async handleAlternatives(
    waUserId: string,
    intent: IntentResult,
  ): Promise<{ response: string; foundCount: number }> {
    const q = intent.queryText?.trim();
    if (!q) {
      return { response: 'Escribime el nombre del medicamento y te busco alternativas con la misma monodroga.', foundCount: 0 };
    }

    const results = await this.medSearch.search(q, 5);
    const base = results[0];
    if (!base) {
      return { response: 'No encontré ese medicamento. Probá con otro nombre.', foundCount: 0 };
    }

    const alts = await this.medSearch.findAlternatives(
      base.monodroga,
      intent.wantsCheapest,
      base.id,
      5,
    );

    if (alts.length === 0) {
      return {
        response: `No hay otras opciones con la misma monodroga (${base.monodroga}) en la lista.`,
        foundCount: 0,
      };
    }

    const lines = alts.map((r) => {
      const name = r.nombreComercial || r.monodroga;
      const pres = r.presentacion ? ` · ${r.presentacion}` : '';
      const lab = r.laboratorio ? ` · ${r.laboratorio}` : '';
      return `• ${name}${pres}${lab} — $${r.precio}`;
    });
    const msg = `Alternativas de ${base.nombreComercial || base.monodroga}:\n\n${lines.join('\n')}`;
    return {
      response: msg,
      foundCount: alts.length,
    };
  }

  private buildSpecificationSuggestions(results: MedSearchResult[], med: string): string {
    const labs = new Set<string>();
    const mgDoses = new Set<string>();
    const marcas = new Set<string>();
    const mgRegex = /\d+\s*mg/g;

    for (const r of results) {
      if (r.laboratorio && r.laboratorio.length <= 25 && !/\d/.test(r.laboratorio)) {
        labs.add(r.laboratorio.trim());
      }
      const pres = r.presentacion || '';
      const match = pres.match(mgRegex);
      if (match) mgDoses.add(match[0].replace(/\s+/g, ' ').trim());
      if (r.nombreComercial && r.nombreComercial.length <= 30) {
        marcas.add(r.nombreComercial.trim());
      }
    }

    const examples: string[] = [];
    const topMg = [...mgDoses].slice(0, 3);
    const topLabs = [...labs].slice(0, 3);
    const topMarcas = [...marcas].slice(0, 3);

    for (const mg of topMg) {
      examples.push(`"${med} ${mg}"`);
    }
    for (const lab of topLabs) {
      if (examples.length < 6) examples.push(`"${med} ${lab}"`);
    }
    for (const marca of topMarcas) {
      if (examples.length < 6 && !examples.some((e) => e.includes(marca))) {
        examples.push(`"${med} ${marca}"`);
      }
    }

    if (examples.length === 0) {
      return `Probá sumando miligramos (ej. 400 mg), laboratorio o nombre comercial, por ej: "${med} 400 mg".`;
    }
    return `Algunos ejemplos: ${examples.slice(0, 6).join(' · ')}`;
  }

  private needsDisambiguation(results: MedSearchResult[]): boolean {
    const names = new Set(results.map((r) => r.nombreComercial.toLowerCase()));
    return names.size > 1 || results.some((r) => r.presentacion !== results[0].presentacion);
  }

  private parseSelectionIndex(text: string): number | null {
    const m = text.trim().match(/^([1-5])$/);
    if (m) return parseInt(m[1], 10) - 1;
    return null;
  }

  private async formatPriceResponse(results: MedSearchResult[]): Promise<string> {
    const lines = results.map((r) => {
      const name = r.nombreComercial || r.monodroga;
      const pres = r.presentacion ? ` · ${r.presentacion}` : '';
      const lab = r.laboratorio ? ` · ${r.laboratorio}` : '';
      const pam = r.precioPami ? ` (PAMI: $${r.precioPami})` : '';
      return `• ${name}${pres}${lab} — $${r.precio}${pam}`;
    });
    return `Acá van los precios:\n\n${lines.join('\n')}`;
  }

  private getGreetingMessage(): string {
    return `¡Hola! 👋 Soy el bot de la farmacia.

Podés preguntarme:
• Precio de un medicamento (ej: "precio ibuprofeno")
• Alternativas con la misma monodroga (ej: "alternativas de paracetamol")

Escribime el nombre del medicamento o la monodroga y te respondo al toque.`;
  }

  private getHelpMessage(): string {
    return `Acá te cuento cómo uso:

• Para ver precios: escribime el nombre del medicamento o la monodroga (ej: "metformina", "precio ibuprofeno").
• Para alternativas: "alternativas de [nombre]" o "equivalente más barato de [nombre]".`;
  }

  private async logQuery(waUserId: string, intent: string, queryText: string, foundCount: number): Promise<void> {
    const log = this.queryLogRepo.create({
      waUserId,
      intent,
      queryText,
      foundCount,
      responseSentAt: new Date(),
    });
    await this.queryLogRepo.save(log);
  }
}
