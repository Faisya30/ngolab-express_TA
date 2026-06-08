import { query } from '../config/db.js';

export class GamePlayRepository {
    static async findById(id) {
        const rows = await query(
            'SELECT id, userId, gameId, gameType, costPoints, rewardPoints, prizeLabel, timestamp FROM GamePlays WHERE id = ? LIMIT 1',
            [id]
        );
        return rows[0] || null;
    }

    static async findByUserId(userId) {
        return await query(
            'SELECT id, userId, gameId, gameType, costPoints, rewardPoints, prizeLabel, timestamp FROM GamePlays WHERE userId = ? ORDER BY timestamp DESC',
            [userId]
        );
    }

    static async findAll() {
        return await query(
            'SELECT id, userId, gameId, gameType, costPoints, rewardPoints, prizeLabel, timestamp FROM GamePlays ORDER BY timestamp DESC'
        );
    }

    static async create(data) {
        const { id, userId, gameId, gameType, costPoints = 0, rewardPoints = 0, prizeLabel = null, timestamp = new Date() } = data;
        await query(
            `INSERT INTO GamePlays (id, userId, gameId, gameType, costPoints, rewardPoints, prizeLabel, timestamp) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, userId, gameId, gameType, costPoints, rewardPoints, prizeLabel, timestamp]
        );
        return await this.findById(id);
    }
}