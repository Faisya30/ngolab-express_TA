import { Router } from 'express';
import multer from 'multer';
import {
  createTransaction,
  earnPoints,
  getAllAffiliates,
  getAllCommissionLogs,
  getAdminAiInsights,
  getAffiliateVerifications,
  getAllMembers,
  getCommissionLogs,
  getAffiliateNetwork,
  getAffiliateStats,
  getGlobalSettings,
  getHubDataAdmin,
  getPointLogs,
  getRecommendedProducts,
  getTransactionDetail,
  getTransactionHistory,
  getUserProfile,
  getUserVouchers,
  lookupMember,
  login,
  getMembershipPoints,
  redeemPoints,
  register,
  updateGlobalSetting,
  updateMemberStatus,
  updateProfile,
  updateUserRole,
  verifyAffiliateByBarcode,
} from '../controllers/membershipController.js';
import { requireMembershipJwt, requireSelfMembershipAccess } from '../middlewares/membershipAuth.js';
import { requireConnectionKey } from '../middlewares/connectionKey.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

function deprecatedEndpoint(req, res) {
  return res.status(410).json({
    success: false,
    error: 'Endpoint ini sudah tidak digunakan. Gunakan POST /api/membership/affiliate/verify-barcode untuk verifikasi affiliate.',
  });
}

router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));
router.post('/lookup', lookupMember);
router.get('/profile/:user_id', getUserProfile);
router.get('/points/:user_id', getMembershipPoints);
router.put('/profile/:user_id', upload.single('profile_picture'), updateProfile);
router.post('/affiliate/verify', deprecatedEndpoint);
router.post('/affiliate/verify-barcode', requireMembershipJwt, requireSelfMembershipAccess, verifyAffiliateByBarcode);
router.get('/affiliate/network/:user_id', requireMembershipJwt, requireSelfMembershipAccess, getAffiliateNetwork);
router.get('/affiliate/stats/:user_id', requireMembershipJwt, requireSelfMembershipAccess, getAffiliateStats);
router.get('/admin/affiliate-verifications', getAffiliateVerifications);
router.patch('/admin/affiliate-verifications/:verification_id/status', deprecatedEndpoint);
router.get('/admin/hub-data', getHubDataAdmin);
router.get('/admin/members', getAllMembers);
router.get('/admin/affiliates', getAllAffiliates);
router.patch('/admin/members/:user_id/status', updateMemberStatus);
router.patch('/admin/users/:user_id/role', updateUserRole);
router.get('/settings', getGlobalSettings);
router.patch('/settings/:setting_key', updateGlobalSetting);
router.get('/admin/commission-logs', getAllCommissionLogs);
router.get('/commission-logs', getCommissionLogs);
router.get('/commission-logs/:user_id', getCommissionLogs);
router.post('/redeem-points', redeemPoints);
router.get('/point-logs/:user_id', getPointLogs);
router.post('/transactions', createTransaction);
router.get('/transactions/:transaction_code', getTransactionDetail);
router.get('/transactions/history/:user_id', requireMembershipJwt, requireSelfMembershipAccess, getTransactionHistory);
router.post('/gamification/earn-points', earnPoints);
router.get('/recommended-products', getRecommendedProducts);
router.get('/admin/ai-insights', getAdminAiInsights);
router.get('/users/:user_id/vouchers', getUserVouchers);

export default router;