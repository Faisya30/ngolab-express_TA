import { query } from '../config/db.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function generateAiRecommendation(userId) {
  try {
    const safeUserId = String(userId || '').trim();
    if (!safeUserId) {
      return { success: false, error: 'user_id wajib diisi.' };
    }

    const [rows] = await query(
      `SELECT 
        o.order_code,
        o.created_at,
        oi.product_name_snapshot AS product_name,
        oi.qty,
        oi.subtotal
      FROM orders o
      JOIN order_items oi ON oi.order_code = o.order_code
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC`,
      [safeUserId]
    );

    if (!rows.length) {
      return { success: false, error: 'Tidak ada riwayat transaksi untuk user ini.' };
    }

    const transactionSummary = rows
      .map(
        (item) =>
          `- ${item.product_name} (qty: ${item.qty}) pada ${new Date(item.created_at).toLocaleString('id-ID')}`
      )
      .join('\n');

    const prompt = `Kamu adalah asisten rekomendasi AI untuk sistem kiosk pintar. Berikut adalah riwayat belanja user dengan ID ${safeUserId}:\n\n${transactionSummary}\n\nBerdasarkan riwayat di atas, analisis dan berikan hasil dalam format JSON dengan 3 key:\n1. "favorite_category": Kategori F&B/Retail yang paling sering dibeli.\n2. "peak_visit_time": Waktu (pagi/siang/sore/malam) favorit bertransaksi.\n3. "ai_recommendation": 1 kalimat promosi kasual (maksimal 20 kata), menyapa user, dan merekomendasikan produk yang relevan.\n\nHanya kembalikan JSON valid tanpa penjelasan tambahan.`;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();

    let aiData;
    try {
      aiData = JSON.parse(responseText);
    } catch (parseError) {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Gemini mengembalikan format yang tidak valid.');
      }
      aiData = JSON.parse(jsonMatch[0]);
    }

    const favoriteCategory = String(aiData.favorite_category || 'Umum').trim();
    const peakVisitTime = String(aiData.peak_visit_time || 'siang').trim();
    const aiRecommendation = String(aiData.ai_recommendation || '').trim();

    await query(
      `INSERT INTO user_ai_insights (user_id, favorite_category, peak_visit_time, ai_recommendation)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         favorite_category = VALUES(favorite_category),
         peak_visit_time = VALUES(peak_visit_time),
         ai_recommendation = VALUES(ai_recommendation),
         updated_at = CURRENT_TIMESTAMP`,
      [safeUserId, favoriteCategory, peakVisitTime, aiRecommendation]
    );

    return {
      success: true,
      data: {
        user_id: safeUserId,
        favorite_category: favoriteCategory,
        peak_visit_time: peakVisitTime,
        ai_recommendation: aiRecommendation,
      },
    };
  } catch (error) {
    console.error('generateAiRecommendation error:', error);
    return { success: false, error: error.message || 'Gagal menghasilkan rekomendasi AI.' };
  }
} 