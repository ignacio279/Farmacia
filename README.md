# Bot WhatsApp Farmacia SIAFAR

Bot de WhatsApp para farmacia que consulta precios y alternativas de medicamentos según la lista SIAFAR, usando OpenAI para clasificación de intenciones y PostgreSQL para datos de precios.

## Requisitos

- Node.js 18+
- PostgreSQL
- Cuenta Meta Developer (WhatsApp Cloud API)
- API Key de OpenAI
- URL del PDF SIAFAR

## Instalación

```bash
npm install
```

Copiar `.env.example` a `.env` y configurar:

```bash
cp .env.example .env
```

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `PORT` | Puerto del servidor (default: 3000) |
| `DATABASE_URL` | URL de PostgreSQL |
| `META_ACCESS_TOKEN` | Token de acceso WhatsApp Cloud API |
| `META_PHONE_NUMBER_ID` | ID del número de WhatsApp Business |
| `META_APP_SECRET` | App Secret de Meta (para verificar firma webhook) |
| `WEBHOOK_VERIFY_TOKEN` | Token de verificación del webhook |
| `OPENAI_API_KEY` | API Key de OpenAI |
| `SIAFAR_PDF_URL` | URL fija del PDF de precios SIAFAR |
| `PDF_SYNC_INTERVAL_MINUTES` | Intervalo de sincronización (default: 5) |
| `SEND_API_KEY` | API key para proteger el endpoint /send (opcional) |
| `RATE_LIMIT_MAX` | Máximo de consultas por usuario por minuto (default: 10) |

## Ejecución

```bash
# desarrollo
npm run start:dev

# producción
npm run build && npm run start:prod
```

## Endpoints

- `GET /webhook/whatsapp` – Verificación del webhook (Meta)
- `POST /webhook/whatsapp` – Recepción de mensajes (verifica firma X-Hub-Signature-256)
- `POST /send` – Envío interno (Header: `X-Api-Key` si SEND_API_KEY está definido)
  - Body: `{ "to": "5491112345678", "text": "mensaje" }`

## Configuración webhook Meta

1. En Meta App Dashboard, configurar Webhook URL: `https://tu-dominio.com/webhook/whatsapp`
2. Verify Token: valor de `WEBHOOK_VERIFY_TOKEN`
3. Suscribirse a: `messages`

## Estructura del proyecto

```
src/
├── config/          # Configuración
├── webhook/         # Webhook WhatsApp (GET verify + POST receive)
├── send/            # Endpoint de envío interno
├── whatsapp/        # Servicio de envío a Cloud API
├── pdf-sync/        # Sincronización del PDF (cron cada 5 min)
├── pdf-parse/       # Parser del PDF SIAFAR
├── med-search/      # Búsqueda de medicamentos con ranking
├── conversation/    # Estado de conversación por usuario
├── openai-intent/   # Clasificación de intenciones con OpenAI
├── handlers/        # Orquestación de mensajes
├── entities/        # TypeORM entities
└── common/          # Rate limiting, logging
```

## Esquema de base de datos

- `med_prices` – Precios de medicamentos
- `pdf_versions` – Metadatos de versiones del PDF (etag, lastModified, contentHash, etc.)
- `conversations` – Estado por wa_user_id (idle, pending_selection)
- `query_logs` – Registro de consultas para auditoría

## Nota sobre el parser del PDF

El parser en `pdf-parse.service.ts` está adaptado a una estructura genérica de tabla. El formato exacto del PDF SIAFAR puede requerir ajustes en `extractRows` y `parseLine` según el documento real.
