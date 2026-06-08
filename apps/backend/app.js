import express from 'express';
import cors from 'cors';
import path from 'path';
import { pingDatabase } from './config/db.js';
import { registerRoutes } from './routes/index.js';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger.js';

function isAllowedLanFrontendOrigin(origin) {
  return /^http:\/\/(\d{1,3}\.){3}\d{1,3}:(3000|3001|3002|3004|3005|4000|5173|5175)$/.test(origin);
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
        return callback(null, false);
      },
      credentials: true,
    })
  );

  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));

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
