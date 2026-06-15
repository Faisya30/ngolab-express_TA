import { GameRepository } from '../repositories/GameRepository.js';
import { UserGamificationRepository } from '../repositories/UserGamificationRepository.js';
import { GamePlayRepository } from '../repositories/GamePlayRepository.js';
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
            const baseRewardPoints = gameData.reward_points || 0;
            
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
            
            const configData = gameData.config_data ? (typeof gameData.config_data === 'string' ? JSON.parse(gameData.config_data) : gameData.config_data) : null;
            const prizes = configData?.prizes || [];
            const cooldownSeconds = configData?.cooldownSeconds || 0;
            
            let selectedIndex = 0;
            let prizeLabel = gameData.name;
            let rewardValue = baseRewardPoints;
            let rewardType = 'POINT';
            
            if (prizes.length > 0) {
                const randomPrize = prizes[Math.floor(Math.random() * prizes.length)];
                selectedIndex = prizes.indexOf(randomPrize);
                prizeLabel = randomPrize.label || gameData.name;
                rewardValue = Number(randomPrize.value || baseRewardPoints);
                rewardType = (randomPrize.type || 'POINT').toUpperCase();
            } else {
                selectedIndex = 0;
                prizeLabel = gameData.name;
                rewardValue = baseRewardPoints;
                rewardType = 'POINT';
            }
            
            await queryWithConn(
                'INSERT INTO GamePlays (id, userId, gameId, gameType, costPoints, rewardPoints, prizeLabel, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
                [playId, userId, gameId, gameData.type, costPoints, rewardValue, prizeLabel]
            );
            
            const historyId = generateId();
            const netPoints = rewardValue - costPoints;
            
            if (netPoints !== 0) {
                await queryWithConn(
                    'INSERT INTO PointsHistory (id, userId, points, description, createdAt) VALUES (?, ?, ?, ?, NOW())',
                    [historyId, userId, netPoints, `Bermain game: ${gameData.name} - ${prizeLabel}`]
                );
            }
            
            await queryWithConn(
                'UPDATE UserGamification SET points = points - ? + ? WHERE user_id = ?',
                [costPoints, rewardValue, userId]
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
                selectedIndex,
                prizeLabel,
                rewardValue,
                rewardType,
                gamePlay: gamePlay[0],
                userGamification: updatedUser[0],
                pointsSpent: costPoints,
                pointsWon: rewardValue
            };
        });
    }
    
    static async getCooldown(userId, gameId) {
        const game = await GameRepository.findById(gameId);
        
        if (!game) {
            throw new Error('Game tidak ditemukan');
        }
        
        const configData = game.config_data ? (typeof game.config_data === 'string' ? JSON.parse(game.config_data) : game.config_data) : null;
        const cooldownSeconds = configData?.cooldownSeconds || 0;
        
        if (cooldownSeconds <= 0) {
            return { allowed: true, remainingSeconds: 0 };
        }
        
        const lastPlay = await query(
            'SELECT timestamp FROM GamePlays WHERE userId = ? AND gameId = ? ORDER BY timestamp DESC LIMIT 1',
            [userId, gameId]
        );
        
        if (!lastPlay.length) {
            return { allowed: true, remainingSeconds: 0 };
        }
        
        const lastPlayTime = new Date(lastPlay[0].timestamp);
        const now = new Date();
        const diffMs = now.getTime() - lastPlayTime.getTime();
        const diffSeconds = Math.floor(diffMs / 1000);
        
        if (diffSeconds >= cooldownSeconds) {
            return { allowed: true, remainingSeconds: 0 };
        }
        
        return {
            allowed: false,
            remainingSeconds: cooldownSeconds - diffSeconds
        };
    }
}