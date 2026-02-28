import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export interface IntentResult {
  intent: 'PRICE' | 'ALTERNATIVES' | 'HELP' | 'GREETING' | 'UNKNOWN';
  queryText: string;
  wantsCheapest: boolean;
  constraints?: { mg?: string; presentacion?: string };
}

@Injectable()
export class OpenaiIntentService {
  private client: OpenAI | null = null;

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('openai.apiKey');
    if (apiKey) {
      this.client = new OpenAI({ apiKey });
    }
  }

  async classify(message: string): Promise<IntentResult> {
    const defaultResult: IntentResult = {
      intent: 'UNKNOWN',
      queryText: message.trim(),
      wantsCheapest: false,
    };

    if (!this.client) {
      return { ...defaultResult, intent: this.inferIntent(message) };
    }

    try {
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Clasifica la intención del usuario en exactamente una de: PRICE, ALTERNATIVES, HELP, GREETING, UNKNOWN.
PRICE = consultar precio de un medicamento
ALTERNATIVES = pedir alternativas/equivalentes de un medicamento
HELP = pedir ayuda, información del bot
GREETING = saludo (hola, buenas, qué tal, etc.)
UNKNOWN = no reconocible o fuera de contexto

Responde ÚNICAMENTE un JSON válido con:
- intent: una de PRICE|ALTERNATIVES|HELP|GREETING|UNKNOWN (GREETING = saludo como hola, buenas)
- query_text: texto de búsqueda del medicamento (vacío si HELP, GREETING o UNKNOWN sin medicamento)
- wants_cheapest: true si pide "más barato", "económico", "genérico"
- constraints: objeto opcional con mg y/o presentacion si el usuario los menciona`,
          },
          { role: 'user', content: message },
        ],
        temperature: 0,
      });

      const text = completion.choices[0]?.message?.content?.trim() ?? '';
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]) as Record<string, unknown>;
        return {
          intent: this.normalizeIntent(parsed.intent),
          queryText: (parsed.queryText ?? parsed.query_text ?? message).toString().trim(),
          wantsCheapest: Boolean(parsed.wantsCheapest ?? parsed.wants_cheapest),
          constraints: parsed.constraints as { mg?: string; presentacion?: string } | undefined,
        };
      }
    } catch (err) {
      console.error('OpenAI classification error:', err);
    }

    const intent = this.inferIntent(message);
    const queryText = this.extractMedicationFromMessage(message);
    return { ...defaultResult, intent, queryText: queryText || message.trim() };
  }

  /**
   * Extrae el nombre del medicamento cuando OpenAI falla.
   * Quita prefijos como "precio de", "dame el precio del", etc.
   */
  private extractMedicationFromMessage(message: string): string {
    return message
      .replace(/^(precio\s+(de|del)?\s*|dame\s+(el\s+)?precio\s+(de|del)?\s*|cuánto\s+cuesta\s+(el\s+)?|alternativas?\s+de\s+|equivalente\s+(más\s+barato\s+)?de\s+)/i, '')
      .replace(/\b(precio|dame|cuánto|cuesta|del|de|el|la|los|las|un|una)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private normalizeIntent(s: unknown): IntentResult['intent'] {
    const v = String(s ?? '').toUpperCase();
    if (['PRICE', 'ALTERNATIVES', 'HELP', 'GREETING', 'UNKNOWN'].includes(v)) {
      return v as IntentResult['intent'];
    }
    return 'UNKNOWN';
  }

  private inferIntent(message: string): IntentResult['intent'] {
    const m = message.toLowerCase().trim();
    if (/^(hola|holi|buenas|buen día|buenos días|hey|hi|qué tal|como va|holis|ola)\s*[!.]*$/i.test(m) || m.length <= 3 && /^[a-záéíóú]+$/i.test(m)) return 'GREETING';
    if (/ayuda|help|información|como funciona/i.test(m)) return 'HELP';
    if (/alternativa|equivalente|genérico|similar/i.test(m)) return 'ALTERNATIVES';
    if (/precio|cuánto|costo/i.test(m) || /^\d+\s*$/i.test(m)) return 'PRICE';
    return 'UNKNOWN';
  }
}
