import { query, withTransaction } from '../config/db.js';
import { generateAiRecommendation } from '../services/geminiService.js';

const tableColumnsCache = new Map();

async function getTableColumns(tableName) {
	if (tableColumnsCache.has(tableName)) return tableColumnsCache.get(tableName);
	const rows = await query(`SHOW COLUMNS FROM ${tableName}`);
	const cols = new Set(rows.map((row) => String(row.Field)));
	tableColumnsCache.set(tableName, cols);
	return cols;
}

async function hasColumn(tableName, columnName) {
	const cols = await getTableColumns(tableName);
	return cols.has(columnName);
}

function toNumber(value) {
	if (value === undefined || value === null || value === '') return 0;
	if (typeof value === 'number') return value;
	const cleaned = String(value).replace(/[^0-9.-]/g, '');
	return Number(cleaned) || 0;
}





function parseCart(rawCartData) {
	if (Array.isArray(rawCartData)) return rawCartData;
	if (typeof rawCartData === 'string') {
		try {
			const parsed = JSON.parse(rawCartData);
			return Array.isArray(parsed) ? parsed : [];
		} catch {
			return [];
		}
	}
	return [];
}

function buildOrderCode(rawOrderId) {
	const input = String(rawOrderId || '').trim();
	if (!input) return `ORD-${Date.now()}`;
	return input.startsWith('ORD-') ? input : `ORD-${input}`;
}

async function allocateKioskQueueNumber(connection) {
	await connection.query(
		`CREATE TABLE IF NOT EXISTS kiosk_queue_counters (
			counter_date DATE NOT NULL PRIMARY KEY,
			last_queue_number INT NOT NULL DEFAULT 0,
			updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
		)`
	);

	await connection.query(
		`INSERT INTO kiosk_queue_counters (counter_date, last_queue_number)
		VALUES (CURRENT_DATE(), 0)
		ON DUPLICATE KEY UPDATE counter_date = counter_date`
	);

	const [rows] = await connection.query(
		`SELECT last_queue_number
		FROM kiosk_queue_counters
		WHERE counter_date = CURRENT_DATE()
		FOR UPDATE`
	);

	const currentNumber = Number(rows?.[0]?.last_queue_number || 0);
	const nextNumber = currentNumber + 1;

	await connection.query(
		`UPDATE kiosk_queue_counters
		SET last_queue_number = ?
		WHERE counter_date = CURRENT_DATE()`,
		[nextNumber]
	);

	return nextNumber;
}

export async function init(req, res) {
	try {
		const usesCategoryCode = await hasColumn('products', 'category_code');
		const hasProductType = await hasColumn('products', 'product_type');

		let productsQuery;
		if (usesCategoryCode) {
			productsQuery = `SELECT
						p.code AS id,
						p.code,
						p.name,
						p.price,
						COALESCE(p.category_code, '') AS category,
						COALESCE(CAST(p.image_url AS CHAR(255)), '') AS image,
						COALESCE(p.description, '') AS description,
						p.is_recommended AS isRecommended,
						p.cashback_reward AS cashbackReward,
						p.is_active AS isActive
					FROM products p
					WHERE p.is_active = 1 ${hasProductType ? "AND (p.product_type = 'kiosk' OR p.product_type IS NULL OR p.product_type = '')" : ''}
					ORDER BY p.created_at DESC`;
		} else {
			productsQuery = `SELECT
						p.code AS id,
						p.code,
						p.name,
						p.price,
						COALESCE(c.code, '') AS category,
						COALESCE(CAST(p.image_url AS CHAR(255)), '') AS image,
						COALESCE(p.description, '') AS description,
						p.is_recommended AS isRecommended,
						p.cashback_reward AS cashbackReward,
						p.is_active AS isActive
					FROM products p
					LEFT JOIN categories c ON p.category_id = c.id
					WHERE p.is_active = 1 ${hasProductType ? "AND (p.product_type = 'kiosk' OR p.product_type IS NULL)" : ''}
					ORDER BY p.created_at DESC`;
		}

		const products = await query(productsQuery);

		let categoriesQuery = `SELECT
				code AS id,
				name,
				is_active AS isActive
			FROM categories
			WHERE is_active = 1`;

		if (hasProductType) {
			categoriesQuery += ` AND product_type = 'kiosk'`;
		}

		categoriesQuery += ` ORDER BY created_at ASC`;

		const categories = await query(categoriesQuery);

		return res.json({ success: true, products, categories, vouchers: [] });
	} catch (error) {
		return res.status(500).json({ success: false, error: error.message });
	}
}

export async function getKioskProducts(req, res) {
	try {
		const usesCategoryCode = await hasColumn('products', 'category_code');
		const hasProductType = await hasColumn('products', 'product_type');

		if (!hasProductType) {
			return res.status(500).json({
				success: false,
				error: 'Kolom product_type belum tersedia.',
			});
		}

		const productsQuery = usesCategoryCode
			? `SELECT
          p.code AS id,
          p.code,
          p.name,
          p.price,
          COALESCE(p.category_code, '') AS category,
          COALESCE(CAST(p.image_url AS CHAR(255)), '') AS image,
          COALESCE(p.description, '') AS description,
          p.product_type,
          p.is_recommended AS isRecommended,
          p.cashback_reward AS cashbackReward,
          p.is_active AS isActive
        FROM products p
        WHERE p.product_type = 'kiosk'
          AND p.is_active = 1
        ORDER BY p.created_at DESC`
			: `SELECT
          p.code AS id,
          p.code,
          p.name,
          p.price,
          COALESCE(c.code, '') AS category,
          COALESCE(CAST(p.image_url AS CHAR(255)), '') AS image,
          COALESCE(p.description, '') AS description,
          p.product_type,
          p.is_recommended AS isRecommended,
          p.cashback_reward AS cashbackReward,
          p.is_active AS isActive
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.product_type = 'kiosk'
          AND p.is_active = 1
        ORDER BY p.created_at DESC`;

		const products = await query(productsQuery);

		return res.json({
			success: true,
			products,
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			error: error.message,
		});
	}
}

export async function getMember(req, res) {
	try {
		const code = String(req.params?.code || '').trim();
		if (!code) return res.status(400).json({ success: false, error: 'code wajib diisi.' });

		const rows = await query(
			`SELECT user_id, username, phone_number, membership_level, profile_picture, status
			FROM users
			WHERE user_id = ? OR username = ? OR phone_number = ?
			LIMIT 1`,
			[code, code, code]
		);

		if (!rows.length) {
			return res.status(404).json({ success: false, error: 'User tidak ditemukan.' });
		}

		const user = rows[0];

		if (user.status === 'INACTIVE' || user.status === 'SUSPENDED') {
			return res.status(403).json({ success: false, error: 'Akun member tidak aktif.' });
		}

		const pointsRows = await query(
			`SELECT total_points, cashback_points
			FROM user_points
			WHERE user_id = ?
			LIMIT 1`,
			[user.user_id]
		);

		const affiliateRows = await query(
			`SELECT total_points, commission_points, referral_code, affiliate_tier, level
			FROM affiliate_networks
			WHERE user_id = ?
			LIMIT 1`,
			[user.user_id]
		);

		return res.json({
			success: true,
			code: user.user_id,
			name: user.username,
			phone: user.phone_number || null,
			membership_level: user.membership_level || null,
			profile_picture: user.profile_picture || null,
			total_points: toNumber(affiliateRows[0]?.total_points || pointsRows?.[0]?.total_points || 0),
			cashbackPoints: toNumber(pointsRows?.[0]?.cashback_points || 0),
			commission_points: toNumber(affiliateRows[0]?.commission_points || 0),
			affiliate_tier: affiliateRows[0]?.affiliate_tier || null,
			level: affiliateRows[0]?.level || null,
			affiliate: affiliateRows.length ? 'Yes' : 'No',
		});
	} catch (error) {
		return res.status(500).json({ success: false, error: error.message });
	}
}

export async function getMemberByUserId(req, res) {
	try {
		const userId = String(req.params?.user_id || '').trim();
		if (!userId) return res.status(400).json({ success: false, error: 'user_id wajib diisi.' });

		const rows = await query(
			`SELECT user_id, username, phone_number, membership_level, profile_picture, status
			FROM users
			WHERE user_id = ?
			LIMIT 1`,
			[userId]
		);

		if (!rows.length) {
			return res.status(404).json({ success: false, error: 'Member tidak ditemukan.' });
		}

		const user = rows[0];

		if (user.status === 'INACTIVE' || user.status === 'SUSPENDED') {
			return res.status(403).json({ success: false, error: 'Akun member tidak aktif.' });
		}

		const pointsRows = await query(
			`SELECT total_points, cashback_points
			FROM user_points
			WHERE user_id = ?
			LIMIT 1`,
			[user.user_id]
		);

		const affiliateRows = await query(
			`SELECT total_points, commission_points, affiliate_tier, level
			FROM affiliate_networks
			WHERE user_id = ?
			LIMIT 1`,
			[user.user_id]
		);

		return res.json({
			success: true,
			user_id: user.user_id,
			username: user.username,
			membership_level: user.membership_level || null,
			phone_number: user.phone_number || null,
			profile_picture: user.profile_picture || null,
			total_points: toNumber(affiliateRows[0]?.total_points || pointsRows?.[0]?.total_points || 0),
			cashback_points: toNumber(pointsRows?.[0]?.cashback_points || 0),
			commission_points: toNumber(affiliateRows[0]?.commission_points || 0),
			affiliate_tier: affiliateRows[0]?.affiliate_tier || null,
			level: affiliateRows[0]?.level || null,
			affiliate: affiliateRows.length ? 'Yes' : 'No',
		});
	} catch (error) {
		return res.status(500).json({ success: false, error: error.message });
	}
}

export async function lookupMemberByQr(req, res) {
	try {
		const body = req.body || {};
		const rawCode = String(body.code || body.user_id || '').trim();

		if (!rawCode) {
			return res.status(400).json({ success: false, error: 'QR code tidak valid.' });
		}

		let userId = null;
		try {
			const trimmed = rawCode.trim();
			const firstBrace = trimmed.indexOf('{');
			const lastBrace = trimmed.lastIndexOf('}');
			if (firstBrace >= 0 && lastBrace > firstBrace) {
				const jsonStr = trimmed.slice(firstBrace, lastBrace + 1);
				const parsed = JSON.parse(jsonStr);
				userId = parsed.user_id || parsed.userId || parsed.user?.id || null;
				if (!userId && parsed.code) userId = String(parsed.code);
			}
		} catch {
			userId = null;
		}

		if (!userId) {
			userId = rawCode.length >= 3 ? rawCode : null;
		}

		if (!userId) {
			return res.status(400).json({ success: false, error: 'QR code tidak berisi user_id yang valid.' });
		}

		const userRows = await query(
			`SELECT user_id, username, phone_number, membership_level, profile_picture, status
			FROM users
			WHERE user_id = ?
			LIMIT 1`,
			[userId]
		);

		if (!userRows.length) {
			return res.status(404).json({ success: false, error: 'Member tidak ditemukan.' });
		}

		const user = userRows[0];

		if (user.status === 'INACTIVE' || user.status === 'SUSPENDED') {
			return res.status(403).json({ success: false, error: 'Akun member tidak aktif.' });
		}

		const pointsRows = await query(
			`SELECT total_points, cashback_points
			FROM user_points
			WHERE user_id = ?
			LIMIT 1`,
			[user.user_id]
		);

		const affiliateRows = await query(
			`SELECT total_points, commission_points, affiliate_tier, level
			FROM affiliate_networks
			WHERE user_id = ?
			LIMIT 1`,
			[user.user_id]
		);

		return res.json({
			success: true,
			user_id: user.user_id,
			username: user.username,
			membership_level: user.membership_level || null,
			phone_number: user.phone_number || null,
			profile_picture: user.profile_picture || null,
			total_points: toNumber(affiliateRows[0]?.total_points || pointsRows?.[0]?.total_points || 0),
			cashback_points: toNumber(pointsRows?.[0]?.cashback_points || 0),
			commission_points: toNumber(affiliateRows[0]?.commission_points || 0),
			affiliate_tier: affiliateRows[0]?.affiliate_tier || null,
			level: affiliateRows[0]?.level || null,
			affiliate: affiliateRows.length ? 'Yes' : 'No',
		});
	} catch (error) {
		return res.status(500).json({ success: false, error: error.message });
	}
}

export const getOrderHistoryByUserId = async (req, res) => {
	try {
		const { user_id } = req.params;

		const [rows] = await db.query(
			`
      SELECT 
        o.id AS order_id,
        o.order_code,
        o.service_type,
        o.tipe_pelanggan,
        o.nama_pelanggan,
        o.user_id,
        o.subtotal,
        o.discount,
        o.total,
        o.payment_method,
        o.points_earned,
        o.points_used,
        o.order_type,
        o.created_at,

        oi.id AS order_item_id,
        oi.product_id,
        oi.product_name_snapshot,
        oi.price_snapshot,
        oi.qty,
        oi.order_item_type,
        oi.subtotal AS item_subtotal
      FROM orders o
      LEFT JOIN order_items oi 
        ON o.id = oi.order_id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
      `,
			[user_id]
		);

		res.json({
			success: true,
			data: rows,
		});
	} catch (error) {
		console.error('Gagal mengambil riwayat transaksi:', error);
		res.status(500).json({
			success: false,
			message: 'Gagal mengambil riwayat transaksi',
		});
	}
};

export async function saveOrder(req, res) {
	try {
		const body = req.body || {};
		const order = body.order || {};
		const cart = parseCart(body.rawCartData ?? body.cart ?? []);

		if (!cart.length) {
			return res.status(400).json({ success: false, error: 'Cart kosong, transaksi tidak bisa disimpan.' });
		}

		const orderCode = buildOrderCode(order.orderId || order.order_code);
		const serviceType = String(order.service || order.serviceType || 'Dine In');
		const paymentMethod = String(order.payment || order.paymentMethod || 'CASH');
		const subtotal = toNumber(order.subtotal);
		const discount = toNumber(order.discount);
		const total = toNumber(order.total);
		const pointsEarned = toNumber(order.pointsEarned);
		const pointsUsed = toNumber(order.pointsUsed);
		const orderType = String(order.order_type || order.orderType || 'kiosk').toLowerCase();

		const userId = String(order.user_id || order.userId || '').trim();
		let finalTipePelanggan = 'guest';
		let finalNamaPelanggan = null;
		let resolvedMemberCode = '';

		if (userId) {
			finalTipePelanggan = 'member';
			const userRows = await query(
				`SELECT user_id, username FROM users WHERE user_id = ? LIMIT 1`,
				[userId]
			);
			if (userRows.length) {
				finalNamaPelanggan = String(userRows[0].username);
				resolvedMemberCode = String(userRows[0].user_id);
			} else {
				return res.status(404).json({ success: false, error: `Member dengan user_id ${userId} tidak ditemukan.` });
			}
		}

		const memberCode = String(order.memberCode || order.member_code || resolvedMemberCode).trim();
		const isMember = memberCode && memberCode !== '-';

		const hasTipePelanggan = await hasColumn('orders', 'tipe_pelanggan');
		const hasNamaPelanggan = await hasColumn('orders', 'nama_pelanggan');
		const hasOrderType = await hasColumn('orders', 'order_type');
		const hasQueueNumber = await hasColumn('orders', 'queue_number');
		const hasMemberCode = await hasColumn('orders', 'member_code');
		const hasUserId = await hasColumn('orders', 'user_id');
		const orderItemsUsesOrderCode = await hasColumn('order_items', 'order_code');
		const orderItemsUsesProductCode = await hasColumn('order_items', 'product_code');
		const orderItemsUsesOrderId = await hasColumn('order_items', 'order_id');
		const orderItemsUsesProductId = await hasColumn('order_items', 'product_id');

		const result = await withTransaction(async (connection) => {
			const queueNumber = await allocateKioskQueueNumber(connection);
			const orderColumns = ['order_code', 'service_type', 'subtotal', 'discount', 'total', 'payment_method', 'points_earned', 'points_used'];
			const orderValues = [orderCode, serviceType, subtotal, discount, total, paymentMethod, pointsEarned, pointsUsed];

			if (hasUserId) {
				orderColumns.push('user_id');
				orderValues.push(userId || null);
			}

			if (hasMemberCode && isMember) {
				orderColumns.push('member_code');
				orderValues.push(memberCode);
			}

			if (hasQueueNumber) {
				orderColumns.push('queue_number');
				orderValues.push(queueNumber);
			}

			if (hasTipePelanggan) {
				orderColumns.push('tipe_pelanggan');
				orderValues.push(finalTipePelanggan);
			}

			if (hasNamaPelanggan) {
				orderColumns.push('nama_pelanggan');
				orderValues.push(finalNamaPelanggan);
			}

			if (hasOrderType) {
				orderColumns.push('order_type');
				orderValues.push(orderType);
			}

			const placeholders = orderColumns.map(() => '?').join(', ');
			await connection.query(
				`INSERT INTO orders (${orderColumns.join(', ')}) VALUES (${placeholders})`,
				orderValues
			);

			const [[savedOrder]] = await connection.query('SELECT id FROM orders WHERE order_code = ? LIMIT 1', [orderCode]);
			const orderId = savedOrder?.id;

			for (const item of cart) {
				const qty = toNumber(item.quantity || item.qty || 1) || 1;
				const price = toNumber(item.price);
				const itemSubtotal = toNumber(item.subtotal) || price * qty;
				const productCode = String(item.id || item.code || '').trim();
				const [productRows] = await connection.query(
					`SELECT id FROM products 
   WHERE code = ? 
     AND (product_type = 'kiosk' OR product_type IS NULL OR product_type = '')
   LIMIT 1`,
					[productCode]
				);
				const productId = productRows[0]?.id ?? null;

				if (!productId) {
					throw new Error(`Produk kiosk dengan kode ${productCode} tidak ditemukan atau bukan produk kiosk.`);
				}

				const itemColumns = ['product_name_snapshot', 'price_snapshot', 'qty', 'subtotal', 'order_item_type'];
				const itemValues = [
					String(item.name || item.productName || 'Unknown Product'),
					price,
					qty,
					itemSubtotal,
					'kiosk',
				];

				if (orderItemsUsesOrderCode) {
					itemColumns.push('order_code');
					itemValues.push(orderCode);
				} else if (orderItemsUsesOrderId) {
					itemColumns.push('order_id');
					itemValues.push(orderId);
				}

				if (orderItemsUsesProductCode) {
					itemColumns.push('product_code');
					itemValues.push(productCode);
				} else if (orderItemsUsesProductId) {
					itemColumns.push('product_id');
					itemValues.push(productId);
				}

				await connection.query(
					`INSERT INTO order_items (${itemColumns.join(', ')}) VALUES (${itemColumns.map(() => '?').join(', ')})`,
					itemValues
				);
			}

			return { orderCode, queueNumber };
		});
		if (userId) {
			try {
				(async () => {
					try {
						console.log('[AI] Menunggu transaksi commit selesai sebelum mulai AI...');
						await new Promise((resolve) => setTimeout(resolve, 500));
						console.log('[AI] Menjalankan generateAiRecommendation untuk user:', userId);
						const { generateAiRecommendation } = await import('../services/geminiService.js');
						const aiResult = await generateAiRecommendation(userId);
						console.log('[AI] Hasil generateAiRecommendation:', aiResult);
					} catch (aiError) {
						console.error('[AI] Error pada fire-and-forget AI recommendation:', aiError);
					}
				})();
			} catch (importError) {
				console.error('Gagal memuat modul AI recommendation:', importError.message);
			}
		}

		return res.json({ success: true, orderCode: result.orderCode, queueNumber: result.queueNumber });
	} catch (error) {
		return res.status(500).json({ success: false, error: error.message });
	}

}
export async function getAdminDashboard(req, res) {
  try {
    const period = String(req.query.period || 'all').toLowerCase();

    let orderDateFilter = '';
    let itemDateFilter = '';

    if (period === 'day') {
      orderDateFilter = `AND DATE(created_at) = CURDATE()`;
      itemDateFilter = `AND DATE(o.created_at) = CURDATE()`;
    }

    if (period === 'week') {
      orderDateFilter = `AND YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1)`;
      itemDateFilter = `AND YEARWEEK(o.created_at, 1) = YEARWEEK(CURDATE(), 1)`;
    }

    if (period === 'month') {
      orderDateFilter = `
        AND YEAR(created_at) = YEAR(CURDATE())
        AND MONTH(created_at) = MONTH(CURDATE())
      `;
      itemDateFilter = `
        AND YEAR(o.created_at) = YEAR(CURDATE())
        AND MONTH(o.created_at) = MONTH(CURDATE())
      `;
    }

    const orders = await query(`
      SELECT *
      FROM orders
      WHERE order_type = 'kiosk'
      ${orderDateFilter}
      ORDER BY created_at DESC
    `);

    const orderDetails = await query(`
      SELECT 
        oi.*,
        o.order_code,
        o.created_at,
        o.payment_method
      FROM order_items oi
      LEFT JOIN orders o ON oi.order_id = o.id
      WHERE oi.order_item_type = 'kiosk'
      ${itemDateFilter}
      ORDER BY oi.id DESC
    `);

    const products = await query(`
      SELECT *
      FROM products
      WHERE product_type = 'kiosk'
      ORDER BY created_at DESC
    `);

    return res.json({
      success: true,
      period,
      orders,
      orderDetails,
      products,
    });
  } catch (error) {
    console.error('Gagal mengambil dashboard admin:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
