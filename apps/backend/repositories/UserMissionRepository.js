import { query } from '../config/db.js';

export class UserMissionRepository {
    static async findById(id) {
        const rows = await query(
            'SELECT id, userId, missionId, status, completedAt FROM UserMissions WHERE id = ? LIMIT 1',
            [id]
        );
        return rows[0] || null;
    }

    static async findByUserId(userId) {
        return await query(
            'SELECT id, userId, missionId, status, completedAt FROM UserMissions WHERE userId = ?',
            [userId]
        );
    }

    static async findByMissionId(missionId) {
        return await query(
            'SELECT id, userId, missionId, status, completedAt FROM UserMissions WHERE missionId = ?',
            [missionId]
        );
    }

    static async findAll() {
        return await query(
            'SELECT id, userId, missionId, status, completedAt FROM UserMissions ORDER BY createdAt DESC'
        );
    }

    static async create(data) {
        const { id, userId, missionId, status = 'in_progress', completedAt = null } = data;
        await query(
            `INSERT INTO UserMissions (id, userId, missionId, status, completedAt) 
             VALUES (?, ?, ?, ?, ?)`,
            [id, userId, missionId, status, completedAt]
        );
        return await this.findById(id);
    }

    static async update(id, data) {
        const { status, completedAt } = data;
        const fields = [];
        const values = [];
        
        if (status !== undefined) { fields.push('status = ?'); values.push(status); }
        if (completedAt !== undefined) { fields.push('completedAt = ?'); values.push(completedAt); }
        
        if (fields.length === 0) return await this.findById(id);
        
        values.push(id);
        await query(
            `UPDATE UserMissions SET ${fields.join(', ')} WHERE id = ?`,
            values
        );
        return await this.findById(id);
    }

    static async complete(id) {
        await query(
            `UPDATE UserMissions SET status = ?, completedAt = NOW() WHERE id = ?`,
            ['completed', id]
        );
        return await this.findById(id);
    }
}