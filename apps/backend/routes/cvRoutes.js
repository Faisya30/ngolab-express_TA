import { Router } from 'express';
import {
  deleteCvProduct,
  getCvCategories,
  getCvProductByBarcode,
  getCvProducts,
  saveCvProduct,
  saveCvOrder,
  getCvOrders,
} from '../controllers/cvController.js';

const router = Router();

router.get('/categories', getCvCategories);
router.get('/products', getCvProducts);
router.post('/products', saveCvProduct);
router.put('/products/:id', saveCvProduct);
router.delete('/products/:id', deleteCvProduct);
router.get('/products/by-barcode/:barcode', getCvProductByBarcode);
router.get('/orders', getCvOrders);
router.post('/orders', saveCvOrder);

export default router;
