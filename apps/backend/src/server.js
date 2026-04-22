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
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: frontendOrigin, credentials: true }));
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
