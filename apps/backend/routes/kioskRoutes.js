import { Router } from 'express';
import {
  init,
  saveOrder,
  getMember,
  getMemberByUserId,
  lookupMemberByQr,
  getKioskProducts,
} from '../controllers/kioskController.js';

const router = Router();

router.get('/init', init);
router.get('/products', getKioskProducts);
router.get('/member/:code', getMember);
router.get('/members/:user_id', getMemberByUserId);
router.post('/members/qr-lookup', lookupMemberByQr);
router.post('/orders', saveOrder);

export default router;