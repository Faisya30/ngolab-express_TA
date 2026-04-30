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
  if (typeof value === 'number') return value;
  const cleaned = String(value).replace(/[^0-9.-]/g, '');
  return Number(cleaned) || 0;
}

function normalizeProductType(rawType) {
  const value = String(rawType || '').toLowerCase().trim();
  if (value === 'computervision' || value === 'cv') return 'cv';
  if (value === 'kiosk') return 'kiosk';
  return 'cv';
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

async function resolveMemberCode(connection, rawMemberCode, rawMemberId) {
  const memberCode = String(rawMemberCode || '').trim();
  if (memberCode) {
    const [rows] = await connection.query('SELECT code FROM members WHERE code = ? LIMIT 1', [memberCode]);
    return rows[0]?.code || null;
  }

  const memberId = Number(rawMemberId || 0);
  if (!memberId) return null;
  const [rows] = await connection.query('SELECT code FROM members WHERE id = ? LIMIT 1', [memberId]);
  return rows[0]?.code || null;
}

async function resolveVoucherCode(connection, rawVoucherCode, rawVoucherId) {
  const voucherCode = String(rawVoucherCode || '').trim();
  if (voucherCode) {
    const [rows] = await connection.query('SELECT code FROM vouchers WHERE code = ? LIMIT 1', [voucherCode]);
    return rows[0]?.code || null;
  }

  const voucherId = Number(rawVoucherId || 0);
  if (!voucherId) return null;
  const [rows] = await connection.query('SELECT code FROM vouchers WHERE id = ? LIMIT 1', [voucherId]);
  return rows[0]?.code || null;
}

async function resolveCvCategoryCode(rawCategory) {
  const categoryValue = String(rawCategory || '').trim();
  if (!categoryValue) return null;

  const hasCategoryType = await hasColumn('categories', 'product_type');
  if (hasCategoryType) {
    const rows = await query(
      `SELECT
        code,
        COALESCE(product_type, 'all') AS productType
      FROM categories
      WHERE code = ? OR LOWER(name) = LOWER(?)
      LIMIT 1`,
      [categoryValue, categoryValue]
    );

    const category = rows[0];
    if (!category) return null;

    const categoryType = String(category.productType || 'all').toLowerCase();
    if (categoryType !== 'cv' && categoryType !== 'all') {
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
      return res.status(500).json({ success: false, error: 'Kolom product_type belum tersedia.' });
    }

    const hasBarcode = await hasColumn('products', 'barcode');
    const usesCategoryCode = await hasColumn('products', 'category_code');
    const requestedType = normalizeProductType(req.query.product_type);
    const activeOnly = String(req.query.is_active || '1') !== '0';

    if (usesCategoryCode) {
      const rows = await query(
        `SELECT
          p.code AS id,
          p.code,
          ${hasBarcode ? 'COALESCE(p.barcode, \'\') AS barcode,' : 'NULL AS barcode,'}
          p.name,
          p.price,
          COALESCE(p.category_code, '') AS category_code,
          COALESCE(p.image_url, '') AS image_url,
          COALESCE(p.description, '') AS description,
          p.product_type,
          p.is_recommended AS isRecommended,
          p.cashback_reward AS cashbackReward,
          p.is_active AS isActive
        FROM products p
        WHERE p.product_type = ?
          ${activeOnly ? 'AND p.is_active = 1' : ''}
        ORDER BY p.created_at DESC`,
        [requestedType]
      );

      return res.json({ success: true, products: rows });
    }

    const rows = await query(
      `SELECT
        p.code AS id,
        p.code,
        ${hasBarcode ? 'COALESCE(p.barcode, \'\') AS barcode,' : 'NULL AS barcode,'}
        p.name,
        p.price,
        COALESCE(c.code, '') AS category_code,
        COALESCE(p.image_url, '') AS image_url,
        COALESCE(p.description, '') AS description,
        p.product_type,
        p.is_recommended AS isRecommended,
        p.cashback_reward AS cashbackReward,
        p.is_active AS isActive
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.product_type = ?
        ${activeOnly ? 'AND p.is_active = 1' : ''}
      ORDER BY p.created_at DESC`,
      [requestedType]
    );

    return res.json({ success: true, products: rows });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
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
            COALESCE(product_type, 'all') AS productType,
            is_active AS isActive
          FROM categories
          WHERE is_active = 1
            AND product_type IN ('cv', 'all')
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

    return res.json({ success: true, categories: rows });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function saveCvProduct(req, res) {
  try {
    const hasProductType = await hasColumn('products', 'product_type');
    if (!hasProductType) {
      return res.status(500).json({ success: false, error: 'Kolom product_type belum tersedia. Jalankan migrasi database.' });
    }

    const product = req.body?.product || req.body || {};
    const code = String(req.params.id || product.id || product.code || `PROD-${Date.now()}`).trim();
    if (!code) {
      return res.status(400).json({ success: false, error: 'Kode produk wajib diisi.' });
    }

    const name = String(product.name || '').trim();
    if (!name) {
      return res.status(400).json({ success: false, error: 'Nama produk tidak boleh kosong.' });
    }

    const categoryInput = product.category_code || product.category || 'retail';
    const categoryCode = await resolveCvCategoryCode(categoryInput);
    if (!categoryCode) {
      return res.status(400).json({
        success: false,
        error: 'Kategori tidak valid atau bukan scope CV. Gunakan kategori Retail atau kategori CV lain yang diizinkan.',
      });
    }

    const usesCategoryCode = await hasColumn('products', 'category_code');
    const hasBarcode = await hasColumn('products', 'barcode');
    const isActiveValue = product.isActive === false || product.is_active === false ? 0 : 1;
    const barcodeValue = String(product.barcode || '').trim();

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
        return res.status(400).json({ success: false, error: 'Kategori CV tidak ditemukan di database.' });
      }

      columns.push('category_id');
      values.push(Number(categoryId));
      updates.push('category_id = VALUES(category_id)');
    }

    columns.push('price', 'image_url', 'description', 'product_type', 'is_recommended', 'cashback_reward', 'is_active');
    values.push(
      Number(product.price || 0),
      String(product.image || product.image_url || ''),
      String(product.description || ''),
      'cv',
      product.isRecommended ? 1 : 0,
      Number(product.cashbackReward || 0),
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

    return res.json({ success: true, id: code, affectedRows: result.affectedRows ?? 1 });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function deleteCvProduct(req, res) {
  try {
    const hasProductType = await hasColumn('products', 'product_type');
    if (!hasProductType) {
      return res.status(500).json({ success: false, error: 'Kolom product_type belum tersedia. Jalankan migrasi database.' });
    }

    const code = String(req.params.id || '').trim();
    if (!code) {
      return res.status(400).json({ success: false, error: 'Kode produk wajib diisi.' });
    }

    const result = await query('DELETE FROM products WHERE code = ? AND product_type = ?', [code, 'cv']);
    if (!result.affectedRows) {
      return res.status(404).json({ success: false, error: 'Produk CV tidak ditemukan.' });
    }

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function getCvProductByBarcode(req, res) {
  try {
    const hasBarcode = await hasColumn('products', 'barcode');
    if (!hasBarcode) {
      return res.status(500).json({ success: false, error: 'Kolom barcode belum tersedia. Jalankan migrasi database.' });
    }

    const barcode = String(req.params.barcode || '').trim();
    if (!barcode) {
      return res.status(400).json({ success: false, error: 'Barcode wajib diisi.' });
    }

    const rows = await query(
      `SELECT
        code AS id,
        code,
        COALESCE(barcode, '') AS barcode,
        name,
        price,
        COALESCE(image_url, '') AS image_url,
        COALESCE(description, '') AS description,
        product_type,
        is_recommended AS isRecommended,
        cashback_reward AS cashbackReward,
        is_active AS isActive
      FROM products
      WHERE barcode = ?
        AND product_type = 'cv'
        AND is_active = 1
      LIMIT 1`,
      [barcode]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Produk CV dengan barcode tersebut tidak ditemukan.' });
    }

    return res.json({ success: true, product: rows[0] });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function getCvMemberByCode(req, res) {
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
      return res.status(404).json({ success: false, error: 'Member tidak ditemukan.' });
    }

    return res.json({ success: true, member: rows[0] });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function getActiveVouchers(_req, res) {
  try {
    const rows = await query(
      `SELECT
        code AS id,
        code,
        title,
        COALESCE(description, '') AS description,
        discount,
        type,
        is_active AS isActive
      FROM vouchers
      WHERE is_active = 1
      ORDER BY created_at DESC`
    );

    return res.json({ success: true, vouchers: rows });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function getCvOrders(req, res) {
  try {
    const requestedType = normalizeProductType(req.query.order_type);
    const usesMemberCode = await hasColumn('orders', 'member_code');
    const hasProductType = await hasColumn('products', 'product_type');

    // Fetch orders (always return consistent fields: id, order_code, created_at, subtotal, discount, total, payment, member)
    let orders = [];

    if (!hasProductType) {
      orders = usesMemberCode
        ? await query(
            `SELECT
              id,
              order_code,
              created_at,
              service_type AS service,
              subtotal,
              discount,
              total,
              payment_method AS payment,
              COALESCE(member_code, 'Guest') AS member
            FROM orders
            ORDER BY created_at DESC`
          )
        : await query(
            `SELECT
              o.id,
              o.order_code,
              o.created_at,
              o.service_type AS service,
              o.subtotal,
              o.discount,
              o.total,
              o.payment_method AS payment,
              COALESCE(m.code, 'Guest') AS member
            FROM orders o
            LEFT JOIN members m ON o.member_id = m.id
            ORDER BY o.created_at DESC`
          );
    } else {
      const hasOrderItemsOrderCode = await hasColumn('order_items', 'order_code');
      const hasOrderItemsProductCode = await hasColumn('order_items', 'product_code');

      const joinClause1 = hasOrderItemsOrderCode ? 'o.order_code = oi.order_code' : 'o.id = oi.order_id';
      const joinClause2 = hasOrderItemsProductCode ? 'oi.product_code = p.code' : 'oi.product_id = p.id';

      orders = await query(
        `SELECT DISTINCT
          o.id,
          o.order_code,
          o.created_at,
          o.service_type AS service,
          o.subtotal,
          o.discount,
          o.total,
          o.payment_method AS payment,
          COALESCE(${usesMemberCode ? 'o.member_code' : 'm.code'}, 'Guest') AS member
        FROM orders o
        LEFT JOIN order_items oi ON ${joinClause1}
        LEFT JOIN products p ON ${joinClause2}
        ${usesMemberCode ? '' : 'LEFT JOIN members m ON o.member_id = m.id'}
        WHERE p.product_type = ?
        ORDER BY o.created_at DESC`,
        [requestedType]
      );
    }

    // Ensure we have array shape
    if (!Array.isArray(orders)) orders = [];

    // Attach items[] for each order
    const orderItemsUsesOrderCode = await hasColumn('order_items', 'order_code');
    const orderItemsHasProductNameSnapshot = await hasColumn('order_items', 'product_name_snapshot');
    const orderItemsHasProductName = await hasColumn('order_items', 'product_name');
    const orderItemsHasPriceSnapshot = await hasColumn('order_items', 'price_snapshot');
    const orderItemsHasPrice = await hasColumn('order_items', 'price');

    for (const o of orders) {
      const orderKey = orderItemsUsesOrderCode ? o.order_code : o.id;
      
      // Build dynamic SELECT based on available columns
      const productNameCol = orderItemsHasProductNameSnapshot ? 'product_name_snapshot' : (orderItemsHasProductName ? 'product_name' : "''");
      const priceCol = orderItemsHasPriceSnapshot ? 'price_snapshot' : (orderItemsHasPrice ? 'price' : '0');
      
      const itemsQuery = orderItemsUsesOrderCode
        ? `SELECT id, order_code, product_code, ${productNameCol} AS product_name_snapshot, ${priceCol} AS price, qty, subtotal FROM order_items WHERE order_code = ? ORDER BY id ASC`
        : `SELECT id, order_id, product_id, ${productNameCol} AS product_name_snapshot, ${priceCol} AS price, qty, subtotal FROM order_items WHERE order_id = ? ORDER BY id ASC`;

      const itemsRows = await query(itemsQuery, [orderKey]);
      const items = itemsRows || [];

      // Normalize item fields for frontend: include product_name_snapshot and productName
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

    return res.json({ success: true, orders });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function saveCvOrder(req, res) {
  try {
    const payload = req.body || {};
    const order = payload.order || payload;
    const items = parseItems(payload.items ?? payload.order_items ?? payload.cart ?? payload.rawCartData ?? []);

    if (!items.length) {
      return res.status(400).json({ success: false, error: 'Order item kosong.' });
    }

    const hasOrderCode = await hasColumn('orders', 'order_code');
    const hasMemberCode = await hasColumn('orders', 'member_code');
    const hasMemberId = await hasColumn('orders', 'member_id');
    const hasVoucherCode = await hasColumn('orders', 'voucher_code');
    const hasVoucherId = await hasColumn('orders', 'voucher_id');
    const hasOrderType = await hasColumn('orders', 'order_type');
    const hasTipePelanggan = await hasColumn('orders', 'tipe_pelanggan');
    const hasNamaPelanggan = await hasColumn('orders', 'nama_pelanggan');

    const orderItemsUsesOrderCode = await hasColumn('order_items', 'order_code');
    const orderItemsUsesOrderId = await hasColumn('order_items', 'order_id');
    const orderItemsUsesProductCode = await hasColumn('order_items', 'product_code');
    const orderItemsUsesProductId = await hasColumn('order_items', 'product_id');
    const hasOrderItemType = await hasColumn('order_items', 'order_item_type');

    if (!hasOrderCode || (!hasMemberCode && !hasMemberId) || (!hasVoucherCode && !hasVoucherId)) {
      return res.status(500).json({ success: false, error: 'Skema orders tidak sesuai backend pusat (wajib order_code dan relasi member/voucher).' });
    }

    if ((!orderItemsUsesOrderCode && !orderItemsUsesOrderId) || (!orderItemsUsesProductCode && !orderItemsUsesProductId)) {
      return res.status(500).json({ success: false, error: 'Skema order_items tidak sesuai backend pusat (wajib relasi order dan product).' });
    }

    const orderCode = buildOrderCode(order.order_code || order.orderCode || order.orderId);
    const serviceType = String(order.service_type || order.serviceType || 'Computer Vision');
    const paymentMethod = String(order.payment_method || order.paymentMethod || 'QRIS');
    const subtotal = toNumber(order.subtotal);
    const discount = toNumber(order.discount);
    const total = toNumber(order.total);
    const pointsEarned = toNumber(order.points_earned ?? order.pointsEarned);
    const pointsUsed = toNumber(order.points_used ?? order.pointsUsed ?? order.point_used);

    const memberCodeInput = String(order.member_code || order.memberCode || '').trim();
    const memberIdInput = order.member_id ?? order.memberId;
    const voucherCodeInput = String(order.voucher_code || order.voucherCode || '').trim();
    const voucherIdInput = order.voucher_id ?? order.voucherId;

    const orderTypeValue = String(order.order_type || order.orderType || 'computervision').toLowerCase();
    const tipePelanggan = String(order.tipe_pelanggan || order.tipePelanggan || (memberCodeInput ? 'MEMBER' : 'GUEST')).toUpperCase();
    const namaPelanggan = String(order.nama_pelanggan || order.namaPelanggan || (tipePelanggan === 'MEMBER' ? 'Member' : 'Guest'));

    const memberLogsUsesMemberCode = await hasColumn('member_logs', 'member_code');
    const memberLogsUsesOrderCode = await hasColumn('member_logs', 'order_code');

    const result = await withTransaction(async (connection) => {
      let memberCode = null;
      let memberId = null;
      if (memberCodeInput || memberIdInput) {
        const [memberRows] = memberCodeInput
          ? await connection.query('SELECT id, code FROM members WHERE code = ? LIMIT 1', [memberCodeInput])
          : await connection.query('SELECT id, code FROM members WHERE id = ? LIMIT 1', [Number(memberIdInput || 0)]);
        const member = memberRows[0];
        if (!member) {
          throw new Error('Member tidak ditemukan pada backend pusat. Gunakan member_code yang valid.');
        }
        memberCode = String(member.code || '');
        memberId = Number(member.id || 0) || null;
      }

      let voucherCode = null;
      let voucherId = null;
      if (voucherCodeInput || voucherIdInput) {
        const [voucherRows] = voucherCodeInput
          ? await connection.query('SELECT id, code FROM vouchers WHERE code = ? LIMIT 1', [voucherCodeInput])
          : await connection.query('SELECT id, code FROM vouchers WHERE id = ? LIMIT 1', [Number(voucherIdInput || 0)]);
        const voucher = voucherRows[0];
        if (!voucher) {
          throw new Error('Voucher tidak ditemukan pada backend pusat. Gunakan voucher_code yang valid.');
        }
        voucherCode = String(voucher.code || '');
        voucherId = Number(voucher.id || 0) || null;
      }

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

      if (hasMemberCode) {
        orderColumns.push('member_code');
        orderValues.push(memberCode || null);
      } else if (hasMemberId) {
        orderColumns.push('member_id');
        orderValues.push(memberId || null);
      }

      if (hasVoucherCode) {
        orderColumns.push('voucher_code');
        orderValues.push(voucherCode || null);
      } else if (hasVoucherId) {
        orderColumns.push('voucher_id');
        orderValues.push(voucherId || null);
      }

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

      const placeholders = orderColumns.map(() => '?').join(', ');
      await connection.query(
        `INSERT INTO orders (${orderColumns.join(', ')}) VALUES (${placeholders})`,
        orderValues
      );

      let insertedOrderId = null;
      if (orderItemsUsesOrderId) {
        const [savedRows] = await connection.query('SELECT id FROM orders WHERE order_code = ? LIMIT 1', [orderCode]);
        insertedOrderId = savedRows[0]?.id ?? null;
      }

      for (const item of items) {
        const productCodeInput = String(item.product_code || item.productCode || item.code || '').trim();
        const productIdInput = Number(item.product_id || item.productId || item.id || 0);
        const qty = toNumber(item.qty || item.quantity || 1) || 1;
        let price = toNumber(item.price_snapshot ?? item.price);
        let productName = String(item.product_name_snapshot || item.product_name || item.name || '').trim();
        let productCode = productCodeInput || null;
        let productId = productIdInput || null;

        if (productCodeInput || productIdInput) {
          const [productRows] = productCodeInput
            ? await connection.query(
              `SELECT id, code, name, price, product_type
              FROM products
              WHERE code = ?
              LIMIT 1`,
              [productCodeInput]
            )
            : await connection.query(
              `SELECT id, code, name, price, product_type
              FROM products
              WHERE id = ?
              LIMIT 1`,
              [productIdInput]
            );

          const product = productRows[0];
          if (!product) {
            throw new Error('Produk CV tidak ditemukan dari code/id yang dikirim.');
          }

          if (String(product.product_type || '').toLowerCase() !== 'cv') {
            throw new Error(`Produk ${product.code || product.id} bukan produk computer vision.`);
          }

          productCode = String(product.code || '') || productCode;
          productId = Number(product.id || 0) || productId;

          if (!productName) productName = String(product.name || 'Unknown Product');
          if (price <= 0) price = toNumber(product.price);
        } else {
          throw new Error('Setiap item wajib mengirim product_code atau product_id.');
        }

        const subtotalItem = toNumber(item.subtotal) || (price * qty);
        const itemColumns = ['product_name_snapshot', 'price_snapshot', 'qty', 'subtotal'];
        const itemValues = [productName || 'Unknown Product', price, qty, subtotalItem];

        if (orderItemsUsesOrderCode) {
          itemColumns.unshift('order_code');
          itemValues.unshift(orderCode);
        } else if (orderItemsUsesOrderId) {
          itemColumns.unshift('order_id');
          itemValues.unshift(insertedOrderId);
        }

        if (orderItemsUsesProductCode) {
          itemColumns.splice(1, 0, 'product_code');
          itemValues.splice(1, 0, productCode || null);
        } else if (orderItemsUsesProductId) {
          itemColumns.splice(1, 0, 'product_id');
          itemValues.splice(1, 0, productId || null);
        }

        if (hasOrderItemType) {
          itemColumns.push('order_item_type');
          itemValues.push('computervision');
        }

        const itemPlaceholders = itemColumns.map(() => '?').join(', ');
        await connection.query(
          `INSERT INTO order_items (${itemColumns.join(', ')}) VALUES (${itemPlaceholders})`,
          itemValues
        );
      }

      if ((pointsEarned > 0 || pointsUsed > 0) && memberCode && memberLogsUsesMemberCode) {
        await connection.query(
          `INSERT INTO member_logs (
            member_code, order_code, points_earned, points_used, note
          ) VALUES (?, ?, ?, ?, ?)`,
          [memberCode, memberLogsUsesOrderCode ? orderCode : null, pointsEarned, pointsUsed, 'Order from computer vision']
        );
      }

      return { orderCode };
    });

    return res.json({ success: true, orderCode: result.orderCode });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
