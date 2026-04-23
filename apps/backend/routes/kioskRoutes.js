import { Router } from 'express';
import { getMemberByCode, init, saveOrder } from '../controllers/kioskController.js';

const router = Router();

router.get('/init', init);
router.get('/member/:code', getMemberByCode);
router.post('/orders', saveOrder);

export default router;
