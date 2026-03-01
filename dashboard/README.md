# Panel Farmacia

Panel web (verde y blanco) para gestionar clientes, conversaciones de WhatsApp y campañas.

## Desarrollo

```bash
npm install
npm run dev
```

Abre [http://localhost:3001](http://localhost:3001). El backend debe estar en `http://localhost:3000` (o configurá `NEXT_PUBLIC_API_URL`).

## Variables de entorno

- `NEXT_PUBLIC_API_URL`: URL del backend (ej. `http://localhost:3000`)
- `NEXT_PUBLIC_SEND_API_KEY`: misma clave que `SEND_API_KEY` del backend

Copiá `.env.example` a `.env.local` y completá los valores.

## Build

```bash
npm run build
npm run start
```
