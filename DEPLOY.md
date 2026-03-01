# Guía de despliegue a producción

## Checklist

### 1. Infraestructura

| Recurso | Opciones | Requerido |
|---------|----------|-----------|
| **PostgreSQL** | [Neon](https://neon.tech), [Supabase](https://supabase.com), [Railway](https://railway.app), [Render](https://render.com), AWS RDS | ✅ Sí |
| **Hosting** | Railway, Render, Fly.io, DigitalOcean, Vercel (Serverless), AWS | ✅ Sí |
| **Dominio + HTTPS** | Automático en Railway/Render/Fly, o Cloudflare + tu dominio | ✅ Sí |
| **Redis** | Opcional (el rate limit usa memoria por ahora) | ❌ No |

### 2. WhatsApp Cloud API (Meta)

1. **Cuenta de desarrollador Meta**: https://developers.facebook.com
2. **Crear app** → Agregar producto **WhatsApp** → **API de WhatsApp Cloud**
3. **Configurar webhook**:
   - URL: `https://tu-dominio.com/webhook/whatsapp`
   - Token de verificación: mismo valor que `WEBHOOK_VERIFY_TOKEN`
   - Suscribir a: `messages`
4. **Obtener credenciales**:
   - `META_ACCESS_TOKEN`: token de larga duración (60 días, renovable)
   - `META_PHONE_NUMBER_ID`: ID del número de teléfono de la API
   - `META_APP_SECRET`: App Secret de la app

### 3. Variables de entorno (producción)

```env
PORT=3000
DATABASE_URL=postgresql://usuario:contraseña@host:5432/farmacia

# WhatsApp (Meta)
META_ACCESS_TOKEN=tu_token_permanente
META_PHONE_NUMBER_ID=123456789
META_APP_SECRET=tu_app_secret
WEBHOOK_VERIFY_TOKEN=elige_un_token_secreto

# OpenAI (opcional, mejora clasificación de intenciones)
OPENAI_API_KEY=sk-...

# SIAFAR (ya configurado)
SIAFAR_PDF_URL=https://siafar.com/precios/pdf/Precios260222.pdf
PDF_SYNC_INTERVAL_MINUTES=5

# Envío programado (si usás POST /send o POST /broadcast)
SEND_API_KEY=elige_una_api_key_secreta

RATE_LIMIT_MAX=20

# Mensaje de bienvenida fijo al inicio de cada respuesta del bot
WELCOME_MESSAGE=Hola, bienvenido a la farmacia. Consultá precios según lista SIAFAR.
```

### Mensaje de bienvenida

Si definís `WELCOME_MESSAGE`, el bot lo envía al inicio de cada respuesta (saludo + respuesta).

### Broadcast (avisos a todos los contactos)

- **Contactos**: Se agregan automáticamente todos los que le escriben al bot (tabla `broadcast_contacts`).
- **Enviar a todos**: `POST /broadcast` con header `x-api-key: <SEND_API_KEY>` y body `{ "message": "Hoy hay descuento en..." }`.
- **Listar contactos**: `GET /broadcast/contacts` con el mismo `x-api-key`.

### Campañas de marketing

Para avisos tipo descuento, cumpleaños o anuncios (se guarda historial y podés personalizar con el nombre):

- **Enviar campaña**: `POST /broadcast/campaigns` con header `x-api-key: <SEND_API_KEY>` y body:
  - `type`: `"discount"` | `"birthday"` | `"announcement"` | `"custom"`
  - `message`: texto a enviar (obligatorio)
  - `title`: opcional, para identificar la campaña
  - En el mensaje podés usar `{{name}}` y se reemplaza por el nombre del contacto (o "cliente" si no tiene).
- **Ejemplo descuento**: `{ "type": "discount", "title": "Oferta hoy", "message": "Hola {{name}}, hoy 20% en vitaminas. Pasate por la farmacia." }`
- **Ejemplo cumpleaños**: `{ "type": "birthday", "message": "¡Feliz cumpleaños {{name}}! Te esperamos con un regalo." }`
- **Listar campañas**: `GET /broadcast/campaigns?limit=20` con `x-api-key`.

### Panel web (dashboard)

- **Ubicación**: carpeta `dashboard/` (Next.js). Ejecutar con `npm run dev` (puerto 3001) o desplegar en Vercel.
- **Variables del dashboard**: `NEXT_PUBLIC_API_URL` (URL del backend) y `NEXT_PUBLIC_SEND_API_KEY` (misma que `SEND_API_KEY`).
- **Backend CORS**: definir `DASHBOARD_ORIGIN` con la URL del panel (ej. `https://tu-panel.vercel.app` o `http://localhost:3001`). Varios orígenes separados por coma.

### 4. Seguridad antes de subir

- [ ] **Quitar credenciales de .env.example** (ya no poner `OPENAI_API_KEY` real)
- [ ] **Deshabilitar o proteger `/test/*`** en producción (solo para debug)
- [ ] `META_APP_SECRET` debe estar definido para validar webhooks
- [ ] `SEND_API_KEY` debe ser fuerte y secreto

### 5. Después del deploy

1. **Verificar webhook**: Meta envía GET a `/webhook/whatsapp?hub.verify_token=...`
2. **Sync inicial**: `POST https://tu-dominio.com/test/sync?force=true` (o hacer un endpoint admin protegido)
3. **Probar** enviando un mensaje al número de WhatsApp configurado

### 6. Sugerencias opcionales

- **Proteger /test en prod**: middleware que bloquee `/test` salvo con API key
- **Logs**: agregar Winston o Pino para producción
- **Health check**: endpoint `/health` para monitoreo
- **Backups**: backups automáticos de PostgreSQL
