import { query } from '../config/db.js';

export class UserGamificationRepository {
    static async findById(user_id) {
        const rows = await query(
            'SELECT user_id, points, memberLevel, streakCount, lastCheckIn FROM UserGamification WHERE user_id = ? LIMIT 1',
            [user_id]
        );
        return rows[0] || null;
    }

    static async findAll() {
        return await query(
            'SELECT user_id, points, memberLevel, streakCount, lastCheckIn FROM UserGamification ORDER BY points DESC'
        );
    }

    static async create(user_id, data = {}) {
        const { points = 0, memberLevel = 'Bronze', streakCount = 0, lastCheckIn = null } = data;
        await query(
            `INSERT INTO UserGamification (user_id, points, memberLevel, streakCount, lastCheckIn) 
             VALUES (?, ?, ?, ?, ?)`,
            [user_id, points, memberLevel, streakCount, lastCheckIn]
        );
        return await this.findById(user_id);
    }

    static async update(user_id, data) {
        const { points, memberLevel, streakCount, lastCheckIn } = data;
        const fields = [];
        const values = [];
        
        if (points !== undefined) { fields.push('points = ?'); values.push(points); }
        if (memberLevel !== undefined) { fields.push('memberLevel = ?'); values.push(memberLevel); }
        if (streakCount !== undefined) { fields.push('streakCount = ?'); values.push(streakCount); }
        if (lastCheckIn !== undefined) { fields.push('lastCheckIn = ?'); values.push(lastCheckIn); }
        
        if (fields.length === 0) return await this.findById(user_id);
        
        values.push(user_id);
        await query(
            `UPDATE UserGamification SET ${fields.join(', ')} WHERE user_id = ?`,
            values
        );
        return await this.findById(user_id);
    }

    static async addPoints(user_id, pointsToAdd) {
        await query(
            'UPDATE UserGamification SET points = points + ? WHERE user_id = ?',
            [pointsToAdd, user_id]
        );
        return await this.findById(user_id);
    }

    static async ensureUserExists(user_id) {
        const existing = await this.findById(user_id);
        if (!existing) {
            await query(
                'INSERT INTO UserGamification (user_id, points, memberLevel, streakCount, lastCheckIn) VALUES (?, 0, ?, 0, NULL)',
                [user_id, 'Bronze']
            );
        }
    }
}