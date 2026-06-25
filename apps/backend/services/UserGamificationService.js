import { UserGamificationRepository } from '../repositories/UserGamificationRepository.js';
import { PointsHistoryRepository } from '../repositories/PointsHistoryRepository.js';
import { withTransaction } from '../config/db.js';
import { randomUUID } from 'crypto';

function generateId() {
    return randomUUID().replace(/-/g, '');
}

export class UserGamificationService {
    static async getUserById(user_id) {
        let user = await UserGamificationRepository.findById(user_id);
        
        if (!user) {
            user = await UserGamificationRepository.create(user_id, {
                points: 0,
                memberLevel: 'Bronze',
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
            const queryWithConn = (sql, params) => connection.query(sql, params);
            
            let user = await queryWithConn(
                'SELECT user_id, points, memberLevel, streakCount, lastCheckIn FROM UserGamification WHERE user_id = ? LIMIT 1',
                [user_id]
            );
            
            if (!user[0]) {
                await queryWithConn(
                    'INSERT INTO UserGamification (user_id, points, memberLevel, streakCount, lastCheckIn) VALUES (?, 0, ?, 0, NULL)',
                    [user_id, 'Bronze']
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
            
            return updatedUser[0];
        });
    }

    static async checkin(user_id) {
        return await withTransaction(async (connection) => {
            const queryWithConn = (sql, params) => connection.query(sql, params);
            
            let user = await queryWithConn(
                'SELECT user_id, points, memberLevel, streakCount, lastCheckIn FROM UserGamification WHERE user_id = ? FOR UPDATE',
                [user_id]
            );
            
            if (!user[0]) {
                await queryWithConn(
                    'INSERT INTO UserGamification (user_id, points, memberLevel, streakCount, lastCheckIn) VALUES (?, 0, ?, 0, NULL)',
                    [user_id, 'Bronze']
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
            
            if (!lastDate || today.getTime() !== lastDate.getTime()) {
                newStreakCount += 1;
            }
            
            const historyId = generateId();
            
            await queryWithConn(
                'INSERT INTO PointsHistory (id, userId, points, description, createdAt) VALUES (?, ?, ?, ?, NOW())',
                [historyId, user_id, checkinPoints, `Check-in streak ${newStreakCount}`]
            );
            
            await queryWithConn(
                'UPDATE UserGamification SET points = points + ?, streakCount = ?, lastCheckIn = ? WHERE user_id = ?',
                [checkinPoints, newStreakCount, now, user_id]
            );
            
            const updatedUser = await queryWithConn(
                'SELECT user_id, points, memberLevel, streakCount, lastCheckIn FROM UserGamification WHERE user_id = ? LIMIT 1',
                [user_id]
            );
            
            return updatedUser[0];
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
                    [user_id, 'Bronze']
                );
            }
            
            if (points > 0) {
                const historyId = generateId();
                await queryWithConn(
                    'INSERT INTO PointsHistory (id, userId, points, description, createdAt) VALUES (?, ?, ?, ?, NOW())',
                    [historyId, user_id, points, `Sinkronisasi poin dari transaksi ${transactionCode}`]
                );
                
                await queryWithConn(
                    'UPDATE UserGamification SET points = points + ? WHERE user_id = ?',
                    [points, user_id]
                );
            }
            
            const updatedUser = await queryWithConn(
                'SELECT user_id, points FROM UserGamification WHERE user_id = ? LIMIT 1',
                [user_id]
            );
            
            return {
                user_id,
                points_earned: points,
                total_points: updatedUser[0]?.points || 0,
                transaction_code: transactionCode
            };
        });
    }
}