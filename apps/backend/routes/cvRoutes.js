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
  getCvMemberByCode,
  lookupCvMemberByQr,
  getCvMemberVouchers,
} from '../controllers/cvController.js';

const router = Router();

router.get('/categories', getCvCategories);
router.get('/products', getCvProducts);
router.post('/products', saveCvProduct);
router.put('/products/:id', saveCvProduct);
router.delete('/products/:id', deleteCvProduct);
router.get('/products/by-barcode/:barcode', getCvProductByBarcode);

router.post(
  '/products/upload-image',
  multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
  }).single('image'),
  uploadCvProductImage
);

router.get('/orders', getCvOrders);
router.post('/orders', saveCvOrder);
router.get('/order-details', getCvOrderDetails);

// Membership
router.get('/members/:user_id/vouchers', getCvMemberVouchers);
router.get('/members/:code', getCvMemberByCode);
router.post('/members/qr-lookup', lookupCvMemberByQr);

export default router;