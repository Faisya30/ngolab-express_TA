import { query, withTransaction } from '../config/db.js';

const tableColumnsCache = new Map();

async function getTableColumns(tableName) {
  if (tableColumnsCache.has(tableName)) {
    return tableColumnsCache.get(tableName);
  }

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
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;

  const cleaned = String(value).replace(/[^0-9.-]/g, '');
  return Number(cleaned) || 0;
}

function getCashbackReward(product = {}) {
  return toNumber(
    product.cashbackReward ??
      product.cashback_reward ??
      product.cashback ??
      product.points ??
      product.poin ??
      0
  );
}

function normalizeProductType(rawType) {
  const value = String(rawType || '').toLowerCase().trim();

  if (value === 'computervision' || value === 'cv') return 'cv';
  if (value === 'kiosk') return 'kiosk';
  if (value === 'all') return 'all';

  return 'cv';
}

function convertToBase64IfBlob(imageUrl) {
  if (!imageUrl) return null;

  if (typeof imageUrl === 'string') {
    if (imageUrl.startsWith('data:')) return imageUrl;
    if (imageUrl.startsWith('/uploads/')) return imageUrl;
    return imageUrl;
  }

  if (Buffer.isBuffer(imageUrl)) {
    const mime = 'image/jpeg';
    return `data:${mime};base64,${imageUrl.toString('base64')}`;
  }

  return String(imageUrl);
}

function parseItems(rawItems) {
  if (Array.isArray(rawItems)) return rawItems;

  if (typeof rawItems === 'string') {
    try {
      const parsed = JSON.parse(rawItems);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
}

function buildOrderCode(rawOrderCode) {
  const input = String(rawOrderCode || '').trim();

  if (!input) return `ORD-${Date.now()}`;

  return input.startsWith('ORD-') ? input : `ORD-${input}`;
}

function extractUserIdFromQr(rawCode) {
  const trimmed = String(rawCode || '').trim();

  if (!trimmed) return null;

  try {
    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');

    if (firstBrace >= 0 && lastBrace > firstBrace) {
      const jsonStr = trimmed.slice(firstBrace, lastBrace + 1);
      const parsed = JSON.parse(jsonStr);

      const value =
        parsed.user_id ||
        parsed.userId ||
        parsed.user?.id ||
        parsed.member_id ||
        parsed.memberId ||
        parsed.member_code ||
        parsed.memberCode ||
        parsed.code ||
        parsed.qr_code ||
        null;

      if (value) return String(value).trim();
    }
  } catch {
    // Bukan JSON, lanjut cek format URL/kode biasa.
  }

  try {
    const url = new URL(trimmed);

    const value =
      url.searchParams.get('user_id') ||
      url.searchParams.get('userId') ||
      url.searchParams.get('member_id') ||
      url.searchParams.get('memberId') ||
      url.searchParams.get('member_code') ||
      url.searchParams.get('memberCode') ||
      url.searchParams.get('code') ||
      url.searchParams.get('qr_code');

    if (value) return String(value).trim();
  } catch {
    // Bukan URL, berarti dianggap kode biasa.
  }

  return trimmed.length >= 1 ? trimmed : null;
}

async function resolveCvCategoryCode(rawCategory) {
  const categoryValue = String(rawCategory || '').trim();

  if (!categoryValue) return null;

  const hasCategoryType = await hasColumn('categories', 'product_type');

  if (hasCategoryType) {
    const rows = await query(
      `SELECT
        code,
        COALESCE(product_type, 'cv') AS productType
      FROM categories
      WHERE code = ? OR LOWER(name) = LOWER(?)
      LIMIT 1`,
      [categoryValue, categoryValue]
    );

    const category = rows[0];

    if (!category) return null;

    const categoryType = String(category.productType || '').toLowerCase();

    if (categoryType !== 'cv') {
      return null;
    }

    return String(category.code || '').trim() || null;
  }

  const rows = await query(
    `SELECT code
    FROM categories
    WHERE code = ? OR LOWER(name) = LOWER(?)
    LIMIT 1`,
    [categoryValue, categoryValue]
  );

  return rows[0]?.code ?? null;
}

export async function getCvProducts(req, res) {
  try {
    const hasProductType = await hasColumn('products', 'product_type');

    if (!hasProductType) {
      return res.status(500).json({
        success: false,
        error: 'Kolom product_type belum tersedia.',
      });
    }

    const hasBarcode = await hasColumn('products', 'barcode');
    const usesCategoryCode = await hasColumn('products', 'category_code');
    const requestedType = normalizeProductType(req.query.product_type);
    const activeOnly = String(req.query.is_active || '1') !== '0';

    if (usesCategoryCode) {
      const rows = await query(
        `SELECT
          p.id AS product_id,
          p.code AS id,
          p.code,
          ${hasBarcode ? "COALESCE(p.barcode, '') AS barcode," : 'NULL AS barcode,'}
          p.name,
          p.price,
          COALESCE(p.category_code, '') AS category_code,
          p.image_url,
          COALESCE(p.description, '') AS description,
          p.product_type,
          COALESCE(p.product_type, 'cv') AS productType,
          p.is_recommended AS isRecommended,
          COALESCE(p.cashback_reward, 0) AS cashbackReward,
          COALESCE(p.cashback_reward, 0) AS cashback_reward,
          p.is_active AS isActive
        FROM products p
        WHERE p.product_type = ?
          ${activeOnly ? 'AND p.is_active = 1' : ''}
        ORDER BY p.created_at DESC`,
        [requestedType]
      );

      const products = rows.map((r) => ({
        ...r,
        price: toNumber(r.price),
        cashbackReward: toNumber(r.cashbackReward),
        cashback_reward: toNumber(r.cashback_reward),
        image_url: convertToBase64IfBlob(r.image_url),
      }));

      return res.json({
        success: true,
        products,
      });
    }

    const rows = await query(
      `SELECT
        p.id AS product_id,
        p.code AS id,
        p.code,
        ${hasBarcode ? "COALESCE(p.barcode, '') AS barcode," : 'NULL AS barcode,'}
        p.name,
        p.price,
        COALESCE(c.code, '') AS category_code,
        p.image_url,
        COALESCE(p.description, '') AS description,
        p.product_type,
        COALESCE(p.product_type, 'cv') AS productType,
        p.is_recommended AS isRecommended,
        COALESCE(p.cashback_reward, 0) AS cashbackReward,
        COALESCE(p.cashback_reward, 0) AS cashback_reward,
        p.is_active AS isActive
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.product_type = ?
        ${activeOnly ? 'AND p.is_active = 1' : ''}
      ORDER BY p.created_at DESC`,
      [requestedType]
    );

    const products = rows.map((r) => ({
      ...r,
      price: toNumber(r.price),
      cashbackReward: toNumber(r.cashbackReward),
      cashback_reward: toNumber(r.cashback_reward),
      image_url: convertToBase64IfBlob(r.image_url),
    }));

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

export async function getCvCategories(_req, res) {
  try {
    const hasCategoryType = await hasColumn('categories', 'product_type');

    const rows = hasCategoryType
      ? await query(
          `SELECT
            code AS id,
            name,
            COALESCE(product_type, 'cv') AS productType,
            is_active AS isActive
          FROM categories
          WHERE is_active = 1
            AND product_type = 'cv'
          ORDER BY created_at ASC`
        )
      : await query(
          `SELECT
            code AS id,
            name,
            is_active AS isActive
          FROM categories
          WHERE is_active = 1
          ORDER BY created_at ASC`
        );

    return res.json({
      success: true,
      categories: rows,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

export async function saveCvProduct(req, res) {
  try {
    const hasProductType = await hasColumn('products', 'product_type');

    if (!hasProductType) {
      return res.status(500).json({
        success: false,
        error: 'Kolom product_type belum tersedia. Jalankan migrasi database.',
      });
    }

    const product = req.body?.product || req.body || {};

    const code = String(
      req.params.id ||
        product.id ||
        product.code ||
        product.product_code ||
        `PROD-${Date.now()}`
    ).trim();

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Kode produk wajib diisi.',
      });
    }

    const name = String(
      product.name || product.nama || product.product_name || ''
    ).trim();

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Nama produk tidak boleh kosong.',
      });
    }

    const categoryInput =
      product.category_code ||
      product.category ||
      product.category_name ||
      'retail';

    const categoryCode = await resolveCvCategoryCode(categoryInput);

    if (!categoryCode) {
      return res.status(400).json({
        success: false,
        error:
          'Kategori tidak valid atau bukan scope CV. Gunakan kategori Retail atau kategori CV lain yang diizinkan.',
      });
    }

    const usesCategoryCode = await hasColumn('products', 'category_code');
    const hasBarcode = await hasColumn('products', 'barcode');

    const isActiveValue =
      product.isActive === false || product.is_active === false ? 0 : 1;

    const barcodeValue = String(product.barcode || '').trim();
    const cashbackRewardValue = getCashbackReward(product);

    const columns = ['code', 'name'];
    const values = [code, name];
    const updates = ['name = VALUES(name)'];

    if (usesCategoryCode) {
      columns.push('category_code');
      values.push(categoryCode);
      updates.push('category_code = VALUES(category_code)');
    } else {
      const categoryIdRows = await query(
        `SELECT id FROM categories WHERE code = ? LIMIT 1`,
        [categoryCode]
      );

      const categoryId = categoryIdRows[0]?.id ?? null;

      if (!categoryId) {
        return res.status(400).json({
          success: false,
          error: 'Kategori CV tidak ditemukan di database.',
        });
      }

      columns.push('category_id');
      values.push(Number(categoryId));
      updates.push('category_id = VALUES(category_id)');
    }

    columns.push(
      'price',
      'image_url',
      'description',
      'product_type',
      'is_recommended',
      'cashback_reward',
      'is_active'
    );

    values.push(
      toNumber(product.price ?? product.harga ?? 0),
      String(product.image || product.image_url || product.foto || ''),
      String(product.description || product.deskripsi || ''),
      'cv',
      product.isRecommended || product.is_recommended ? 1 : 0,
      cashbackRewardValue,
      isActiveValue
    );

    updates.push(
      'price = VALUES(price)',
      'image_url = VALUES(image_url)',
      'description = VALUES(description)',
      'product_type = VALUES(product_type)',
      'is_recommended = VALUES(is_recommended)',
      'cashback_reward = VALUES(cashback_reward)',
      'is_active = VALUES(is_active)'
    );

    if (hasBarcode) {
      columns.splice(4, 0, 'barcode');
      values.splice(4, 0, barcodeValue || null);
      updates.push('barcode = VALUES(barcode)');
    }

    const placeholders = columns.map(() => '?').join(', ');

    const result = await query(
      `INSERT INTO products (${columns.join(', ')})
      VALUES (${placeholders})
      ON DUPLICATE KEY UPDATE ${updates.join(', ')}`,
      values
    );

    return res.json({
      success: true,
      id: code,
      cashbackReward: cashbackRewardValue,
      cashback_reward: cashbackRewardValue,
      affectedRows: result.affectedRows ?? 1,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

export async function deleteCvProduct(req, res) {
  try {
    const hasProductType = await hasColumn('products', 'product_type');

    if (!hasProductType) {
      return res.status(500).json({
        success: false,
        error: 'Kolom product_type belum tersedia. Jalankan migrasi database.',
      });
    }

    const code = String(req.params.id || '').trim();

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Kode produk wajib diisi.',
      });
    }

    const result = await query(
      'DELETE FROM products WHERE code = ? AND product_type = ?',
      [code, 'cv']
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        error: 'Produk CV tidak ditemukan.',
      });
    }

    return res.json({
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

export async function getCvProductByBarcode(req, res) {
  try {
    const hasBarcode = await hasColumn('products', 'barcode');

    if (!hasBarcode) {
      return res.status(500).json({
        success: false,
        error: 'Kolom barcode belum tersedia. Jalankan migrasi database.',
      });
    }

    const barcode = String(req.params.barcode || '').trim();

    if (!barcode) {
      return res.status(400).json({
        success: false,
        error: 'Barcode wajib diisi.',
      });
    }

    const rows = await query(
      `SELECT
        id AS product_id,
        code AS id,
        code,
        COALESCE(barcode, '') AS barcode,
        name,
        price,
        image_url,
        COALESCE(description, '') AS description,
        COALESCE(product_type, 'cv') AS productType,
        product_type,
        is_recommended AS isRecommended,
        COALESCE(cashback_reward, 0) AS cashbackReward,
        COALESCE(cashback_reward, 0) AS cashback_reward,
        is_active AS isActive
      FROM products
      WHERE barcode = ?
        AND product_type = 'cv'
        AND is_active = 1
      LIMIT 1`,
      [barcode]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        error: 'Produk CV dengan barcode tersebut tidak ditemukan.',
      });
    }

    const product = rows[0];
    product.price = toNumber(product.price);
    product.cashbackReward = toNumber(product.cashbackReward);
    product.cashback_reward = toNumber(product.cashback_reward);
    product.image_url = convertToBase64IfBlob(product.image_url);

    return res.json({
      success: true,
      product,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

export async function getCvOrders(req, res) {
  try {
    const hasOrderType = await hasColumn('orders', 'order_type');

    if (!hasOrderType) {
      return res.status(500).json({
        success: false,
        error:
          'Kolom order_type belum tersedia. Jalankan migrasi database terlebih dahulu.',
      });
    }

    const orders = await query(
      `SELECT
        id,
        order_code,
        created_at,
        service_type AS service,
        subtotal,
        discount,
        total,
        payment_method AS payment,
        COALESCE(tipe_pelanggan, 'GUEST') AS customerType,
        COALESCE(nama_pelanggan, 'Guest') AS member,
        order_type AS orderType
      FROM orders
      WHERE order_type IN ('cv', 'computervision')
      ORDER BY created_at DESC`
    );

    const orderItemsUsesOrderId = await hasColumn('order_items', 'order_id');
    const orderItemsHasProductNameSnapshot = await hasColumn(
      'order_items',
      'product_name_snapshot'
    );
    const orderItemsHasProductName = await hasColumn(
      'order_items',
      'product_name'
    );
    const orderItemsHasPriceSnapshot = await hasColumn(
      'order_items',
      'price_snapshot'
    );

    for (const o of orders) {
      const productNameCol = orderItemsHasProductNameSnapshot
        ? 'product_name_snapshot'
        : orderItemsHasProductName
          ? 'product_name'
          : "''";

      const priceCol = orderItemsHasPriceSnapshot ? 'price_snapshot' : 'price';

      const items = await query(
        orderItemsUsesOrderId
          ? `SELECT
              id,
              order_id,
              product_id,
              ${productNameCol} AS product_name_snapshot,
              ${priceCol} AS price,
              qty,
              subtotal
            FROM order_items
            WHERE order_id = ?
              AND COALESCE(order_item_type, 'computervision') IN ('cv', 'computervision')
            ORDER BY id ASC`
          : `SELECT
              id,
              order_code,
              product_code,
              ${productNameCol} AS product_name_snapshot,
              ${priceCol} AS price,
              qty,
              subtotal
            FROM order_items
            WHERE order_code = ?
            ORDER BY id ASC`,
        [orderItemsUsesOrderId ? o.id : o.order_code]
      );

      o.items = items.map((it) => ({
        id: it.id,
        product_code: it.product_code ?? it.product_id ?? null,
        product_name_snapshot: it.product_name_snapshot ?? '',
        productName: it.product_name_snapshot ?? '',
        price: it.price ?? 0,
        qty: it.qty ?? 0,
        subtotal: it.subtotal ?? 0,
      }));
    }

    return res.json({
      success: true,
      orders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

export async function getCvOrderDetails(req, res) {
  try {
    const orderItemsUsesOrderId = await hasColumn('order_items', 'order_id');
    const orderItemsHasProductNameSnapshot = await hasColumn(
      'order_items',
      'product_name_snapshot'
    );
    const orderItemsHasProductName = await hasColumn(
      'order_items',
      'product_name'
    );
    const orderItemsHasPriceSnapshot = await hasColumn(
      'order_items',
      'price_snapshot'
    );

    const productNameCol = orderItemsHasProductNameSnapshot
      ? 'product_name_snapshot'
      : orderItemsHasProductName
        ? 'product_name'
        : "''";

    const priceCol = orderItemsHasPriceSnapshot ? 'price_snapshot' : 'price';

    const rows = orderItemsUsesOrderId
      ? await query(
          `SELECT
            oi.id,
            oi.order_id,
            o.order_code AS orderId,
            ${productNameCol} AS productName,
            oi.qty,
            ${priceCol} AS price,
            oi.subtotal
          FROM order_items oi
          LEFT JOIN orders o ON oi.order_id = o.id
          WHERE o.order_type IN ('cv', 'computervision')
          ORDER BY oi.id DESC`
        )
      : await query(
          `SELECT
            id,
            order_code AS orderId,
            ${productNameCol} AS productName,
            qty,
            ${priceCol} AS price,
            subtotal
          FROM order_items
          ORDER BY id DESC`
        );

    return res.json({
      success: true,
      orderDetails: rows,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

export async function getCvMemberByCode(req, res) {
  try {
    const code = String(req.params?.code || '').trim();

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Kode member wajib diisi.',
      });
    }

    const rows = await query(
      `SELECT 
        user_id,
        username,
        phone_number,
        membership_level,
        profile_picture,
        status
      FROM users
      WHERE user_id = ?
        OR username = ?
        OR phone_number = ?
      LIMIT 1`,
      [code, code, code]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        error: 'Member tidak ditemukan.',
      });
    }

    const user = rows[0];

    if (user.status === 'INACTIVE' || user.status === 'SUSPENDED') {
      return res.status(403).json({
        success: false,
        error: 'Akun member tidak aktif.',
      });
    }

    const pointsRows = await query(
      `SELECT 
        COALESCE(total_points, 0) AS total_points,
        COALESCE(cashback_points, 0) AS cashback_points
      FROM user_points
      WHERE user_id = ?
      LIMIT 1`,
      [user.user_id]
    );

    const affiliateRows = await query(
      `SELECT 
        COALESCE(total_points, 0) AS affiliate_total_points,
        COALESCE(commission_points, 0) AS commission_points,
        affiliate_tier,
        level
      FROM affiliate_networks
      WHERE user_id = ?
      LIMIT 1`,
      [user.user_id]
    );

    const userPoint = pointsRows[0] || {};
    const affiliate = affiliateRows[0] || {};

    const totalPoints = toNumber(userPoint.total_points || 0);
    const cashbackPoints = toNumber(userPoint.cashback_points || 0);
    const commissionPoints = toNumber(affiliate.commission_points || 0);
    const affiliateTotalPoints = toNumber(affiliate.affiliate_total_points || 0);

    const member = {
      id: String(user.user_id),
      code: String(user.user_id),
      user_id: user.user_id,

      member_code: String(user.user_id),
      member_name: user.username,
      nama_member: user.username,

      name: user.username,
      username: user.username,

      phone: user.phone_number || null,
      phone_number: user.phone_number || null,

      membership_level: user.membership_level || null,
      tier: user.membership_level || 'Silver',

      profile_picture: user.profile_picture || null,

      // INI YANG DIPAKAI UNTUK TAMPIL DI HALAMAN MEMBERSHIP
      // points sengaja disamakan dengan cashback_points supaya frontend lama tetap aman.
      points: cashbackPoints,
      cashbackPoints,
      cashback_points: cashbackPoints,

      // Ini total poin dari tabel user_points.
      total_points: totalPoints,
      totalPoints,

      // Ini data affiliate, tidak dipakai untuk poin cashback.
      commission_points: commissionPoints,
      affiliate_total_points: affiliateTotalPoints,
      affiliate_tier: affiliate.affiliate_tier || null,
      level: affiliate.level || null,
      affiliate: affiliateRows.length ? 'Yes' : 'No',
    };

    return res.json({
      success: true,
      ...member,
      member,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

export async function lookupCvMemberByQr(req, res) {
  try {
    const body = req.body || {};

    const rawCode = String(
      body.code ||
        body.user_id ||
        body.userId ||
        body.member_id ||
        body.memberId ||
        body.member_code ||
        body.memberCode ||
        body.qr_code ||
        ''
    ).trim();

    if (!rawCode) {
      return res.status(400).json({
        success: false,
        error: 'QR code tidak valid.',
      });
    }

    const userId = extractUserIdFromQr(rawCode);

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'QR code tidak berisi user_id yang valid.',
      });
    }

    req.params = { code: userId };

    return getCvMemberByCode(req, res);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

export async function saveCvOrder(req, res) {
  try {
    const payload = req.body || {};
    const order = payload.order || payload;
    const items = parseItems(
      payload.items ??
        payload.order_items ??
        payload.cart ??
        payload.rawCartData ??
        []
    );

    if (!items.length) {
      return res.status(400).json({
        success: false,
        error: 'Order item kosong.',
      });
    }

    const hasOrderCode = await hasColumn('orders', 'order_code');
    const hasOrderType = await hasColumn('orders', 'order_type');
    const hasTipePelanggan = await hasColumn('orders', 'tipe_pelanggan');
    const hasNamaPelanggan = await hasColumn('orders', 'nama_pelanggan');
    const hasUserId = await hasColumn('orders', 'user_id');
    const hasMemberCode = await hasColumn('orders', 'member_code');

    const orderItemsUsesOrderId = await hasColumn('order_items', 'order_id');
    const orderItemsUsesProductId = await hasColumn('order_items', 'product_id');
    const hasOrderItemType = await hasColumn('order_items', 'order_item_type');

    if (!hasOrderCode || !orderItemsUsesOrderId || !orderItemsUsesProductId) {
      return res.status(500).json({
        success: false,
        error:
          'Skema order_items tidak sesuai backend pusat (wajib relasi order dan product).',
      });
    }

    const orderCode = buildOrderCode(
      order.order_code || order.orderCode || order.orderId
    );

    const serviceType = String(
      order.service_type || order.serviceType || 'Computer Vision'
    );

    const paymentMethod = String(
      order.payment_method || order.paymentMethod || 'QRIS'
    );

    const subtotal = toNumber(order.subtotal);
    const discount = toNumber(order.discount);
    const total = toNumber(order.total);

    const pointsEarned = toNumber(order.points_earned ?? order.pointsEarned);
    const pointsUsed = toNumber(
      order.points_used ?? order.pointsUsed ?? order.point_used
    );

    const orderTypeValue = String(
      order.order_type || order.orderType || 'computervision'
    ).toLowerCase();

    const memberCode = String(
      order.memberCode || order.member_code || order.user_id || order.userId || ''
    ).trim();

    let userId = String(order.user_id || order.userId || '').trim();

    if (!userId && memberCode) {
      userId = memberCode;
    }

    const tipePelanggan = String(
      order.tipe_pelanggan ||
        order.tipePelanggan ||
        (userId || memberCode ? 'MEMBER' : 'GUEST')
    ).toUpperCase();

    const namaPelanggan = String(
      order.nama_pelanggan || order.namaPelanggan || 'Guest'
    );

    const result = await withTransaction(async (connection) => {
      const orderColumns = [
        'order_code',
        'service_type',
        'subtotal',
        'discount',
        'total',
        'payment_method',
        'points_earned',
        'points_used',
      ];

      const orderValues = [
        orderCode,
        serviceType,
        subtotal,
        discount,
        total,
        paymentMethod,
        pointsEarned,
        pointsUsed,
      ];

      if (hasOrderType) {
        orderColumns.push('order_type');
        orderValues.push(orderTypeValue);
      }

      if (hasTipePelanggan) {
        orderColumns.push('tipe_pelanggan');
        orderValues.push(tipePelanggan);
      }

      if (hasNamaPelanggan) {
        orderColumns.push('nama_pelanggan');
        orderValues.push(namaPelanggan);
      }

      if (hasUserId) {
        orderColumns.push('user_id');
        orderValues.push(userId || null);
      }

      if (hasMemberCode) {
        orderColumns.push('member_code');
        orderValues.push(memberCode || null);
      }

      const placeholders = orderColumns.map(() => '?').join(', ');

      const [insertResult] = await connection.query(
        `INSERT INTO orders (${orderColumns.join(', ')})
        VALUES (${placeholders})`,
        orderValues
      );

      const insertedOrderId = insertResult.insertId ?? null;

      if (!insertedOrderId) {
        throw new Error('Gagal mendapatkan order_id hasil insert orders.');
      }

      for (const item of items) {
        const numericProductId = Number(item.product_id || item.productId || 0);
        const productCodeInput = String(
          item.product_code || item.productCode || item.code || item.id || ''
        ).trim();

        const qty = toNumber(item.qty || item.quantity || 1) || 1;
        let price = toNumber(item.price_snapshot ?? item.price);
        let productName = String(
          item.product_name_snapshot || item.product_name || item.name || ''
        ).trim();

        let productId = null;

        if (numericProductId > 0) {
          const [productRows] = await connection.query(
            `SELECT id, code, name, price, product_type
            FROM products
            WHERE id = ?
            LIMIT 1`,
            [numericProductId]
          );

          const product = productRows[0];

          if (!product) {
            throw new Error(`Produk dengan ID ${numericProductId} tidak ditemukan.`);
          }

          if (String(product.product_type || '').toLowerCase() !== 'cv') {
            throw new Error(
              `Produk ${product.code || product.id} bukan produk computer vision.`
            );
          }

          productId = Number(product.id || 0);

          if (!productName) {
            productName = String(product.name || 'Unknown Product');
          }

          if (price <= 0) {
            price = toNumber(product.price);
          }
        } else if (productCodeInput) {
          const [productRows] = await connection.query(
            `SELECT id, code, name, price, product_type
            FROM products
            WHERE code = ?
            LIMIT 1`,
            [productCodeInput]
          );

          const product = productRows[0];

          if (!product) {
            throw new Error(
              `Produk dengan code "${productCodeInput}" tidak ditemukan.`
            );
          }

          if (String(product.product_type || '').toLowerCase() !== 'cv') {
            throw new Error(
              `Produk ${product.code || product.id} bukan produk computer vision.`
            );
          }

          productId = Number(product.id || 0);

          if (!productName) {
            productName = String(product.name || 'Unknown Product');
          }

          if (price <= 0) {
            price = toNumber(product.price);
          }
        } else {
          throw new Error('Setiap item wajib mengirim product_id atau product_code.');
        }

        const subtotalItem = toNumber(item.subtotal) || price * qty;

        const itemColumns = [
          'order_id',
          'product_id',
          'product_name_snapshot',
          'price_snapshot',
          'qty',
          'subtotal',
        ];

        const itemValues = [
          insertedOrderId,
          productId,
          productName || 'Unknown Product',
          price,
          qty,
          subtotalItem,
        ];

        if (hasOrderItemType) {
          itemColumns.push('order_item_type');
          itemValues.push('computervision');
        }

        const itemPlaceholders = itemColumns.map(() => '?').join(', ');

        await connection.query(
          `INSERT INTO order_items (${itemColumns.join(', ')})
          VALUES (${itemPlaceholders})`,
          itemValues
        );
      }

      return {
        orderCode,
      };
    });

    return res.json({
      success: true,
      orderCode: result.orderCode,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

export async function uploadCvProductImage(req, res) {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        error: 'File gambar tidak ditemukan.',
      });
    }

    const mimeType = req.file.mimetype || 'image/jpeg';
    const base64 = `data:${mimeType};base64,${req.file.buffer.toString('base64')}`;

    return res.json({
      success: true,
      imageUrl: base64,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}