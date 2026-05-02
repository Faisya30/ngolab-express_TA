import { Router } from 'express';
import {
  deleteCategory,
  deleteProduct,
  getCategories,
  getOrderDetails,
  getOrders,
  getProducts,
  saveCategory,
  saveProduct,
} from '../controllers/adminController.js';

const router = Router();

router.get('/orders', getOrders);
router.get('/order-details', getOrderDetails);
router.get('/products', getProducts);
router.get('/categories', getCategories);
router.post('/products', saveProduct);
router.delete('/products/:id', deleteProduct);
router.post('/categories', saveCategory);
router.delete('/categories/:id', deleteCategory);

export default router;
