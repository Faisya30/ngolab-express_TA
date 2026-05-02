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

		const hasTipePelanggan = await hasColumn('orders', 'tipe_pelanggan');
		const hasNamaPelanggan = await hasColumn('orders', 'nama_pelanggan');
		const hasOrderType = await hasColumn('orders', 'order_type');
		const orderItemsUsesOrderId = await hasColumn('order_items', 'order_id');
		const orderItemsUsesProductId = await hasColumn('order_items', 'product_id');

		const result = await withTransaction(async (connection) => {
			const orderColumns = ['order_code', 'service_type', 'subtotal', 'discount', 'total', 'payment_method', 'points_earned', 'points_used'];
			const orderValues = [orderCode, serviceType, subtotal, discount, total, paymentMethod, pointsEarned, pointsUsed];

			if (hasTipePelanggan) {
				orderColumns.push('tipe_pelanggan');
				orderValues.push(tipePelanggan);
			}

			if (hasNamaPelanggan) {
				orderColumns.push('nama_pelanggan');
				orderValues.push(namaPelanggan);
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

				await connection.query(
					`INSERT INTO order_items (
						order_id, product_id, product_name_snapshot, price_snapshot, qty, subtotal, order_item_type
					) VALUES (?, ?, ?, ?, ?, ?, ?)` ,
					[
						orderId,
						productId,
						String(item.name || item.productName || 'Unknown Product'),
						price,
						qty,
						itemSubtotal,
						'kiosk',
					]
				);
			}

			return { orderCode };
		});

		return res.json({ success: true, orderCode: result.orderCode });
	} catch (error) {
		return res.status(500).json({ success: false, error: error.message });
	}
}
