import { Router } from 'express';
import {
  getActiveVouchers,
  getCvMemberByCode,
  getCvProductByBarcode,
  getCvProducts,
  saveCvOrder,
} from '../controllers/cvController.js';

const router = Router();

router.get('/products', getCvProducts);
router.get('/products/by-barcode/:barcode', getCvProductByBarcode);
router.get('/members/:code', getCvMemberByCode);
router.get('/vouchers/active', getActiveVouchers);
router.post('/orders', saveCvOrder);

export default router;
