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
        const rows = await query(
            `SELECT um.id, um.userId, um.missionId, um.status, um.completedAt,
                    m.type as missionType, m.target, m.product_code as productCode, m.rewardPoints
             FROM UserMissions um
             JOIN Missions m ON m.id = um.missionId
             WHERE um.userId = ?`,
            [userId]
        );
        if (!rows[0] || !Array.isArray(rows[0])) return [];
        return rows[0];
    }

    static async findByMissionId(missionId) {
        return await query(
            'SELECT id, userId, missionId, status, completedAt FROM UserMissions WHERE missionId = ?',
            [missionId]
        );
    }

    static async findAll() {
        return await query(
            'SELECT id, userId, missionId, status, completedAt FROM UserMissions ORDER BY id DESC'
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