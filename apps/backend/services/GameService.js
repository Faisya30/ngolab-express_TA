import { GameRepository } from '../repositories/GameRepository.js';
import { UserGamificationRepository } from '../repositories/UserGamificationRepository.js';
import { GamePlayRepository } from '../repositories/GamePlayRepository.js';
import { PointsHistoryRepository } from '../repositories/PointsHistoryRepository.js';
import { withTransaction } from '../config/db.js';
import { randomUUID } from 'crypto';

function generateId() {
    return randomUUID().replace(/-/g, '');
}

export class GameService {
    static async getAllGames() {
        return await GameRepository.findAll();
    }

    static async getActiveGames() {
        return await GameRepository.findActive();
    }

    static async createGame(data) {
        const { id, type, name, cost_points, reward_points, is_active, config_data } = data;
        
        const gameId = id || generateId();
        
        return await GameRepository.create({
            id: gameId,
            type,
            name,
            cost_points,
            reward_points,
            is_active,
            config_data
        });
    }

    static async updateGame(id, data) {
        return await GameRepository.update(id, data);
    }

    static async deleteGame(id) {
        return await GameRepository.delete(id);
    }

    static async playGame(userId, gameId) {
        return await withTransaction(async (connection) => {
            const queryWithConn = (sql, params) => connection.query(sql, params);
            
            const game = await queryWithConn(
                'SELECT id, type, name, cost_points, reward_points, is_active, config_data FROM Games WHERE id = ? AND is_active = TRUE LIMIT 1',
                [gameId]
            );
            
            if (!game[0]) {
                throw new Error('Game tidak ditemukan atau tidak aktif');
            }
            
            const gameData = game[0];
            const costPoints = gameData.cost_points || 0;
            const rewardPoints = gameData.reward_points || 0;
            
            let user = await queryWithConn(
                'SELECT user_id, points FROM UserGamification WHERE user_id = ? FOR UPDATE',
                [userId]
            );
            
            if (!user[0]) {
                await queryWithConn(
                    'INSERT INTO UserGamification (user_id, points, memberLevel, streakCount, lastCheckIn) VALUES (?, 0, ?, 0, NULL)',
                    [userId, 'Bronze']
                );
                user = await queryWithConn(
                    'SELECT user_id, points FROM UserGamification WHERE user_id = ? FOR UPDATE',
                    [userId]
                );
            }
            
            if (user[0].points < costPoints) {
                throw new Error(`Poin tidak cukup. Dibutuhkan ${costPoints} poin, tersedia ${user[0].points} poin`);
            }
            
            const playId = generateId();
            
            await queryWithConn(
                'INSERT INTO GamePlays (id, userId, gameId, gameType, costPoints, rewardPoints, prizeLabel, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
                [playId, userId, gameId, gameData.type, costPoints, rewardPoints, gameData.name]
            );
            
            const historyId = generateId();
            const netPoints = rewardPoints - costPoints;
            
            if (netPoints > 0) {
                await queryWithConn(
                    'INSERT INTO PointsHistory (id, userId, points, description, createdAt) VALUES (?, ?, ?, ?, NOW())',
                    [historyId, userId, netPoints, `Bermain game: ${gameData.name}`]
                );
            }
            
            await queryWithConn(
                'UPDATE UserGamification SET points = points - ? + ? WHERE user_id = ?',
                [costPoints, rewardPoints, userId]
            );
            
            const updatedUser = await queryWithConn(
                'SELECT user_id, points, memberLevel, streakCount, lastCheckIn FROM UserGamification WHERE user_id = ? LIMIT 1',
                [userId]
            );
            
            const gamePlay = await queryWithConn(
                'SELECT id, userId, gameId, gameType, costPoints, rewardPoints, prizeLabel, timestamp FROM GamePlays WHERE id = ? LIMIT 1',
                [playId]
            );
            
            return {
                gamePlay: gamePlay[0],
                userGamification: updatedUser[0],
                pointsSpent: costPoints,
                pointsWon: rewardPoints
            };
        });
    }
}