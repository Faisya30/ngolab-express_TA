import { Router } from 'express';
import { init, saveOrder, getMember } from '../controllers/kioskController.js';

const router = Router();

router.get('/init', init);
router.get('/member/:code', getMember);
router.post('/orders', saveOrder);

export default router;
