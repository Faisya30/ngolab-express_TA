import { Router } from 'express';
import {
  deleteCategory,
  deleteProduct,
  deleteVoucher,
  getCategories,
  getMemberLogs,
  getMembers,
  getOrderDetails,
  getOrders,
  getProducts,
  getVouchers,
  saveCategory,
  saveProduct,
  saveVoucher,
} from '../controllers/adminController.js';

const router = Router();

router.get('/orders', getOrders);
router.get('/order-details', getOrderDetails);
router.get('/products', getProducts);
router.get('/categories', getCategories);
router.get('/vouchers', getVouchers);
router.get('/members', getMembers);
router.get('/member-logs', getMemberLogs);
router.post('/products', saveProduct);
router.delete('/products/:id', deleteProduct);
router.post('/categories', saveCategory);
router.delete('/categories/:id', deleteCategory);
router.post('/vouchers', saveVoucher);
router.delete('/vouchers/:id', deleteVoucher);

export default router;
