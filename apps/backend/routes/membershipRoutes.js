import { Router } from 'express';
import {
  createTransaction,
  earnPoints,
  getAllAffiliates,
  getAllMembers,
  getCommissionLogs,
  getGlobalSettings,
  getHubDataAdmin,
  getPointLogs,
  getTransactionDetail,
  getUserProfile,
  login,
  redeemPoints,
  register,
  updateGlobalSetting,
  updateMemberStatus,
  updateProfile,
  updateUserRole,
  verifyAffiliate,
} from '../controllers/membershipController.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile/:user_id', getUserProfile);
router.put('/profile/:user_id', updateProfile);
router.post('/affiliate/verify', verifyAffiliate);
router.get('/admin/hub-data', getHubDataAdmin);
router.get('/admin/members', getAllMembers);
router.get('/admin/affiliates', getAllAffiliates);
router.patch('/admin/members/:user_id/status', updateMemberStatus);
router.patch('/admin/users/:user_id/role', updateUserRole);
router.get('/settings', getGlobalSettings);
router.patch('/settings/:setting_key', updateGlobalSetting);
router.get('/commission-logs', getCommissionLogs);
router.post('/redeem-points', redeemPoints);
router.get('/point-logs/:user_id', getPointLogs);
router.post('/transactions', createTransaction);
router.get('/transactions/:transaction_code', getTransactionDetail);
router.post('/gamification/earn-points', earnPoints);

export default router;