import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import kioskRoutes from './routes/kioskRoutes.js';
import { pingDatabase } from './db/mysql.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 4000);
const frontendOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  ...(String(process.env.FRONTEND_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)),
]
  .filter((origin, index, array) => array.indexOf(origin) === index)
  .map((origin) => origin.trim())
  .filter(Boolean);

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
app.use(express.json({ limit: '2mb' }));

app.get('/health', async (_req, res) => {
  try {
    const db = await pingDatabase();
    res.json({ ok: true, service: 'ngolab-express-backend', db });
  } catch (_error) {
    res.status(500).json({ ok: false, service: 'ngolab-express-backend', db: false });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/kiosk', kioskRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});
