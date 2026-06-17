import { query } from '../config/db.js';

export class MissionRepository {
    static async findById(id) {
        try {
            const rows = await query(
                'SELECT id, title, description, rewardPoints, target, type, icon, status FROM Missions WHERE id = ? LIMIT 1',
                [id]
            );
            return rows[0] || null;
        } catch (error) {
            if (this.isTableMissing(error)) return null;
            throw error;
        }
    }

    static async findAll() {
        try {
            return await query(
                'SELECT id, title, description, rewardPoints, target, type, icon, status FROM Missions ORDER BY id DESC'
            );
        } catch (error) {
            if (this.isTableMissing(error)) return [];
            throw error;
        }
    }

    static async findActive() {
        try {
            return await query(
                'SELECT id, title, description, rewardPoints, target, type, icon, status FROM Missions WHERE status = ?',
                ['active']
            );
        } catch (error) {
            if (this.isTableMissing(error)) return [];
            throw error;
        }
    }

    static isTableMissing(error) {
        const message = String(error?.message || '').toLowerCase();
        return message.includes("doesn't exist") || message.includes('unknown table') || message.includes('no such table');
    }

    static async create(data) {
        const { id, title, description, rewardPoints = 0, target = 1, type = 'daily', icon = null, status = 'active' } = data;
        await query(
            `INSERT INTO Missions (id, title, description, rewardPoints, target, type, icon, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, title, description, rewardPoints, target, type, icon, status]
        );
        return await this.findById(id);
    }

    static async update(id, data) {
        const { title, description, rewardPoints, target, type, icon, status } = data;
        const fields = [];
        const values = [];
        
        if (title !== undefined) { fields.push('title = ?'); values.push(title); }
        if (description !== undefined) { fields.push('description = ?'); values.push(description); }
        if (rewardPoints !== undefined) { fields.push('rewardPoints = ?'); values.push(rewardPoints); }
        if (target !== undefined) { fields.push('target = ?'); values.push(target); }
        if (type !== undefined) { fields.push('type = ?'); values.push(type); }
        if (icon !== undefined) { fields.push('icon = ?'); values.push(icon); }
        if (status !== undefined) { fields.push('status = ?'); values.push(status); }
        
        if (fields.length === 0) return await this.findById(id);
        
        values.push(id);
        await query(
            `UPDATE Missions SET ${fields.join(', ')} WHERE id = ?`,
            values
        );
        return await this.findById(id);
    }

    static async delete(id) {
        await query('DELETE FROM Missions WHERE id = ?', [id]);
        return true;
    }
}