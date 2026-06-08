import { Router } from 'express';
import multer from 'multer';
import {
  deleteCvProduct,
  getCvCategories,
  getCvProductByBarcode,
  getCvProducts,
  saveCvProduct,
  saveCvOrder,
  getCvOrders,
  getCvOrderDetails,
  uploadCvProductImage,
} from '../controllers/cvController.js';

const router = Router();

router.get('/categories', getCvCategories);
router.get('/products', getCvProducts);
router.post('/products', saveCvProduct);
router.put('/products/:id', saveCvProduct);
router.delete('/products/:id', deleteCvProduct);
router.get('/products/by-barcode/:barcode', getCvProductByBarcode);
router.post('/products/upload-image', multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }).single('image'), uploadCvProductImage);
router.get('/orders', getCvOrders);
router.post('/orders', saveCvOrder);
router.get('/order-details', getCvOrderDetails);

export default router;
