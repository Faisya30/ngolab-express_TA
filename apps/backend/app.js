import express from 'express';
import cors from 'cors';
import path from 'path';
import { pingDatabase } from './config/db.js';
import { registerRoutes } from './routes/index.js';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger.js';

function isAllowedLanFrontendOrigin(origin) {
  return /^http:\/\/(\d{1,3}\.){3}\d{1,3}:(3000|3001|3002|3003|3004|3005|4000|5173|5175)$/.test(origin);
}

export function createApp({ frontendOrigins, baseUrl }) {
  const app = express();

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (frontendOrigins.includes(origin)) return callback(null, true);
        if (isAllowedLanFrontendOrigin(origin)) return callback(null, true);
        console.warn(`CORS denied origin: ${origin}`);
        return callback(null, false);
      },
      credentials: true,
    })
  );

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

app.use((req, res, next) => {
  console.log('[REQUEST IN]', req.method, req.path, JSON.stringify(req.body || {}).substring(0, 500));
  const originalSend = res.send;
  const originalJson = res.json;
  res.send = function(body) {
    console.log('[RESPONSE OUT]', req.method, req.path, body?.toString?.().substring(0, 200));
    return originalSend.call(this, body);
  };
  res.json = function(body) {
    console.log('[RESPONSE OUT JSON]', req.method, req.path, JSON.stringify(body).substring(0, 200));
    return originalJson.call(this, body);
  };
  next();
});

  app.use('/uploads', express.static(path.join(process.cwd(), 'apps', 'backend', 'uploads')));

  app.get('/health', async (_req, res) => {
    try {
      const db = await pingDatabase();
      res.json({ ok: true, service: 'ngolab-express-backend', db });
    } catch (_error) {
      res.status(500).json({ ok: false, service: 'ngolab-express-backend', db: false });
    }
  });

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  registerRoutes(app);

  app.use((_req, res) => {
    res.status(404).json({ success: false, error: 'Route tidak ditemukan.' });
  });

  app.use((err, _req, res, _next) => {
    console.error('[GLOBAL ERROR HANDLER]', err);
    if (err?.stack) {
      console.error('[GLOBAL ERROR HANDLER] Stack:', err.stack);
    }
    const statusCode = Number(err?.status || err?.statusCode || 500);
    const message = statusCode === 400
      ? String(err?.message || 'Body JSON tidak valid.')
      : 'Internal server error';

    res.status(statusCode).json({ success: false, error: message });
  });

  process.on('uncaughtException', (err) => {
    console.error('[UNCAUGHT EXCEPTION] Server crash prevented:', err);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('[UNHANDLED REJECTION] Unhandled rejection at:', promise, 'reason:', reason);
  });

  app.set('baseUrl', baseUrl || 'http://0.0.0.0:4000');

  return app;
}
