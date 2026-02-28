export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  meta: {
    accessToken: process.env.META_ACCESS_TOKEN ?? '',
    phoneNumberId: process.env.META_PHONE_NUMBER_ID ?? '',
    appSecret: process.env.META_APP_SECRET ?? '',
  },
  webhook: {
    verifyToken: process.env.WEBHOOK_VERIFY_TOKEN ?? 'farmacia_verify',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY ?? '',
  },
  siafar: {
    pdfUrl: process.env.SIAFAR_PDF_URL ?? '',
    syncIntervalMinutes: parseInt(process.env.PDF_SYNC_INTERVAL_MINUTES ?? '5', 10),
  },
  database: {
    url: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/farmacia',
  },
  redis: {
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
  },
  send: {
    apiKey: process.env.SEND_API_KEY ?? '',
  },
  rateLimit: {
    maxPerMinute: parseInt(process.env.RATE_LIMIT_MAX ?? '10', 10),
  },
  welcome: {
    message: process.env.WELCOME_MESSAGE ?? '',
  },
});
