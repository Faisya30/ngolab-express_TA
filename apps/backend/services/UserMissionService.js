import { UserMissionRepository } from '../repositories/UserMissionRepository.js';
import { MissionRepository } from '../repositories/MissionRepository.js';
import { withTransaction } from '../config/db.js';
import { randomUUID } from 'crypto';

function generateId() {
    return randomUUID().replace(/-/g, '');
}

function calculateMemberLevel(points) {
    if (points >= 2000) return 'Platinum';
    if (points >= 1000) return 'Gold';
    return 'Silver';
}

export class UserMissionService {
    static async getAllUserMissions() {
        return await UserMissionRepository.findAll();
    }

    static async getUserMissions(userId) {
        console.log('DEBUG getUserMissions - userId received:', userId);
        
        const activeMissions = await MissionRepository.findActive();
        console.log('DEBUG activeMissions raw:', JSON.stringify(activeMissions, null, 2));

        const claimedMissions = await UserMissionRepository.findByUserId(userId);
        console.log('DEBUG claimedMissions raw:', JSON.stringify(claimedMissions, null, 2));
        
        const claimedMap = new Map();
        for (const cm of claimedMissions) {
            claimedMap.set(cm.missionId, cm);
        }

        console.log('MISSION DEBUG', {
            userId,
            activeMissionCount: activeMissions.length,
            claimedMissionCount: claimedMissions.length
        });

        const missionsWithStatus = [];
        for (const mission of activeMissions) {
            console.log('DEBUG Processing mission:', {
                missionId: mission.id,
                missionType: mission.missionType,
                target: mission.target
            });
            
            const progress = await this._calculateProgress(userId, mission.missionType, mission.target, mission.productCode);
            console.log('DEBUG progress for mission:', {
                missionId: mission.id,
                missionType: mission.missionType,
                target: mission.target,
                progress
            });
            
            const alreadyClaimed = claimedMap.get(mission.id);

            let status;
            if (alreadyClaimed && alreadyClaimed.status === 'claimed') {
                status = 'claimed';
            } else if (progress >= mission.target) {
                status = 'completed';
            } else {
                status = 'in_progress';
            }

            console.log('MISSION DEBUG', {
                userId,
                missionId: mission.id,
                missionType: mission.missionType,
                progress,
                target: mission.target,
                status
            });

            missionsWithStatus.push({
                missionId: mission.id,
                missionType: mission.missionType,
                title: mission.title,
                description: mission.description,
                icon: mission.icon,
                progress,
                target: mission.target,
                status,
                productCode: mission.productCode,
                rewardPoints: mission.rewardPoints
            });
        }

        console.log('DEBUG missionsWithStatus before return:', JSON.stringify(missionsWithStatus, null, 2));
        
        console.log('================ MISSION STREAK DEBUG ================');
        missionsWithStatus
          .filter(m => m.missionType === 'STREAK')
          .forEach(m => {
            console.log({
              missionId: m.missionId,
              missionType: m.missionType,
              progress: m.progress,
              target: m.target,
              status: m.status,
              rewardPoints: m.rewardPoints
            });
          });
        console.log('=====================================================');
        
        return missionsWithStatus;
    }

    static async _queryWithProgress(sql, params) {
        const { query } = await import('../config/db.js');
        return await query(sql, params);
    }

    static async _calculateProgress(userId, missionType, target, productCode) {
        if (missionType === 'CHECKIN') {
            return await this._getCheckinProgress(userId, target);
        } else if (missionType === 'STREAK') {
            return await this._getStreakProgress(userId);
        } else if (missionType === 'TRANSACTION') {
            return await this._getTransactionProgress(userId);
        } else if (missionType === 'PRODUCT_PURCHASE') {
            return await this._getProductPurchaseProgress(userId, productCode);
        }
        return 0;
    }

    static async _getCheckinProgress(userId, target) {
        const rows = await this._queryWithProgress(
            'SELECT lastCheckIn, streakCount FROM UserGamification WHERE user_id = ? LIMIT 1',
            [userId]
        );
        if (!rows || rows.length === 0) return 0;
        const lastCheckIn = rows[0].lastCheckIn;
        const streakCount = rows[0].streakCount || 0;
        if (!lastCheckIn) return 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkinDate = new Date(lastCheckIn);
        checkinDate.setHours(0, 0, 0, 0);
        if (target && target > 1) {
            return checkinDate.getTime() === today.getTime() ? streakCount : 0;
        }
        return checkinDate.getTime() === today.getTime() ? 1 : 0;
    }

    static async _getStreakProgress(userId) {
        const rows = await this._queryWithProgress(
            'SELECT streakCount FROM UserGamification WHERE user_id = ? LIMIT 1',
            [userId]
        );
        if (!rows || rows.length === 0) return 0;
        return rows[0].streakCount || 0;
    }

    static async _getTransactionProgress(userId) {
        const rows = await this._queryWithProgress(
            'SELECT COUNT(*) as count FROM orders WHERE user_id = ?',
            [userId]
        );
        if (!rows || rows.length === 0) return 0;
        return rows[0].count || 0;
    }

    static async _getProductPurchaseProgress(userId, productCode) {
        const rows = await this._queryWithProgress(
            `SELECT SUM(oi.qty) as qty FROM orders o
             JOIN order_items oi ON oi.order_code = o.order_code
             WHERE o.user_id = ? AND oi.product_code = ?`,
            [userId, productCode]
        );
        if (!rows || rows.length === 0) return 0;
        return rows[0].qty || 0;
    }

    static async completeMission(userId, missionId) {
        return await withTransaction(async (connection) => {
            const queryWithConn = async (sql, params) => {
                const [rows] = await connection.query(sql, params);
                return rows;
            };

            const missionRows = await queryWithConn(
                'SELECT id, title, description, rewardPoints, target, type, product_code, icon, status FROM Missions WHERE id = ? LIMIT 1',
                [missionId]
            );

            console.log('MISSION RAW', missionRows);
            console.log('MISSION FIRST', missionRows[0]);

            if (!missionRows || missionRows.length === 0) {
                throw new Error('Mission tidak ditemukan');
            }

            const mission = missionRows[0];
            const rewardPoints = mission.rewardPoints || 0;
            const target = mission.target || 1;
            const missionType = mission.type;

            const progress = await this._calculateProgress(userId, missionType, target, mission.product_code);

            console.log('CLAIM DEBUG', {
                missionId,
                missionType: mission.type,
                target: mission.target,
                progress
            });

            if (progress < target) {
                throw new Error('Target mission belum tercapai.');
            }

            const existingClaim = await queryWithConn(
                'SELECT id, status, completedAt FROM UserMissions WHERE userId = ? AND missionId = ? LIMIT 1',
                [userId, missionId]
            );

            let userMissionId;

            if (existingClaim && existingClaim.length > 0 && existingClaim[0].status === 'claimed') {
                throw new Error('Reward mission sudah pernah diklaim.');
            }

            if (existingClaim && existingClaim.length > 0) {
                userMissionId = existingClaim[0].id;
                await queryWithConn(
                    'UPDATE UserMissions SET status = ?, completedAt = NOW() WHERE id = ?',
                    ['claimed', userMissionId]
                );
            } else {
                userMissionId = generateId();
                await queryWithConn(
                    'INSERT INTO UserMissions (id, userId, missionId, status, completedAt) VALUES (?, ?, ?, ?, NOW())',
                    [userMissionId, userId, missionId, 'claimed']
                );
            }

            const userCheck = await queryWithConn(
                'SELECT user_id, points FROM UserGamification WHERE user_id = ? FOR UPDATE',
                [userId]
            );

            if (!userCheck || userCheck.length === 0) {
                await queryWithConn(
                    'INSERT INTO UserGamification (user_id, points, memberLevel, streakCount, lastCheckIn) VALUES (?, ?, ?, ?, NULL)',
                    [userId, 0, 'Silver', 0]
                );
            }

            const historyId = generateId();
            await queryWithConn(
                'INSERT INTO PointsHistory (id, userId, points, description, createdAt) VALUES (?, ?, ?, ?, NOW())',
                [historyId, userId, rewardPoints, `Menuntut misi: ${mission.title}`]
            );

            await queryWithConn(
                'UPDATE UserGamification SET points = points + ? WHERE user_id = ?',
                [rewardPoints, userId]
            );
            
            const updatedForUserLevel = await queryWithConn(
                'SELECT points FROM UserGamification WHERE user_id = ? LIMIT 1',
                [userId]
            );
            const newMemberLevel = calculateMemberLevel(Number(updatedForUserLevel[0]?.points || 0));
            await queryWithConn(
                'UPDATE UserGamification SET memberLevel = ? WHERE user_id = ?',
                [newMemberLevel, userId]
            );

            const updatedUser = await queryWithConn(
                'SELECT user_id, points, memberLevel, streakCount, lastCheckIn FROM UserGamification WHERE user_id = ? LIMIT 1',
                [userId]
            );

            const updatedMissionRows = await queryWithConn(
                'SELECT id, userId, missionId, status, completedAt FROM UserMissions WHERE id = ? LIMIT 1',
                [userMissionId]
            );

            return {
                userMission: updatedMissionRows[0],
                userGamification: updatedUser[0]
            };
        });
    }

    static async assignMission(userId, missionId) {
        const existing = await UserMissionRepository.findByUserId(userId);
        const alreadyAssigned = existing.find(um => um.missionId === missionId);
        
        if (alreadyAssigned) {
            return alreadyAssigned;
        }
        
        const id = generateId();
        return await UserMissionRepository.create({
            id,
            userId,
            missionId,
            status: 'in_progress',
            completedAt: null
        });
    }
}