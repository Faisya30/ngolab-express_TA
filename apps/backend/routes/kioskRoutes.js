import { Router } from 'express';
import { init, saveOrder } from '../controllers/kioskController.js';

const router = Router();

router.get('/init', init);
router.post('/orders', saveOrder);

export default router;
