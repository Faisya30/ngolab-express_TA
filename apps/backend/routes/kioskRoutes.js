import { Router } from 'express';

import {
  init,
  saveOrder,
  getMember,
  getMemberByUserId,
  lookupMemberByQr,
  getKioskProducts,
  getOrderHistoryByUserId,
  getAdminDashboard,
} from '../controllers/kioskController.js';

import { getAiRecommendation } from '../controllers/recommendationController.js';

const router = Router();

router.get('/init', init);

router.get('/products', getKioskProducts);

router.get('/member/:code', getMember);

router.get('/members/:user_id', getMemberByUserId);

router.post('/members/qr-lookup', lookupMemberByQr);

router.post('/orders', saveOrder);

router.get('/ai-insights/:user_id', getAiRecommendation);
router.get('/ai-insights/:userId', getAiRecommendation);

// tambahan untuk aplikasi afiliasi

router.get('/orders/user/:user_id', getOrderHistoryByUserId);
router.get('/admin/dashboard', getAdminDashboard);
export default router;
