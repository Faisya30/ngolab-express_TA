import { query } from '../config/db.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const FALLBACK_DATA = {
  favorite_category: 'Campuran',
  peak_visit_time: 'Siang',
  ai_recommendation: 'Halo! Coba menu andalan kami yuk!',
};

function sanitizeJsonResponse(text) {
  let cleaned = String(text || '').trim();
  cleaned = cleaned.replace(/```json/gi, '');
  cleaned = cleaned.replace(/```/g, '');
  cleaned = cleaned
    .replace(/^\s*[\w\s]*\{/s, '{')
    .replace(/\}\s*[\w\s]*$/s, '}');
  cleaned = cleaned.trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Format JSON tidak ditemukan dalam respons Gemini.');
  }
  return jsonMatch[0];
}

export async function generateAiRecommendation(userId) {
  const startTime = Date.now();

  try {
    console.log('1. Fungsi AI mulai berjalan untuk user:', userId);

    const safeUserId = String(userId || '').trim();
    console.log('   [DEBUG] userId awal:', userId, '| safeUserId:', safeUserId);

    if (!safeUserId) {
      console.log('   [WARN] user_id kosong, proses dihentikan.');
      return { success: false, error: 'user_id wajib diisi.' };
    }

    console.log('2. Mulai query riwayat belanja untuk user:', safeUserId);
    const queryStart = Date.now();

    const [rawRows] = await query(
      `SELECT
        o.order_code,
        o.created_at,
        oi.product_name_snapshot AS product_name,
        oi.qty,
        oi.subtotal
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC`,
      [safeUserId]
    );

    const rows = Array.isArray(rawRows) ? rawRows : rawRows ? [rawRows] : [];

    const queryDuration = Date.now() - queryStart;
    console.log('   [DEBUG] Query selesai dalam', queryDuration, 'ms');
    console.log('2. Hasil query riwayat belanja:', rows);
    console.log('   [DEBUG] Jumlah record riwayat:', rows.length);

    if (!rows.length) {
      console.log('   [WARN] Tidak ada riwayat transaksi untuk user:', safeUserId);
      return { success: false, error: 'Tidak ada riwayat transaksi untuk user ini.' };
    }

    const transactionSummary = rows
      .map(
        (item) =>
          `- ${item.product_name} (qty: ${item.qty}) pada ${new Date(item.created_at).toLocaleString('id-ID')}`
      )
      .join('\n');

    console.log('   [DEBUG] Ringkasan transaksi yang dikirim ke Gemini:');
    console.log(transactionSummary);

    const prompt = `Kamu adalah asisten rekomendasi AI untuk sistem kiosk pintar. Berikut adalah riwayat belanja user dengan ID ${safeUserId}:\n\n${transactionSummary}\n\nBerdasarkan riwayat di atas, analisis dan berikan hasil dalam format JSON dengan 3 key:\n1. "favorite_category": Kategori F&B/Retail yang paling sering dibeli.\n2. "peak_visit_time": Waktu (pagi/siang/sore/malam) favorit bertransaksi.\n3. "ai_recommendation": 1 kalimat promosi kasual (maksimal 20 kata), menyapa user, dan merekomendasikan produk yang relevan.\n\nHanya kembalikan JSON valid tanpa penjelasan tambahan.`;

    console.log('3. Mulai memanggil Gemini API...');
    const geminiStart = Date.now();

    let aiData;
    let usedFallback = false;

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent(prompt);
      const responseText = result.response.text().trim();

      const geminiDuration = Date.now() - geminiStart;
      console.log('   [DEBUG] Gemini API selesai dalam', geminiDuration, 'ms');
      console.log('3. Respons dari Gemini (raw):', responseText);

      try {
        const jsonString = sanitizeJsonResponse(responseText);
        aiData = JSON.parse(jsonString);
        console.log('   [DEBUG] JSON berhasil di-parse:', aiData);
      } catch (parseError) {
        console.error('   [ERROR] Gagal parse respons Gemini:', parseError.message);
        console.log('   [FALLBACK] Masuk ke mode fallback parsing');
        throw new Error('Gagal memproses format respons Gemini.');
      }
    } catch (aiError) {
      usedFallback = true;
      console.error('   [FALLBACK] Gemini API gagal:', aiError.message);
      console.log('   [FALLBACK] Menggunakan data dummy sebagai pengganti.');
      aiData = { ...FALLBACK_DATA };
    }

    const favoriteCategory = String(aiData.favorite_category || 'Umum').trim();
    const peakVisitTime = String(aiData.peak_visit_time || 'siang').trim();
    const aiRecommendation = String(aiData.ai_recommendation || '').trim();

    if (usedFallback) {
      console.log('   [FALLBACK] Data yang akan di-INSERT:');
      console.log('   - favorite_category:', favoriteCategory, '(fallback)');
      console.log('   - peak_visit_time:', peakVisitTime, '(fallback)');
      console.log('   - ai_recommendation:', aiRecommendation, '(fallback)');
    } else {
      console.log('   [DEBUG] Data yang akan di-INSERT ke user_ai_insights:');
      console.log('   - user_id:', safeUserId);
      console.log('   - favorite_category:', favoriteCategory);
      console.log('   - peak_visit_time:', peakVisitTime);
      console.log('   - ai_recommendation:', aiRecommendation);
    }

    console.log('4. Mulai INSERT ke database...');
    const insertStart = Date.now();

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

    const insertDuration = Date.now() - insertStart;
    console.log('4. Status insert ke database: SUKSES');
    console.log('   [DEBUG] Insert selesai dalam', insertDuration, 'ms');

    const totalDuration = Date.now() - startTime;
    console.log('5. FUNGSI AI SELESAI - Total waktu eksekusi:', totalDuration, 'ms', '| Fallback:', usedFallback);

    return {
      success: true,
      data: {
        user_id: safeUserId,
        favorite_category: favoriteCategory,
        peak_visit_time: peakVisitTime,
        ai_recommendation: aiRecommendation,
        fallback: usedFallback,
      },
    };
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    console.error('   generateAiRecommendation ERROR:');
    console.error('   [DEBUG] Error name:', error.name);
    console.error('   [DEBUG] Error message:', error.message);
    console.error('   [DEBUG] Error stack:', error.stack);
    console.error('   [DEBUG] Total waktu sebelum error:', totalDuration, 'ms');

    return {
      success: false,
      error: error.message || 'Gagal menghasilkan rekomendasi AI.',
      data: null,
    };
  }
}