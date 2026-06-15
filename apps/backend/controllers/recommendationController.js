import { query } from '../config/db.js';
import { generateAiRecommendation } from '../services/geminiService.js';

const FALLBACK_INSIGHT = {
  favorite_category: 'Campuran',
  peak_visit_time: 'Siang',
  ai_recommendation: 'Belum cukup data transaksi untuk membuat rekomendasi personal.',
};

export async function getAiRecommendation(req, res) {
  try {
    const userId = String(req.params?.user_id || req.params?.userId || '').trim();
    console.log('========================================');
    console.log('[AI INSIGHT] userId:', userId);
    
    if (!userId) {
      return res.status(400).json({ message: 'user_id wajib diisi.' });
    }

    const queryStart = Date.now();
    const transactions = await query(
      `SELECT
        o.id AS order_id,
        o.user_id,
        o.order_code,
        o.total,
        o.created_at,
        oi.product_name_snapshot,
        oi.qty,
        oi.subtotal AS item_subtotal
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC`,
      [userId]
    );

    console.log('[AI INSIGHT] Query selesai dalam', Date.now() - queryStart, 'ms');
    console.log('[AI INSIGHT] Jumlah transaksi ditemukan:', transactions.length);
    console.log('[AI INSIGHT] Payload transaksi:', JSON.stringify(transactions, null, 2));

    if (!transactions.length) {
      console.log('[AI INSIGHT] Tidak ada transaksi, menggunakan fallback data');
      console.log('[AI INSIGHT] Data fallback yang akan disimpan:', FALLBACK_INSIGHT);
      
      await query(
        `INSERT INTO user_ai_insights (user_id, favorite_category, peak_visit_time, ai_recommendation)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           favorite_category = VALUES(favorite_category),
           peak_visit_time = VALUES(peak_visit_time),
           ai_recommendation = VALUES(ai_recommendation),
           updated_at = CURRENT_TIMESTAMP`,
        [
          userId,
          FALLBACK_INSIGHT.favorite_category,
          FALLBACK_INSIGHT.peak_visit_time,
          FALLBACK_INSIGHT.ai_recommendation,
        ]
      );

      return res.json({
        message: 'Data insight berhasil diambil',
        data: {
          user_id: userId,
          ...FALLBACK_INSIGHT,
          fallback: true,
        },
      });
    }

    console.log('[AI INSIGHT] Transaksi ditemukan:', transactions.length);
    console.log('[AI INSIGHT] Memanggil Gemini untuk generate insight...');

    const transactionSummary = transactions
      .map((item) =>
        `- Order: ${item.order_code}, Total: Rp ${Number(item.total || 0).toLocaleString('id-ID')}, Items: ${item.product_name_snapshot || 'N/A'} (qty: ${item.qty || 0}, subtotal: Rp ${Number(item.item_subtotal || 0).toLocaleString('id-ID')}), Time: ${new Date(item.created_at).toLocaleString('id-ID')}`
      )
      .join('\n');

    const prompt = `Kamu adalah asisten rekomendasi AI untuk sistem kiosk pintar. Berikut adalah riwayat transaksi user dengan ID ${userId}:

${transactionSummary}

Berdasarkan riwayat di atas, analisis dan berikan hasil dalam format JSON dengan 3 key:
1. "favorite_category": Kategori menu/produk yang paling sering dibeli. Jika hanya ada 1 transaksi, tetap tentukan kategori berdasarkan produk yang dibeli.
2. "peak_visit_time": Waktu (Pagi/Siang/Sore/Malam) favorit bertransaksi. Tentukan berdasarkan jam transaksi yang tersedia.
3. "ai_recommendation": 1 kalimat promosi kasual (maksimal 25 kata), menyapa user, dan merekomendasikan produk yang relevan.

PENTING: Jangan menjawab "belum cukup data" jika ada minimal 1 transaksi. Untuk 1 transaksi pun, tetap berikan rekomendasi berdasarkan produk yang dibeli.

Hanya kembalikan JSON valid tanpa markdown, tanpa penjelasan tambahan.`;

    console.log('[AI INSIGHT] Prompt Gemini:', prompt);

    const geminiResult = await generateAiRecommendation(prompt);
    console.log('[AI INSIGHT] Hasil Gemini:', JSON.stringify(geminiResult, null, 2));

    let insightData;
    try {
      console.log('[AI INSIGHT] Response Gemini:', geminiResult);
      const sanitizedResponse = String(geminiResult || '')
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();
      const jsonMatch = sanitizedResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Format JSON tidak ditemukan dalam respons Gemini.');
      }
      insightData = JSON.parse(jsonMatch[0]);
      console.log('[GEMINI PARSED JSON]', insightData);
      console.log('[AI INSIGHT] JSON Gemini berhasil di-parse:', insightData);
    } catch (parseError) {
      console.error('[AI INSIGHT] Gagal parse response Gemini:', parseError.message);
      console.log('[AI INSIGHT] Gemini gagal, menggunakan fallback data');
      console.log('[AI INSIGHT] Data fallback yang akan disimpan:', FALLBACK_INSIGHT);
      
      await query(
        `INSERT INTO user_ai_insights (user_id, favorite_category, peak_visit_time, ai_recommendation)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           favorite_category = VALUES(favorite_category),
           peak_visit_time = VALUES(peak_visit_time),
           ai_recommendation = VALUES(ai_recommendation),
           updated_at = CURRENT_TIMESTAMP`,
        [
          userId,
          FALLBACK_INSIGHT.favorite_category,
          FALLBACK_INSIGHT.peak_visit_time,
          FALLBACK_INSIGHT.ai_recommendation,
        ]
      );

      return res.json({
        message: 'Data insight berhasil diambil dengan fallback',
        data: {
          user_id: userId,
          ...FALLBACK_INSIGHT,
          fallback: true,
        },
      });
    }

    console.log('[AI INSIGHT] Data yang disimpan ke user_ai_insights:', insightData);

    return res.json({
      message: 'Data insight berhasil diambil',
      data: {
        user_id: userId,
        ...insightData,
      },
    });
  } catch (error) {
    console.error('[AI INSIGHT] ERROR:', error);
    return res.status(500).json({ message: error.message });
  }
}
