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

    static async addPoints(user_id, points, description) {
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
            
            await queryWithConn(
                'UPDATE UserGamification SET points = points + ? WHERE user_id = ?',
                [points, user_id]
            );
            
            const updatedUser = await queryWithConn(
                'SELECT user_id, points, memberLevel, streakCount, lastCheckIn FROM UserGamification WHERE user_id = ? LIMIT 1',
                [user_id]
            );
            
            const newMemberLevel = calculateMemberLevel(updatedUser[0].points);
            if (newMemberLevel !== updatedUser[0].memberLevel) {
                await queryWithConn(
                    'UPDATE UserGamification SET memberLevel = ? WHERE user_id = ?',
                    [newMemberLevel, user_id]
                );
            }
            
            return { ...updatedUser[0], memberLevel: newMemberLevel };
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
            
            let newStreakCount = user[0].streakCount || 0;
            const checkinPoints = 10;

            console.log('================ DAILY STREAK DEBUG ==================');
            console.log('user_id:', user_id);
            console.log('lastCheckIn dari database:', user[0].lastCheckIn);
            console.log('lastDate:', lastDate);
            console.log('today:', today);
            console.log('lastDate.getTime():', lastDate ? lastDate.getTime() : null);
            console.log('today.getTime():', today.getTime());
            console.log('existing streakCount:', user[0].streakCount || 0);
            console.log('newStreakCount sebelum increment:', newStreakCount);

            const conditionResult = !lastDate || today.getTime() !== lastDate.getTime();
            console.log('hasil evaluasi:');
            console.log('today.getTime() !== lastDate.getTime():', conditionResult);

            if (!lastDate || today.getTime() !== lastDate.getTime()) {
                newStreakCount += 1;
            }

            console.log('newStreakCount setelah increment:', newStreakCount);

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

            const updatedUser = await queryWithConn(
                'SELECT user_id, points, memberLevel, streakCount, lastCheckIn FROM UserGamification WHERE user_id = ? LIMIT 1',
                [user_id]
            );

            console.log('updated streakCount:', updatedUser[0].streakCount);
            console.log('updated lastCheckIn:', updatedUser[0].lastCheckIn);
            console.log('====================================================');
            
            const newMemberLevel = calculateMemberLevel(updatedUser[0].points);
            if (newMemberLevel !== updatedUser[0].memberLevel) {
                await queryWithConn(
                    'UPDATE UserGamification SET memberLevel = ? WHERE user_id = ?',
                    [newMemberLevel, user_id]
                );
            }

            return { ...updatedUser[0], memberLevel: newMemberLevel };
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
            const newMemberLevel = calculateMemberLevel(newTotalPoints);

            if (points > 0) {
                const historyId = generateId();
                await queryWithConn(
                    'INSERT INTO PointsHistory (id, userId, points, description, createdAt) VALUES (?, ?, ?, ?, NOW())',
                    [historyId, user_id, points, `Sinkronisasi poin dari transaksi ${transactionCode}`]
                );
                
                await queryWithConn(
                    'UPDATE UserGamification SET points = ?, memberLevel = ? WHERE user_id = ?',
                    [newTotalPoints, newMemberLevel, user_id]
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