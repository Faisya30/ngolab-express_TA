import express from 'express';
import cors from 'cors';
import { pingDatabase } from './config/db.js';
import { registerRoutes } from './routes/index.js';

export function createApp({ frontendOrigins }) {
  const app = express();

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (frontendOrigins.includes(origin)) return callback(null, true);
        return callback(new Error(`Origin tidak diizinkan oleh CORS: ${origin}`));
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
    res.status(500).json({ success: false, error: 'Internal server error' });
  });

  return app;
}
