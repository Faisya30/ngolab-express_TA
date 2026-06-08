import { Router } from 'express';
import { init, saveOrder, getMember, lookupMemberByQr } from '../controllers/kioskController.js';

const router = Router();

router.get('/init', init);
router.get('/member/:code', getMember);
router.post('/orders', saveOrder);
router.post('/members/qr-lookup', lookupMemberByQr);

export default router;
