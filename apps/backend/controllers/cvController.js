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
            COALESCE(product_type, 'cv') AS productType,
        name,
        price,
        COALESCE(image_url, '') AS image_url,
            AND product_type = 'cv'
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

export async function getCvOrders(req, res) {
  try {
    const requestedType = normalizeProductType(req.query.order_type);
    const hasOrderType = await hasColumn('orders', 'order_type');
    if (!hasOrderType) {
      return res.status(500).json({ success: false, error: 'Kolom order_type belum tersedia. Jalankan migrasi database terlebih dahulu.' });
    }

    const orders = await query(
      requestedType === 'all'
        ? `SELECT
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
        : `SELECT
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
    const orderItemsHasProductNameSnapshot = await hasColumn('order_items', 'product_name_snapshot');
    const orderItemsHasPriceSnapshot = await hasColumn('order_items', 'price_snapshot');

    for (const o of orders) {
      const productNameCol = orderItemsHasProductNameSnapshot ? 'product_name_snapshot' : (orderItemsHasProductName ? 'product_name' : "''");
      const priceCol = orderItemsHasPriceSnapshot ? 'price_snapshot' : 'price';

      const items = await query(
        orderItemsUsesOrderId
          ? `SELECT id, order_id, product_id, ${productNameCol} AS product_name_snapshot, ${priceCol} AS price, qty, subtotal
            FROM order_items
            WHERE order_id = ? AND COALESCE(order_item_type, 'computervision') IN ('cv', 'computervision')
            ORDER BY id ASC`
          : `SELECT id, order_code, product_code, ${productNameCol} AS product_name_snapshot, ${priceCol} AS price, qty, subtotal
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
    const hasOrderType = await hasColumn('orders', 'order_type');
    const hasTipePelanggan = await hasColumn('orders', 'tipe_pelanggan');
    const hasNamaPelanggan = await hasColumn('orders', 'nama_pelanggan');

    const orderItemsUsesOrderId = await hasColumn('order_items', 'order_id');
    const orderItemsUsesProductId = await hasColumn('order_items', 'product_id');
    const hasOrderItemType = await hasColumn('order_items', 'order_item_type');

    if (!hasOrderCode || !orderItemsUsesOrderId || !orderItemsUsesProductId) {
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

    const orderTypeValue = String(order.order_type || order.orderType || 'computervision').toLowerCase();
    const tipePelanggan = String(order.tipe_pelanggan || order.tipePelanggan || 'GUEST').toUpperCase();
    const namaPelanggan = String(order.nama_pelanggan || order.namaPelanggan || 'Guest');

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

      const placeholders = orderColumns.map(() => '?').join(', ');
      await connection.query(
        `INSERT INTO orders (${orderColumns.join(', ')}) VALUES (${placeholders})`,
        orderValues
      );

      let insertedOrderId = null;
      const [savedRows] = await connection.query('SELECT id FROM orders WHERE order_code = ? LIMIT 1', [orderCode]);
      insertedOrderId = savedRows[0]?.id ?? null;

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

          productId = Number(product.id || 0) || productId;

          if (!productName) productName = String(product.name || 'Unknown Product');
          if (price <= 0) price = toNumber(product.price);
        } else {
          throw new Error('Setiap item wajib mengirim product_code atau product_id.');
        }

        const subtotalItem = toNumber(item.subtotal) || (price * qty);
        const itemColumns = ['order_code', 'product_code', 'product_name_snapshot', 'price_snapshot', 'qty', 'subtotal'];
        const itemValues = [orderCode, productCode, productName || 'Unknown Product', price, qty, subtotalItem];

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

      return { orderCode };
    });

    return res.json({ success: true, orderCode: result.orderCode });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
