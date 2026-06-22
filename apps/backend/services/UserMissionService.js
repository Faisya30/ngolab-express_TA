import { UserMissionRepository } from '../repositories/UserMissionRepository.js';
import { MissionRepository } from '../repositories/MissionRepository.js';
import { withTransaction } from '../config/db.js';
import { randomUUID } from 'crypto';

function generateId() {
    return randomUUID().replace(/-/g, '');
}

export class UserMissionService {
    static async getAllUserMissions() {
        return await UserMissionRepository.findAll();
    }

    static async getUserMissions(userId) {
        const userMissions = await UserMissionRepository.findByUserId(userId);
        const query = (sql, params) => this._queryWithProgress(sql, params);

        const missionsWithProgress = [];
        for (const um of userMissions) {
            let progress = 0;

            if (um.missionType === 'CHECKIN') {
                progress = await this._getCheckinProgress(um.userId);
            } else if (um.missionType === 'TRANSACTION') {
                progress = await this._getTransactionProgress(um.userId);
            } else if (um.missionType === 'PRODUCT_PURCHASE') {
                progress = await this._getProductPurchaseProgress(um.userId, um.productCode);
            }

            missionsWithProgress.push({
                missionId: um.missionId,
                missionType: um.missionType,
                progress,
                target: um.target,
                status: um.status,
                productCode: um.productCode,
                rewardPoints: um.rewardPoints
            });
        }

        return missionsWithProgress;
    }

    static async _queryWithProgress(sql, params) {
        const { query } = await import('../config/db.js');
        return await query(sql, params);
    }

    static async _getCheckinProgress(userId) {
        const rows = await this._queryWithProgress(
            'SELECT lastCheckIn FROM UserGamification WHERE user_id = ? LIMIT 1',
            [userId]
        );
        if (!rows[0] || !rows[0][0]) return 0;
        const lastCheckIn = rows[0][0].lastCheckIn;
        if (!lastCheckIn) return 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkinDate = new Date(lastCheckIn);
        checkinDate.setHours(0, 0, 0, 0);
        return checkinDate.getTime() === today.getTime() ? 1 : 0;
    }

    static async _getTransactionProgress(userId) {
        const rows = await this._queryWithProgress(
            'SELECT COUNT(*) as count FROM transactions WHERE user_id = ?',
            [userId]
        );
        return rows[0][0]?.count || 0;
    }

    static async _getProductPurchaseProgress(userId, productCode) {
        const rows = await this._queryWithProgress(
            `SELECT SUM(ti.qty) as qty FROM transactions t
             JOIN transaction_items ti ON ti.transaction_code = t.transaction_code
             WHERE t.user_id = ? AND ti.menu_item_code = ?`,
            [userId, productCode]
        );
        return rows[0][0]?.qty || 0;
    }

    static async completeMission(userId, missionId) {
        return await withTransaction(async (connection) => {
            const queryWithConn = (sql, params) => connection.query(sql, params);

            let userMissions = await queryWithConn(
                'SELECT id, userId, missionId, status, completedAt FROM UserMissions WHERE userId = ? AND missionId = ? LIMIT 1',
                [userId, missionId]
            );

            let userMission = userMissions[0] && userMissions[0][0] ? userMissions[0][0] : null;

            if (userMission && userMission.status === 'claimed') {
                throw new Error('Reward mission sudah pernah diklaim.');
            }

            let userMissionId;
            if (!userMission) {
                userMissionId = generateId();
                await queryWithConn(
                    'INSERT INTO UserMissions (id, userId, missionId, status, completedAt) VALUES (?, ?, ?, ?, NOW())',
                    [userMissionId, userId, missionId, 'completed']
                );
            } else if (userMission.status === 'in_progress') {
                userMissionId = userMission.id;
                await queryWithConn(
                    'UPDATE UserMissions SET status = ?, completedAt = NOW() WHERE id = ?',
                    ['completed', userMissionId]
                );
            } else {
                userMissionId = userMission.id;
            }

            let missionRows = await queryWithConn(
                'SELECT id, title, description, rewardPoints, target, type, product_code, icon, status FROM Missions WHERE id = ? LIMIT 1',
                [missionId]
            );

            let missionRow = missionRows[0] && missionRows[0][0] ? missionRows[0][0] : null;

            if (!missionRow) {
                throw new Error('Mission tidak ditemukan');
            }

            const rewardPoints = missionRow.rewardPoints || 0;
            const target = missionRow.target || 1;
            const missionType = missionRow.type;

            let progress = 0;
            if (missionType === 'CHECKIN') {
                progress = await this._getCheckinProgress(userId);
            } else if (missionType === 'TRANSACTION') {
                progress = await this._getTransactionProgress(userId);
            } else if (missionType === 'PRODUCT_PURCHASE') {
                progress = await this._getProductPurchaseProgress(userId, missionRow.product_code);
            }

            if (progress < target) {
                throw new Error('Target mission belum tercapai.');
            }

            let userRows = await queryWithConn(
                'SELECT user_id, points FROM UserGamification WHERE user_id = ? FOR UPDATE',
                [userId]
            );

            if (!userRows[0] || userRows[0].length === 0) {
                await queryWithConn(
                    'INSERT INTO UserGamification (user_id, points, memberLevel, streakCount, lastCheckIn) VALUES (?, 0, ?, 0, NULL)',
                    [userId, 'Bronze']
                );
            }

            const historyId = generateId();
            await queryWithConn(
                'INSERT INTO PointsHistory (id, userId, points, description, createdAt) VALUES (?, ?, ?, ?, NOW())',
                [historyId, userId, rewardPoints, `Menuntut misi: ${missionRow.title}`]
            );

            await queryWithConn(
                'UPDATE UserGamification SET points = points + ? WHERE user_id = ?',
                [rewardPoints, userId]
            );

            await queryWithConn(
                'UPDATE UserMissions SET status = ? WHERE id = ?',
                ['claimed', userMissionId]
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
                userMission: updatedMissionRows[0][0],
                userGamification: updatedUser[0][0]
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