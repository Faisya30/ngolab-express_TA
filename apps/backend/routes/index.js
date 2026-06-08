import authRoutes from './authRoutes.js';
import adminRoutes from './adminRoutes.js';
import kioskRoutes from './kioskRoutes.js';
import cvRoutes from './cvRoutes.js';
import membershipRoutes from './membershipRoutes.js';
import gamificationRoutes from './gamificationRoutes.js';
import { getAiRecommendation } from '../controllers/recommendationController.js';

export function registerRoutes(app) {
  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/kiosk', kioskRoutes);
  app.use('/api/cv', cvRoutes);
  app.use('/api/membership', membershipRoutes);
  app.use('/api/gamification', gamificationRoutes);

  app.get('/api/recommendation/:user_id', getAiRecommendation);
}
