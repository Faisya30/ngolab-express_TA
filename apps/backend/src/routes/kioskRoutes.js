import { Router } from 'express';
import { query, withTransaction } from '../db/mysql.js';

const router = Router();
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

async function resolveMemberByCodeOrName(connection, memberCode, memberName) {
  const code = String(memberCode || '').trim();
  const name = String(memberName || '').trim();
  if (!code || code === '-') return null;

  const [rows] = await connection.query(
    `SELECT id, code, name, is_affiliate
    FROM members
    WHERE code = ? OR LOWER(name) = LOWER(?)
    LIMIT 1`,
    [code, name]
  );
  return rows[0] || null;
}

async function resolveVoucher(connection, voucherRaw) {
  const value = String(voucherRaw || '').trim();
  if (!value || value === '-') return null;

  const [rows] = await connection.query(
    `SELECT id, code, title
    FROM vouchers
    WHERE code = ? OR LOWER(title) = LOWER(?)
    LIMIT 1`,
    [value, value]
  );
  return rows[0] || null;
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

router.get('/init', async (_req, res) => {
  try {
    const usesCategoryCode = await hasColumn('products', 'category_code');
    const products = usesCategoryCode
      ? await query(
          `SELECT
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
          WHERE p.is_active = 1
          ORDER BY p.created_at DESC`
        )
      : await query(
          `SELECT
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
          WHERE p.is_active = 1
          ORDER BY p.created_at DESC`
        );

    const categories = await query(
      `SELECT
        code AS id,
        name,
        is_active AS isActive
      FROM categories
      WHERE is_active = 1
      ORDER BY created_at ASC`
    );

    const hasVoucherActiveWindow = await hasColumn('vouchers', 'start_at');
    const vouchers = hasVoucherActiveWindow
      ? await query(
          `SELECT
            code AS id,
            title,
            COALESCE(description, '') AS description,
            discount,
            type,
            is_active AS isActive
          FROM vouchers
          WHERE is_active = 1
            AND (start_at IS NULL OR start_at <= NOW())
            AND (end_at IS NULL OR end_at >= NOW())
          ORDER BY created_at DESC`
        )
      : await query(
          `SELECT
            code AS id,
            title,
            COALESCE(description, '') AS description,
            discount,
            type,
            is_active AS isActive
          FROM vouchers
          WHERE is_active = 1
          ORDER BY created_at DESC`
        );

    return res.json({ success: true, products, categories, vouchers });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/member/:code', async (req, res) => {
  try {
    const code = String(req.params.code || '').trim();
    const rows = await query(
      `SELECT
        code,
        name,
        cashback_points AS cashbackPoints,
        cashback_points AS points,
        is_affiliate AS isAffiliate
      FROM members
      WHERE code = ?
      LIMIT 1`,
      [code]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Member not found' });
    }

    return res.json(rows[0]);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/orders', async (req, res) => {
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
    const memberCode = String(order.memberCode || '').trim();
    const memberName = String(order.member || '').trim();
    const voucherRaw = String(order.voucher || '').trim();

    const usesMemberCode = await hasColumn('orders', 'member_code');
    const usesVoucherCode = await hasColumn('orders', 'voucher_code');
    const orderItemsUsesOrderCode = await hasColumn('order_items', 'order_code');
    const orderItemsUsesProductCode = await hasColumn('order_items', 'product_code');
    const memberLogsUsesMemberCode = await hasColumn('member_logs', 'member_code');
    const memberLogsUsesOrderCode = await hasColumn('member_logs', 'order_code');

    const result = await withTransaction(async (connection) => {
      const member = usesMemberCode ? null : await resolveMemberByCodeOrName(connection, memberCode, memberName);
      const voucher = (usesVoucherCode || !voucherRaw || voucherRaw === '-') ? null : await resolveVoucher(connection, voucherRaw);

      if (usesMemberCode) {
        await connection.query(
          `INSERT INTO orders (
            order_code, service_type, subtotal, discount, total, payment_method,
            member_code, voucher_code, points_earned, points_used
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
          [
            orderCode,
            serviceType,
            subtotal,
            discount,
            total,
            paymentMethod,
            memberCode && memberCode !== '-' ? memberCode : null,
            voucherRaw && voucherRaw !== '-' ? voucherRaw : null,
            pointsEarned,
            pointsUsed,
          ]
        );
      } else {
        await connection.query(
          `INSERT INTO orders (
            order_code, service_type, subtotal, discount, total, payment_method,
            member_id, voucher_id, points_earned, points_used
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
          [
            orderCode,
            serviceType,
            subtotal,
            discount,
            total,
            paymentMethod,
            member?.id ?? null,
            voucher?.id ?? null,
            pointsEarned,
            pointsUsed,
          ]
        );
      }

      const [[savedOrder]] = await connection.query('SELECT id FROM orders WHERE order_code = ? LIMIT 1', [orderCode]);
      const orderId = savedOrder?.id;

      for (const item of cart) {
        const qty = toNumber(item.quantity || item.qty || 1) || 1;
        const price = toNumber(item.price);
        const itemSubtotal = toNumber(item.subtotal) || price * qty;
        const productCode = String(item.id || item.code || '').trim();
        let productId = null;

        if (!orderItemsUsesProductCode && productCode) {
          const [productRows] = await connection.query('SELECT id FROM products WHERE code = ? LIMIT 1', [productCode]);
          productId = productRows[0]?.id ?? null;
        }

        if (orderItemsUsesOrderCode) {
          await connection.query(
            `INSERT INTO order_items (
              order_code, product_code, product_name_snapshot, price_snapshot, qty, subtotal
            ) VALUES (?, ?, ?, ?, ?, ?)` ,
            [
              orderCode,
              orderItemsUsesProductCode ? (productCode || null) : null,
              String(item.name || item.productName || 'Unknown Product'),
              price,
              qty,
              itemSubtotal,
            ]
          );
        } else {
          await connection.query(
            `INSERT INTO order_items (
              order_id, product_id, product_name_snapshot, price_snapshot, qty, subtotal
            ) VALUES (?, ?, ?, ?, ?, ?)` ,
            [
              orderId,
              productId,
              String(item.name || item.productName || 'Unknown Product'),
              price,
              qty,
              itemSubtotal,
            ]
          );
        }
      }

      if ((pointsEarned > 0 || pointsUsed > 0) && (memberCode && memberCode !== '-')) {
        if (memberLogsUsesMemberCode) {
          await connection.query(
            `INSERT INTO member_logs (
              member_code, order_code, points_earned, points_used, note
            ) VALUES (?, ?, ?, ?, ?)` ,
            [memberCode, memberLogsUsesOrderCode ? orderCode : null, pointsEarned, pointsUsed, 'Order from kiosk']
          );
        } else {
          const member = await resolveMemberByCodeOrName(connection, memberCode, memberName);
          if (member?.id) {
            await connection.query(
              `INSERT INTO member_logs (
                member_id, order_id, points_earned, points_used, note
              ) VALUES (?, ?, ?, ?, ?)` ,
              [member.id, orderId, pointsEarned, pointsUsed, 'Order from kiosk']
            );
          }
        }
      }

      return { orderCode };
    });

    return res.json({ success: true, orderCode: result.orderCode });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
