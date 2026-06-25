import { GameRepository } from '../repositories/GameRepository.js';
import { UserGamificationRepository } from '../repositories/UserGamificationRepository.js';
import { GamePlayRepository } from '../repositories/GamePlayRepository.js';
import { withTransaction } from '../config/db.js';
import { query } from '../config/db.js';
import { randomUUID } from 'crypto';

function generateId() {
    return randomUUID().replace(/-/g, '');
}

function calculateMemberLevel(points) {
    if (points >= 2000) return 'Platinum';
    if (points >= 1000) return 'Gold';
    return 'Silver';
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
            const queryWithConn = async (sql, params) => {
                const [rows] = await connection.query(sql, params);
                return rows;
            };
            
            const game = await queryWithConn(
                'SELECT id, type, name, cost_points, reward_points, is_active, config_data FROM Games WHERE id = ? AND is_active = TRUE LIMIT 1',
                [gameId]
            );
            
            if (!game || game.length === 0) {
                throw new Error('Game tidak ditemukan atau tidak aktif');
            }
            
            const gameData = game[0];
            console.log('gameData', gameData);
            const costPoints = gameData.cost_points || 0;
            console.log('cost_points', costPoints);
            const baseRewardPoints = gameData.reward_points || 0;
            console.log('reward_points', baseRewardPoints);
            
            let user = await queryWithConn(
                'SELECT user_id, points FROM UserGamification WHERE user_id = ? FOR UPDATE',
                [userId]
            );
            
            console.log('user', user[0]);
            
            if (!user || user.length === 0) {
                await queryWithConn(
                    'INSERT INTO UserGamification (user_id, points, memberLevel, streakCount, lastCheckIn) VALUES (?, 0, ?, 0, NULL)',
                    [userId, 'Silver']
                );
                user = await queryWithConn(
                    'SELECT user_id, points FROM UserGamification WHERE user_id = ? FOR UPDATE',
                    [userId]
                );
            }
            
            console.log('POINTS BEFORE', user[0].points);
            
            if (user[0].points < costPoints) {
                throw new Error(`Poin tidak cukup. Dibutuhkan ${costPoints} poin, tersedia ${user[0].points} poin`);
            }
            
            const playId = generateId();
            
            const configData = gameData.config_data ? (typeof gameData.config_data === 'string' ? JSON.parse(gameData.config_data) : gameData.config_data) : null;
            
            // Support both direct array format and {prizes: [...]} format
            let prizes = [];
            if (Array.isArray(configData)) {
                prizes = configData;
            } else if (Array.isArray(configData?.prizes)) {
                prizes = configData.prizes;
            }
            const cooldownSeconds = configData?.cooldownSeconds || 0;
            
            console.log('GAME CONFIG', JSON.stringify(configData));
            console.log('PRIZES', JSON.stringify(prizes));
            
            let prizeLabel = gameData.name;
            let rewardValue = baseRewardPoints;
            let rewardType = 'POINT';
            let selectedIndex = 0;
            
            if (prizes.length > 0) {
                const totalProbability = prizes.reduce((sum, p) => sum + (Number(p.probability) || 0), 0);
                
                if (totalProbability > 0) {
                    let random = Math.random() * totalProbability;
                    let selectedPrize = prizes[0];
                    let foundIndex = 0;
                    
                    for (let i = 0; i < prizes.length; i++) {
                        random -= Number(prizes[i].probability) || 0;
                        if (random <= 0) {
                            selectedPrize = prizes[i];
                            foundIndex = i;
                            break;
                        }
                    }
                    
                    selectedIndex = foundIndex;
                    prizeLabel = selectedPrize.label || gameData.name;
                    rewardType = (selectedPrize.type || 'POINT').toUpperCase();
                    rewardValue = rewardType === 'VOUCHER' ? 0 : Number(selectedPrize.value || baseRewardPoints);
                    console.log('VOUCHER DEBUG', {
                        rewardType,
                        prizeValue: selectedPrize.value,
                        rewardValue
                    });
                } else {
                    const randomIndex = Math.floor(Math.random() * prizes.length);
                    const randomPrize = prizes[randomIndex];
                    selectedIndex = randomIndex;
                    prizeLabel = randomPrize.label || gameData.name;
                    rewardType = (randomPrize.type || 'POINT').toUpperCase();
                    rewardValue = rewardType === 'VOUCHER' ? 0 : Number(randomPrize.value || baseRewardPoints);
                    console.log('VOUCHER DEBUG', {
                        rewardType,
                        prizeValue: randomPrize.value,
                        rewardValue
                    });
                }
                
                console.log('SPIN DEBUG', {
                    selectedIndex,
                    selectedPrize: {
                        label: prizeLabel,
                        value: rewardValue,
                        type: rewardType
                    },
                    rewardValue,
                    rewardType,
                    prizeLabel
                });
            } else {
                selectedIndex = 0;
                prizeLabel = gameData.name;
                rewardValue = baseRewardPoints;
                rewardType = 'POINT';
            }
            
            console.log('REWARD VALUE', rewardValue);
            
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
            
            console.log('POINTS AFTER', updatedUser[0].points);
            
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