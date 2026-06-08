import { UserMissionRepository } from '../repositories/UserMissionRepository.js';
import { MissionRepository } from '../repositories/MissionRepository.js';
import { UserGamificationRepository } from '../repositories/UserGamificationRepository.js';
import { PointsHistoryRepository } from '../repositories/PointsHistoryRepository.js';
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
        return await UserMissionRepository.findByUserId(userId);
    }

    static async completeMission(userId, missionId) {
        return await withTransaction(async (connection) => {
            const queryWithConn = (sql, params) => connection.query(sql, params);
            
            let userMissions = await queryWithConn(
                'SELECT id, userId, missionId, status, completedAt FROM UserMissions WHERE userId = ? AND missionId = ? LIMIT 1',
                [userId, missionId]
            );
            
            let userMissionId;
            if (!userMissions[0]) {
                userMissionId = generateId();
                await queryWithConn(
                    'INSERT INTO UserMissions (id, userId, missionId, status, completedAt) VALUES (?, ?, ?, ?, NOW())',
                    [userMissionId, userId, missionId, 'completed']
                );
            } else {
                userMissionId = userMissions[0].id;
                await queryWithConn(
                    'UPDATE UserMissions SET status = ?, completedAt = NOW() WHERE id = ?',
                    ['completed', userMissionId]
                );
            }
            
            const mission = await queryWithConn(
                'SELECT id, title, description, rewardPoints, target, type, icon, status FROM Missions WHERE id = ? LIMIT 1',
                [missionId]
            );
            
            if (!mission[0]) {
                throw new Error('Mission tidak ditemukan');
            }
            
            const rewardPoints = mission[0].rewardPoints || 0;
            
            let user = await queryWithConn(
                'SELECT user_id, points FROM UserGamification WHERE user_id = ? FOR UPDATE',
                [userId]
            );
            
            if (!user[0]) {
                await queryWithConn(
                    'INSERT INTO UserGamification (user_id, points, memberLevel, streakCount, lastCheckIn) VALUES (?, 0, ?, 0, NULL)',
                    [userId, 'Bronze']
                );
            }
            
            const historyId = generateId();
            await queryWithConn(
                'INSERT INTO PointsHistory (id, userId, points, description, createdAt) VALUES (?, ?, ?, ?, NOW())',
                [historyId, userId, rewardPoints, `Menuntut misi: ${mission[0].title}`]
            );
            
            await queryWithConn(
                'UPDATE UserGamification SET points = points + ? WHERE user_id = ?',
                [rewardPoints, userId]
            );
            
            const updatedUser = await queryWithConn(
                'SELECT user_id, points, memberLevel, streakCount, lastCheckIn FROM UserGamification WHERE user_id = ? LIMIT 1',
                [userId]
            );
            
            const updatedMission = await queryWithConn(
                'SELECT id, userId, missionId, status, completedAt FROM UserMissions WHERE id = ? LIMIT 1',
                [userMissionId]
            );
            
            return {
                userMission: updatedMission[0],
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