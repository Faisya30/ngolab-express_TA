import { UserGamificationRepository } from '../repositories/UserGamificationRepository.js';
import { PointsHistoryRepository } from '../repositories/PointsHistoryRepository.js';
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

async function syncMemberLevelFromUserPoints(connection, userId) {
    const [rows] = await connection.query(
        `SELECT total_points FROM user_points WHERE user_id = ? LIMIT 1`,
        [userId]
    );
    const totalPoints = Number(rows?.[0]?.total_points || 0);
    const level = calculateMemberLevel(totalPoints);

    await connection.query(
        `UPDATE users SET membership_level = ? WHERE user_id = ?`,
        [level, userId]
    );

    await connection.query(
        `UPDATE UserGamification SET memberLevel = ? WHERE user_id = ?`,
        [level, userId]
    );
}

export class UserGamificationService {
    static async getUserById(user_id) {
        let user = await UserGamificationRepository.findById(user_id);
        
        if (!user) {
            user = await UserGamificationRepository.create(user_id, {
                points: 0,
                memberLevel: 'Silver',
                streakCount: 0,
                lastCheckIn: null
            });
        }
        
        return user;
    }

    static async getAllUsers() {
        return await UserGamificationRepository.findAll();
    }

    static async updateUser(user_id, data) {
        const existing = await UserGamificationRepository.findById(user_id);
        
        if (!existing) {
            return await UserGamificationRepository.create(user_id, data);
        }
        
        return await UserGamificationRepository.update(user_id, data);
    }

    static async addPoints(user_id, points, description, category = 'mission') {
        return await withTransaction(async (connection) => {
            const queryWithConn = async (sql, params) => {
                const [rows] = await connection.query(sql, params);
                return rows;
            };
            
            let user = await queryWithConn(
                'SELECT user_id, points, memberLevel, streakCount, lastCheckIn FROM UserGamification WHERE user_id = ? LIMIT 1',
                [user_id]
            );
            
            if (!user[0]) {
                await queryWithConn(
                    'INSERT INTO UserGamification (user_id, points, memberLevel, streakCount, lastCheckIn) VALUES (?, 0, ?, 0, NULL)',
                    [user_id, 'Silver']
                );
            }
            
            const historyId = generateId();
            await queryWithConn(
                'INSERT INTO PointsHistory (id, userId, points, description, createdAt) VALUES (?, ?, ?, ?, NOW())',
                [historyId, user_id, points, description]
            );

            const [pointRows] = await connection.query(
                `SELECT user_id, total_points, poin_gamification, cashback_points, commission_points
                 FROM user_points
                 WHERE user_id = ?`,
                [user_id]
            );

            if (!pointRows || pointRows.length === 0) {
                let existingGamificationPoints = 0;
                try {
                    const userGamificationRows = await connection.query(
                        `SELECT points FROM UserGamification WHERE user_id = ? LIMIT 1`,
                        [user_id]
                    );
                    existingGamificationPoints = Number(userGamificationRows[0]?.points || 0);
                } catch {
                    existingGamificationPoints = 0;
                }

                await connection.query(
                    `INSERT INTO user_points (user_id, total_points, poin_gamification, cashback_points, commission_points)
                     VALUES (?, ?, ?, 0, 0)`,
                    [user_id, existingGamificationPoints, existingGamificationPoints]
                );
            }

            const current = pointRows[0] || {};
            const currentGamification = Number(current.poin_gamification || 0);
            const currentCashback = Number(current.cashback_points || 0);
            const currentCommission = Number(current.commission_points || 0);

            let nextGamification = currentGamification;
            let nextCashback = currentCashback;
            let nextCommission = currentCommission;

            if (category === 'mission') {
                nextGamification = currentGamification + points;
            } else if (category === 'voucher') {
                nextGamification = currentGamification + points;
            } else if (category === 'cashback') {
                nextCashback = currentCashback + points;
            } else if (category === 'commission') {
                nextCommission = currentCommission + points;
            }

            const nextTotal = nextGamification + nextCashback + nextCommission;

            await connection.query(
                `UPDATE user_points
                 SET total_points = ?,
                     poin_gamification = ?,
                     cashback_points = ?,
                     commission_points = ?
                 WHERE user_id = ?`,
                [nextTotal, nextGamification, nextCashback, nextCommission, user_id]
            );

            await connection.query(
                `UPDATE users SET membership_level = ? WHERE user_id = ?`,
                [calculateMemberLevel(nextTotal), user_id]
            );

            await connection.query(
                `UPDATE UserGamification SET memberLevel = ? WHERE user_id = ?`,
                [calculateMemberLevel(nextTotal), user_id]
            );
            
            await queryWithConn(
                'UPDATE UserGamification SET points = points + ? WHERE user_id = ?',
                [points, user_id]
            );
            
            const updatedUser = await queryWithConn(
                'SELECT user_id, points, memberLevel, streakCount, lastCheckIn FROM UserGamification WHERE user_id = ? LIMIT 1',
                [user_id]
            );
            
            return { ...updatedUser[0], memberLevel: calculateMemberLevel(nextTotal) };
        });
    }

    static async checkin(user_id) {
        return await withTransaction(async (connection) => {
            const queryWithConn = async (sql, params) => {
                const [rows] = await connection.query(sql, params);
                return rows;
            };
            
            let user = await queryWithConn(
                'SELECT user_id, points, memberLevel, streakCount, lastCheckIn FROM UserGamification WHERE user_id = ? FOR UPDATE',
                [user_id]
            );
            
            if (!user[0]) {
                await queryWithConn(
                    'INSERT INTO UserGamification (user_id, points, memberLevel, streakCount, lastCheckIn) VALUES (?, 0, ?, 0, NULL)',
                    [user_id, 'Silver']
                );
                user = await queryWithConn(
                    'SELECT user_id, points, memberLevel, streakCount, lastCheckIn FROM UserGamification WHERE user_id = ? FOR UPDATE',
                    [user_id]
                );
            }
            
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const lastCheckIn = user[0].lastCheckIn ? new Date(user[0].lastCheckIn) : null;
            const lastDate = lastCheckIn ? new Date(lastCheckIn.getFullYear(), lastCheckIn.getMonth(), lastCheckIn.getDate()) : null;

            const MAX_STREAK_DAYS = 7;
            const POINTS_PER_STREAK = 5;

            let currentStreak = user[0].streakCount || 0;
            let newStreakCount = currentStreak;
            let checkinPoints = 0;

            if (lastDate && today.getTime() === lastDate.getTime()) {
                return { ...user[0], points: user[0].points, streakCount: currentStreak, checkinPoints: 0 };
            }

            if (!lastDate) {
                newStreakCount = 1;
            } else {
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                if (lastDate.getTime() === yesterday.getTime()) {
                    newStreakCount = Math.min(currentStreak + 1, MAX_STREAK_DAYS);
                } else {
                    newStreakCount = 1;
                }
            }

            checkinPoints = newStreakCount * POINTS_PER_STREAK;

            console.log('================ DAILY STREAK DEBUG ==================');
            console.log('user_id:', user_id);
            console.log('lastCheckIn dari database:', user[0].lastCheckIn);
            console.log('lastDate:', lastDate);
            console.log('today:', today);
            console.log('currentStreak (before):', currentStreak);
            console.log('newStreakCount (after):', newStreakCount);
            console.log('checkinPoints calculated:', checkinPoints);

            const historyId = generateId();

            await queryWithConn(
                'INSERT INTO PointsHistory (id, userId, points, description, createdAt) VALUES (?, ?, ?, ?, NOW())',
                [historyId, user_id, checkinPoints, `Check-in streak ${newStreakCount}`]
            );

            console.log('Query UPDATE yang akan dijalankan beserta parameter:');
            console.log('- points:', checkinPoints);
            console.log('- streakCount:', newStreakCount);
            console.log('- lastCheckIn:', now);
            console.log('- user_id:', user_id);

            await queryWithConn(
                'UPDATE UserGamification SET points = points + ?, streakCount = ?, lastCheckIn = ? WHERE user_id = ?',
                [checkinPoints, newStreakCount, now, user_id]
            );

            const [pointRows] = await connection.query(
                `SELECT user_id, total_points, poin_gamification, cashback_points, commission_points
                 FROM user_points
                 WHERE user_id = ?`,
                [user_id]
            );

            if (!pointRows || pointRows.length === 0) {
                let existingGamificationPoints = 0;
                try {
                    const userGamificationRows = await connection.query(
                        `SELECT points FROM UserGamification WHERE user_id = ? LIMIT 1`,
                        [user_id]
                    );
                    existingGamificationPoints = Number(userGamificationRows[0]?.points || 0);
                } catch {
                    existingGamificationPoints = 0;
                }

                await connection.query(
                    `INSERT INTO user_points (user_id, total_points, poin_gamification, cashback_points, commission_points)
                     VALUES (?, ?, ?, 0, 0)`,
                    [user_id, existingGamificationPoints, existingGamificationPoints]
                );
            }

            const current = pointRows[0] || {};
            const currentGamification = Number(current.poin_gamification || 0);
            const currentCashback = Number(current.cashback_points || 0);
            const currentCommission = Number(current.commission_points || 0);

            const nextGamification = currentGamification + checkinPoints;
            const nextCashback = currentCashback;
            const nextCommission = currentCommission;
            const nextTotal = nextGamification + nextCashback + nextCommission;

            await connection.query(
                `UPDATE user_points
                 SET total_points = ?,
                     poin_gamification = ?,
                     cashback_points = ?,
                     commission_points = ?
                 WHERE user_id = ?`,
                [nextTotal, nextGamification, nextCashback, nextCommission, user_id]
            );

            await connection.query(
                `UPDATE users SET membership_level = ? WHERE user_id = ?`,
                [calculateMemberLevel(nextTotal), user_id]
            );

            await connection.query(
                `UPDATE UserGamification SET memberLevel = ? WHERE user_id = ?`,
                [calculateMemberLevel(nextTotal), user_id]
            );

            const updatedUser = await queryWithConn(
                'SELECT user_id, points, memberLevel, streakCount, lastCheckIn FROM UserGamification WHERE user_id = ? LIMIT 1',
                [user_id]
            );

            console.log('updated streakCount:', updatedUser[0].streakCount);
            console.log('updated lastCheckIn:', updatedUser[0].lastCheckIn);
            console.log('====================================================');
            
            return { ...updatedUser[0], memberLevel: calculateMemberLevel(nextTotal) };
        });
    }

    static async syncTransactionPoints(transactionCode) {
        return await withTransaction(async (connection) => {
            const queryWithConn = async (sql, params) => {
                const [rows] = await connection.query(sql, params);
                return rows;
            };
            
            const rows = await queryWithConn(
                `SELECT user_id, points_earned 
                 FROM transactions_backup 
                 WHERE transaction_code = ? 
                 LIMIT 1`,
                [transactionCode]
            );
            
            if (!rows || !rows[0]) {
                throw new Error('Transaksi tidak ditemukan di transactions_backup');
            }
            
            const { user_id, points_earned } = rows[0];
            
            if (!user_id) {
                throw new Error('user_id tidak ditemukan pada transaksi');
            }
            
            const points = Number(points_earned || 0);
            
            const checkHistory = await queryWithConn(
                `SELECT id FROM PointsHistory 
                 WHERE userId = ? AND description LIKE ? 
                 LIMIT 1`,
                [user_id, `%${transactionCode}`]
            );
            
            if (checkHistory && checkHistory[0]) {
                throw new Error('Poin untuk transaksi ini sudah disinkronkan');
            }
            
            let user = await queryWithConn(
                'SELECT user_id, points FROM UserGamification WHERE user_id = ? FOR UPDATE',
                [user_id]
            );
            
            if (!user || !user[0]) {
                await queryWithConn(
                    'INSERT INTO UserGamification (user_id, points, memberLevel, streakCount, lastCheckIn) VALUES (?, 0, ?, 0, NULL)',
                    [user_id, 'Silver']
                );
                user = await queryWithConn(
                    'SELECT user_id, points, memberLevel FROM UserGamification WHERE user_id = ? LIMIT 1',
                    [user_id]
                );
            }

            const currentPoints = Number(user[0]?.points || 0);
            const newTotalPoints = currentPoints + points;

            if (points > 0) {
                const historyId = generateId();
                await queryWithConn(
                    'INSERT INTO PointsHistory (id, userId, points, description, createdAt) VALUES (?, ?, ?, ?, NOW())',
                    [historyId, user_id, points, `Sinkronisasi poin dari transaksi ${transactionCode}`]
                );
                
                const [pointRows] = await connection.query(
                    `SELECT user_id, total_points, poin_gamification, cashback_points, commission_points
                     FROM user_points
                     WHERE user_id = ?`,
                    [user_id]
                );

                if (!pointRows || pointRows.length === 0) {
                    await connection.query(
                        `INSERT INTO user_points (user_id, total_points, poin_gamification, cashback_points, commission_points)
                         VALUES (?, ?, ?, 0, 0)`,
                        [user_id, newTotalPoints, newTotalPoints]
                    );
                }

                const current = pointRows[0] || {};
                const currentGamification = Number(current.poin_gamification || 0);
                const currentCashback = Number(current.cashback_points || 0);
                const currentCommission = Number(current.commission_points || 0);

                const nextGamification = currentGamification;
                const nextCashback = currentCashback + points;
                const nextCommission = currentCommission;
                const nextTotal = nextGamification + nextCashback + nextCommission;

                await connection.query(
                    `UPDATE user_points
                     SET total_points = ?,
                         poin_gamification = ?,
                         cashback_points = ?,
                         commission_points = ?
                     WHERE user_id = ?`,
                    [nextTotal, nextGamification, nextCashback, nextCommission, user_id]
                );

                await connection.query(
                    `UPDATE users SET membership_level = ? WHERE user_id = ?`,
                    [calculateMemberLevel(nextTotal), user_id]
                );

                await connection.query(
                    `UPDATE UserGamification SET memberLevel = ? WHERE user_id = ?`,
                    [calculateMemberLevel(nextTotal), user_id]
                );

                await queryWithConn(
                    'UPDATE UserGamification SET points = ? WHERE user_id = ?',
                    [nextTotal, user_id]
                );
            }
            
            const updatedUser = await queryWithConn(
                'SELECT user_id, points, memberLevel FROM UserGamification WHERE user_id = ? LIMIT 1',
                [user_id]
            );
            
            return {
                user_id,
                points_earned: points,
                total_points: updatedUser[0]?.points || 0,
                transaction_code: transactionCode,
                memberLevel: updatedUser[0]?.memberLevel || 'Silver'
            };
        });
    }
}
