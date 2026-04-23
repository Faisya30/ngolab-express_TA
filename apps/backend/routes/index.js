import authRoutes from './authRoutes.js';
import adminRoutes from './adminRoutes.js';
import kioskRoutes from './kioskRoutes.js';

export function registerRoutes(app) {
  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/kiosk', kioskRoutes);
}
