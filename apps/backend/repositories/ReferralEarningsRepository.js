import { query } from '../config/db.js';

export class ReferralEarningsRepository {
    static async findById(id) {
        const rows = await query(
            'SELECT id, affiliateId, nominal, timestamp FROM ReferralEarnings WHERE id = ? LIMIT 1',
            [id]
        );
        return rows[0] || null;
    }

    static async findByAffiliateId(affiliateId) {
        return await query(
            'SELECT id, affiliateId, nominal, timestamp FROM ReferralEarnings WHERE affiliateId = ? ORDER BY timestamp DESC',
            [affiliateId]
        );
    }

    static async findAll() {
        return await query(
            'SELECT id, affiliateId, nominal, timestamp FROM ReferralEarnings ORDER BY timestamp DESC'
        );
    }

    static async create(data) {
        const { id, affiliateId, nominal = 0 } = data;
        await query(
            'INSERT INTO ReferralEarnings (id, affiliateId, nominal) VALUES (?, ?, ?)',
            [id, affiliateId, nominal]
        );
        return await this.findById(id);
    }

    static async createBulk(items) {
        if (!items || items.length === 0) return true;
        const values = items.map((item) => {
            return '(?, ?, ?)';
        }).join(', ');
        const params = items.flatMap(item => [item.id, item.affiliateId, item.nominal || 0]);
        await query(
            `INSERT INTO ReferralEarnings (id, affiliateId, nominal) VALUES ${values}`,
            params
        );
        return true;
    }
}