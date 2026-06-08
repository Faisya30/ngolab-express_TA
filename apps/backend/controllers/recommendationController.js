import { query } from '../config/db.js';

export async function getAiRecommendation(req, res) {
	try {
		const userId = String(req.params?.user_id || '').trim();
		if (!userId) {
			return res.status(400).json({ success: false, error: 'user_id wajib diisi.' });
		}

		const [rows] = await query(
			`SELECT user_id, favorite_category, peak_visit_time, ai_recommendation, created_at, updated_at
			FROM user_ai_insights
			WHERE user_id = ?
			LIMIT 1`,
			[userId]
		);

		if (!rows.length) {
			return res.status(404).json({ success: false, error: 'Data insight AI belum tersedia untuk user ini.' });
		}

		return res.json({ success: true, data: rows[0] });
	} catch (error) {
		return res.status(500).json({ success: false, error: error.message });
	}
}
