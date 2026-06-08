import { query } from '../config/db.js';

export class PointsHistoryRepository {
    static async findById(id) {
        const rows = await query(
            'SELECT id, userId, points, description, createdAt FROM PointsHistory WHERE id = ? LIMIT 1',
            [id]
        );
        return rows[0] || null;
    }

    static async findByUserId(userId) {
        return await query(
            'SELECT id, userId, points, description, createdAt FROM PointsHistory WHERE userId = ? ORDER BY createdAt DESC',
            [userId]
        );
    }

    static async findAll() {
        return await query(
            'SELECT id, userId, points, description, createdAt FROM PointsHistory ORDER BY createdAt DESC'
        );
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