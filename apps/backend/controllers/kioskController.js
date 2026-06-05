import { query, withTransaction } from '../config/db.js';

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
						COALESCE(p.image_url, '') AS image,
						COALESCE(p.description, '') AS description,
						p.is_recommended AS isRecommended,
						p.cashback_reward AS cashbackReward,
						p.is_active AS isActive
					FROM products p
					WHERE p.is_active = 1 ${hasProductType ? "AND (p.product_type = 'kiosk' OR p.product_type IS NULL)" : ''}
					ORDER BY p.created_at DESC`;
		} else {
			productsQuery = `SELECT
						p.code AS id,
						p.code,
						p.name,
						p.price,
						COALESCE(c.code, '') AS category,
						COALESCE(p.image_url, '') AS image,
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

export async function getMember(req, res) {
	try {
		const code = String(req.params?.code || '').trim();
		if (!code) return res.status(400).json({ success: false, error: 'code wajib diisi.' });

		const rows = await query(
			`SELECT user_id, username, phone_number, membership_level, profile_picture
			FROM users
			WHERE user_id = ? OR username = ? OR phone_number = ?
			LIMIT 1`,
			[code, code, code]
		);

		if (!rows.length) {
			return res.status(404).json({ success: false, error: 'User tidak ditemukan.' });
		}

		const user = rows[0];

		const pointsRows = await query(
			`SELECT total_points, cashback_points
			FROM user_points
			WHERE user_id = ?
			LIMIT 1`,
			[user.user_id]
		);

		const affiliateRows = await query(
			`SELECT referral_code
			FROM affiliate_networks
			WHERE user_id = ?
			LIMIT 1`,
			[user.user_id]
		);

		return res.json({
			code: user.user_id,
			name: user.username,
			phone: user.phone_number || null,
			membership_level: user.membership_level || null,
			profile_picture: user.profile_picture || null,
			points: Number(pointsRows?.[0]?.total_points || 0),
			cashbackPoints: Number(pointsRows?.[0]?.cashback_points || 0),
			affiliate: affiliateRows.length ? 'Yes' : 'No',
		});
	} catch (error) {
		return res.status(500).json({ success: false, error: error.message });
	}
}

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
		const tipePelanggan = String(order.tipe_pelanggan || order.tipePelanggan || (order.member && String(order.member).toLowerCase() !== 'guest' ? 'MEMBER' : 'GUEST')).toUpperCase();
		const namaPelanggan = String(order.nama_pelanggan || order.namaPelanggan || order.member || (tipePelanggan === 'MEMBER' ? 'Member' : 'Guest'));
		const orderType = String(order.order_type || order.orderType || 'kiosk').toLowerCase();

		const memberCode = String(order.memberCode || order.member_code || '').trim();
const isMember = memberCode && memberCode !== '-';

const finalTipePelanggan = isMember ? 'MEMBER' : tipePelanggan;
const finalNamaPelanggan = isMember
	? String(order.memberName || order.member_name || order.namaPelanggan || order.nama_pelanggan || 'Member')
	: namaPelanggan;

		const hasTipePelanggan = await hasColumn('orders', 'tipe_pelanggan');
		const hasNamaPelanggan = await hasColumn('orders', 'nama_pelanggan');
		const hasOrderType = await hasColumn('orders', 'order_type');
		const hasQueueNumber = await hasColumn('orders', 'queue_number');
		const hasMemberCode = await hasColumn('orders', 'member_code');
		const orderItemsUsesOrderCode = await hasColumn('order_items', 'order_code');
		const orderItemsUsesProductCode = await hasColumn('order_items', 'product_code');
		const orderItemsUsesOrderId = await hasColumn('order_items', 'order_id');
		const orderItemsUsesProductId = await hasColumn('order_items', 'product_id');

		const result = await withTransaction(async (connection) => {
			const queueNumber = await allocateKioskQueueNumber(connection);
			const orderColumns = ['order_code', 'service_type', 'subtotal', 'discount', 'total', 'payment_method', 'points_earned', 'points_used'];
			const orderValues = [orderCode, serviceType, subtotal, discount, total, paymentMethod, pointsEarned, pointsUsed];
			
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
				const [productRows] = await connection.query('SELECT id FROM products WHERE code = ? LIMIT 1', [productCode]);
				const productId = productRows[0]?.id ?? null;

				if (!productId) {
					throw new Error(`Produk dengan kode ${productCode} tidak ditemukan.`);
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

		return res.json({ success: true, orderCode: result.orderCode, queueNumber: result.queueNumber });
	} catch (error) {
		return res.status(500).json({ success: false, error: error.message });
	}
}
