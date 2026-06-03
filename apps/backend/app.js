import express from 'express';
import cors from 'cors';
import { pingDatabase } from './config/db.js';
import { registerRoutes } from './routes/index.js';

function isAllowedLanFrontendOrigin(origin) {
  // Mirror the local dev frontend ports for LAN access (same host, different device).
  return /^http:\/\/(\d{1,3}\.){3}\d{1,3}:(3000|3001|3002|3004|3005|5173)$/.test(origin);
}

export function createApp({ frontendOrigins }) {
  const app = express();

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (frontendOrigins.includes(origin)) return callback(null, true);
        if (isAllowedLanFrontendOrigin(origin)) return callback(null, true);
        console.warn(`CORS denied origin: ${origin}`);
        // Deny the origin without throwing an Error to avoid turning CORS failures
        // into HTTP 500 responses. The cors middleware will not set the
        // Access-Control-Allow-Origin header for denied origins.
        return callback(null, false);
      },
      credentials: true,
    })
  );

  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));

  app.get('/health', async (_req, res) => {
    try {
      const db = await pingDatabase();
      res.json({ ok: true, service: 'ngolab-express-backend', db });
    } catch (_error) {
      res.status(500).json({ ok: false, service: 'ngolab-express-backend', db: false });
    }
  });

  registerRoutes(app);

  app.use((err, _req, res, _next) => {
    console.error(err);
    const statusCode = Number(err?.status || err?.statusCode || 500);
    const message = statusCode === 400
      ? String(err?.message || 'Body JSON tidak valid.')
      : 'Internal server error';

    res.status(statusCode).json({ success: false, error: message });
  });

  return app;
}
