import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { MessageHandlerService } from '../handlers/message-handler.service';
import { MedSearchService } from '../med-search/med-search.service';
import { OpenaiIntentService } from '../openai-intent/openai-intent.service';
import { PdfSyncService } from '../pdf-sync/pdf-sync.service';

@Controller('test')
export class TestController {
  constructor(
    private messageHandler: MessageHandlerService,
    private pdfSync: PdfSyncService,
    private medSearch: MedSearchService,
    private openaiIntent: OpenaiIntentService,
  ) {}

  /**
   * Ver muestra de datos y resultado de búsqueda.
   * GET /test/sample?q=paracetamol
   */
  @Get('sample')
  async sample(@Query() query: { q?: string }): Promise<{ searchResult: unknown[]; sample: unknown[] }> {
    const q = query?.q ?? 'paracetamol';
    const searchResult = await this.medSearch.search(q, 5);
    const sample = await this.medSearch.search('a', 5);
    return { searchResult, sample };
  }

  /**
   * Ejecutar sync del PDF manualmente (sin esperar 5 min).
   * POST /test/sync
   * POST /test/sync?force=true - forzar reimportar aunque el PDF no haya cambiado (útil tras cambiar el parser).
   */
  @Post('sync')
  async triggerSync(
    @Query() query: { force?: string },
  ): Promise<{ changed: boolean; rowsImported?: number; error?: string }> {
    return this.pdfSync.sync(query.force === 'true');
  }

  /**
   * Debug: qué ve el bot, qué devuelve la búsqueda, y qué monodrogas SÍ existen.
   * GET /test/debug?message=precio%20paracetamol
   */
  @Get('debug')
  async debug(
    @Query() query: { message?: string },
  ): Promise<{
    message: string;
    intent: unknown;
    queryText: string;
    searchResults: unknown[];
    monodrogasDisponibles: string[];
    sugerencia: string;
  }> {
    const message = query.message ?? 'precio paracetamol';
    const intent = await this.openaiIntent.classify(message);
    const queryText = intent.queryText?.trim() ?? '';
    const searchResults = queryText
      ? await this.medSearch.search(queryText, 10)
      : [];
    const monodrogasDisponibles = await this.medSearch.getDistinctMonodrogas(100);
    const sugerencia =
      searchResults.length > 0
        ? 'La búsqueda funcionó. Probá en el chat.'
        : monodrogasDisponibles.length > 0
          ? `"${queryText}" no está en la lista. Probá con: ${monodrogasDisponibles.slice(0, 10).join(', ')}`
          : 'No hay monodrogas en la base. Ejecutá POST /test/sync?force=true';
    return {
      message,
      intent: { intent: intent.intent, queryText: intent.queryText, wantsCheapest: intent.wantsCheapest },
      queryText,
      searchResults,
      monodrogasDisponibles,
      sugerencia,
    };
  }

  /**
   * Endpoint para probar el bot desde terminal sin WhatsApp.
   * POST /test/message con body: { "message": "ibuprofeno", "waUserId": "123" }
   */
  @Post('message')
  async testMessage(
    @Body() body: { message: string; waUserId?: string },
  ): Promise<{ response: string }> {
    const waUserId = body.waUserId ?? 'test-user';
    const response = await this.messageHandler.processMessage(waUserId, body.message ?? '');
    return { response };
  }
}
