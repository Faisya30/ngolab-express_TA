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
import { uploadVoucherImage } from '../controllers/voucherImageController.js';
import {
  getAllVouchers,
  createVoucher,
  updateVoucher,
  deleteVoucher,
} from '../controllers/voucherController.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipe file tidak diizinkan. Hanya jpeg, png, dan webp.'));
    }
  },
});
const uploadProduct = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.get('/orders', getOrders);
router.get('/order-details', getOrderDetails);
router.get('/products', getProducts);
router.get('/categories', getCategories);
router.post('/products', saveProduct);
router.post('/products/upload-image', uploadProduct.single('image'), uploadProductImage);
router.delete('/products/:id', deleteProduct);
router.post('/categories', saveCategory);
router.delete('/categories/:id', deleteCategory);
router.get('/vouchers', getAllVouchers);
router.post('/vouchers', createVoucher);
router.put('/vouchers/:id', updateVoucher);
router.delete('/vouchers/:id', deleteVoucher);
router.post('/vouchers/upload-image', upload.single('image'), uploadVoucherImage);

export default router;
