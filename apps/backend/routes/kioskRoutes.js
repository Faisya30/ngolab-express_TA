import { Router } from 'express';
import { init, saveOrder, getMember, getMemberByUserId, lookupMemberByQr } from '../controllers/kioskController.js';

const router = Router();

router.get('/init', init);
router.get('/member/:code', getMember);
router.get('/members/:user_id', getMemberByUserId);
router.post('/members/qr-lookup', lookupMemberByQr);
router.post('/orders', saveOrder);

export default router;
