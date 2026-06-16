import { Router } from 'express';
import multer from 'multer';
import {
  createTransaction,
  earnPoints,
  getAllAffiliates,
  getAllCommissionLogs,
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
  lookupMember,
  login,
  redeemPoints,
  register,
  reviewAffiliateVerification,
  updateGlobalSetting,
  updateMemberStatus,
  updateProfile,
  updateUserRole,
  verifyAffiliate,
} from '../controllers/membershipController.js';
import { requireMembershipJwt, requireSelfMembershipAccess } from '../middlewares/membershipAuth.js';
import { requireConnectionKey } from '../middlewares/connectionKey.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/register', register);
router.post('/login', login);
router.post('/lookup', lookupMember);
router.get('/profile/:user_id', getUserProfile);
router.put('/profile/:user_id', upload.single('profile_picture'), updateProfile);
// Accept multipart uploads (ktm_image) but also accept JSON fallback.
router.post('/affiliate/verify', upload.single('ktm_image'), requireMembershipJwt, requireSelfMembershipAccess, verifyAffiliate);
router.get('/affiliate/network/:user_id', requireMembershipJwt, requireSelfMembershipAccess, getAffiliateNetwork);
router.get('/affiliate/stats/:user_id', requireMembershipJwt, requireSelfMembershipAccess, getAffiliateStats);
router.get('/admin/affiliate-verifications', getAffiliateVerifications);
router.patch('/admin/affiliate-verifications/:verification_id/status', reviewAffiliateVerification);
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

export default router;