import { query } from '../config/db.js';

export class PointsHistoryRepository {
    static async findById(id) {
        try {
            const rows = await query(
                'SELECT id, userId, points, description, createdAt FROM PointsHistory WHERE id = ? LIMIT 1',
                [id]
            );
            return rows[0] || null;
        } catch (error) {
            if (this.isTableMissing(error)) return null;
            throw error;
        }
    }

    static async findByUserId(userId) {
        try {
            return await query(
                'SELECT id, userId, points, description, createdAt FROM PointsHistory WHERE userId = ? ORDER BY createdAt DESC',
                [userId]
            );
        } catch (error) {
            if (this.isTableMissing(error)) return [];
            throw error;
        }
    }

    static async findAll() {
        try {
            return await query(
                'SELECT id, userId, points, description, createdAt FROM PointsHistory ORDER BY createdAt DESC'
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
        const { id, userId, points, description, createdAt = new Date() } = data;
        await query(
            `INSERT INTO PointsHistory (id, userId, points, description, createdAt) 
             VALUES (?, ?, ?, ?, ?)`,
            [id, userId, points, description, createdAt]
        );
        return await this.findById(id);
    }

    static async createBulk(items) {
        const values = [];
        const placeholders = items.map((item) => {
            values.push(item.id, item.userId, item.points, item.description, item.createdAt || new Date());
            return '(?, ?, ?, ?, ?)';
        });
        
        await query(
            `INSERT INTO PointsHistory (id, userId, points, description, createdAt) VALUES ${placeholders.join(', ')}`,
            values
        );
        return true;
    }
}