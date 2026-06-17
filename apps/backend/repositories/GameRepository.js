import { query } from '../config/db.js';

export class GameRepository {
    static async findById(id) {
        try {
            const rows = await query(
                'SELECT id, type, name, cost_points, reward_points, is_active, config_data FROM Games WHERE id = ? LIMIT 1',
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
                'SELECT id, type, name, cost_points, reward_points, is_active, config_data FROM Games ORDER BY id DESC'
            );
        } catch (error) {
            if (this.isTableMissing(error)) return [];
            throw error;
        }
    }

    static async findActive() {
        try {
            return await query(
                'SELECT id, type, name, cost_points, reward_points, is_active, config_data FROM Games WHERE is_active = TRUE'
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
        const { id, type, name, cost_points = 0, reward_points = 0, is_active = true, config_data = null } = data;
        await query(
            `INSERT INTO Games (id, type, name, cost_points, reward_points, is_active, config_data) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [id, type, name, cost_points, reward_points, is_active, config_data ? JSON.stringify(config_data) : null]
        );
        return await this.findById(id);
    }

    static async update(id, data) {
        const { type, name, cost_points, reward_points, is_active, config_data } = data;
        const fields = [];
        const values = [];
        
        if (type !== undefined) { fields.push('type = ?'); values.push(type); }
        if (name !== undefined) { fields.push('name = ?'); values.push(name); }
        if (cost_points !== undefined) { fields.push('cost_points = ?'); values.push(cost_points); }
        if (reward_points !== undefined) { fields.push('reward_points = ?'); values.push(reward_points); }
        if (is_active !== undefined) { fields.push('is_active = ?'); values.push(is_active); }
        if (config_data !== undefined) { fields.push('config_data = ?'); values.push(config_data ? JSON.stringify(config_data) : null); }
        
        if (fields.length === 0) return await this.findById(id);
        
        values.push(id);
        await query(
            `UPDATE Games SET ${fields.join(', ')} WHERE id = ?`,
            values
        );
        return await this.findById(id);
    }

    static async delete(id) {
        await query('DELETE FROM Games WHERE id = ?', [id]);
        return true;
    }
}