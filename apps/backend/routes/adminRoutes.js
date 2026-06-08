import { Router } from 'express';
import multer from 'multer';
import {
  deleteCategory,
  deleteProduct,
  getCategories,
  getOrderDetails,
  getOrders,
  getProducts,
  saveCategory,
  saveProduct,
  uploadProductImage,
} from '../controllers/adminController.js';

const router = Router();

router.get('/orders', getOrders);
router.get('/order-details', getOrderDetails);
router.get('/products', getProducts);
router.get('/categories', getCategories);
router.post('/products', saveProduct);
router.post('/products/upload-image', multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }).single('image'), uploadProductImage);
router.delete('/products/:id', deleteProduct);
router.post('/categories', saveCategory);
router.delete('/categories/:id', deleteCategory);

export default router;
