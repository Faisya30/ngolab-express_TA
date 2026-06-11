import { Router } from 'express';
import * as gamificationController from '../controllers/gamificationController.js';
import * as missionController from '../controllers/missionController.js';
import * as userMissionController from '../controllers/userMissionController.js';
import * as gameController from '../controllers/gameController.js';
import * as pointsHistoryController from '../controllers/pointsHistoryController.js';
import * as gamePlayController from '../controllers/gamePlayController.js';
import * as referralEarningsController from '../controllers/referralEarningsController.js';
import * as gamificationAuthController from '../controllers/gamificationAuthController.js';

const router = Router();

// Auth Routes - Integrated with Membership
router.post('/auth/login', gamificationAuthController.gamificationLogin);
router.get('/auth/profile/:user_id', gamificationAuthController.gamificationProfile);
router.post('/auth/lookup', gamificationAuthController.gamificationLookup);

// User Gamification Routes
router.get('/users', gamificationController.getUsers);
router.get('/users/:id', gamificationController.getUserById);
router.put('/users/:id', gamificationController.updateUser);
router.post('/users/:id/add-points', gamificationController.addPoints);
router.post('/users/:id/checkin', gamificationController.checkin);

// Mission Routes
router.get('/missions', missionController.getMissions);
router.post('/missions', missionController.createMission);
router.put('/missions/:id', missionController.updateMission);
router.delete('/missions/:id', missionController.deleteMission);

// User Mission Routes
router.get('/user-missions', userMissionController.getUserMissions);
router.post('/user-missions/complete', userMissionController.completeMission);

// Game Routes
router.get('/games', gameController.getGames);
router.post('/games', gameController.createGame);
router.put('/games/:id', gameController.updateGame);
router.delete('/games/:id', gameController.deleteGame);
router.post('/games/play', gameController.playGame);

// Points History Routes
router.get('/points-history', pointsHistoryController.getPointsHistory);

// Game Plays Routes
router.get('/game-plays', gamePlayController.getGamePlays);

// Referral Earnings Routes
router.get('/referral-earnings', referralEarningsController.getReferralEarnings);
router.post('/referral-earnings', referralEarningsController.createReferralEarning);

export default router;