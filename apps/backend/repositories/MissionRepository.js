import { query } from '../config/db.js';

export class MissionRepository {
    static async findById(id) {
        try {
            const rows = await query(
                'SELECT id, title, description, rewardPoints, target, type, product_code, icon, status FROM Missions WHERE id = ? LIMIT 1',
                [id]
            );
            if (!rows[0] || rows[0].length === 0) return null;
            return this.mapToApiResponse(rows[0][0]);
        } catch (error) {
            if (this.isTableMissing(error)) return null;
            throw error;
        }
    }

    static async findAll() {
        try {
            const rows = await query(
                'SELECT id, title, description, rewardPoints, target, type, product_code, icon, status FROM Missions ORDER BY id DESC'
            );
            if (!rows[0] || !Array.isArray(rows[0])) return [];
            return rows[0].map(row => this.mapToApiResponse(row));
        } catch (error) {
            if (this.isTableMissing(error)) return [];
            throw error;
        }
    }

    static async findActive() {
        try {
            const rows = await query(
                'SELECT id, title, description, rewardPoints, target, type, product_code, icon, status FROM Missions WHERE status = ?',
                ['active']
            );
            if (!rows[0] || !Array.isArray(rows[0])) return [];
            return rows[0].map(row => this.mapToApiResponse(row));
        } catch (error) {
            if (this.isTableMissing(error)) return [];
            throw error;
        }
    }

    static mapToApiResponse(row) {
        if (!row) return null;
        return {
            id: row.id,
            title: row.title,
            description: row.description,
            missionType: row.type,
            rewardPoints: row.rewardPoints,
            target: row.target,
            productCode: row.product_code,
            status: row.status
        };
    }

    static isTableMissing(error) {
        const message = String(error?.message || '').toLowerCase();
        return message.includes("doesn't exist") || message.includes('unknown table') || message.includes('no such table');
    }

    static async create(data) {
        const { id, title, description, rewardPoints = 0, target = 1, type, productCode, icon = null, status = 'active' } = data;
        const validTypes = ['CHECKIN', 'TRANSACTION', 'PRODUCT_PURCHASE'];
        const missionType = validTypes.includes(type) ? type : 'CHECKIN';

        await query(
            `INSERT INTO Missions (id, title, description, rewardPoints, target, type, product_code, icon, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, title, description, rewardPoints, target, missionType, productCode || null, icon, status]
        );
        return await this.findById(id);
    }

    static async update(id, data) {
        const { title, description, rewardPoints, target, type, productCode, icon, status } = data;
        const fields = [];
        const values = [];

        if (title !== undefined) { fields.push('title = ?'); values.push(title); }
        if (description !== undefined) { fields.push('description = ?'); values.push(description); }
        if (rewardPoints !== undefined) { fields.push('rewardPoints = ?'); values.push(rewardPoints); }
        if (target !== undefined) { fields.push('target = ?'); values.push(target); }
        if (type !== undefined) { fields.push('type = ?'); values.push(type); }
        if (productCode !== undefined) { fields.push('product_code = ?'); values.push(productCode); }
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