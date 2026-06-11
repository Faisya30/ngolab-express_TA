import { query } from '../config/db.js';

export async function getAiRecommendation(req, res) {
  try {
    const userId = String(req.params?.user_id || '').trim();
    if (!userId) {
      return res.status(400).json({ message: 'user_id wajib diisi.' });
    }

    const [rows] = await query(
      `SELECT user_id, favorite_category, peak_visit_time, ai_recommendation, created_at, updated_at
       FROM user_ai_insights
       WHERE user_id = ?
       LIMIT 1`,
      [userId]
    );

    const insight = Array.isArray(rows) ? rows[0] : rows;

    if (!insight) {
      return res.status(404).json({ message: 'Data belum tersedia' });
    }

    return res.json({
      message: 'Data berhasil diambil',
      data: insight,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}
