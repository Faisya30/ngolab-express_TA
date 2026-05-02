import { query } from '../config/db.js';

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

async function resolveCategoryId(categoryValue) {
  const raw = String(categoryValue || '').trim();
  if (!raw) return null;

  const rows = await query(
    `SELECT id
    FROM categories
    WHERE code = ? OR LOWER(name) = LOWER(?)
    LIMIT 1`,
    [raw, raw]
  );

  return rows[0]?.id ?? null;
}

function mapRoleToProductType(rawRole) {
  const role = String(rawRole || '').toLowerCase();
  if (role === 'kiosk_admin') return 'kiosk';
  if (role === 'cv_admin') return 'cv';
  if (role === 'super admin' || role === 'super_admin' || role === 'admin') return 'all';
  return null;
}

function resolveRequestProductType(req) {
  return mapRoleToProductType(req.headers['x-admin-role']);
}

function resolveCategoryProductType(requestProductType, categoryValue) {
  const raw = String(categoryValue || '').trim().toLowerCase();

  if (raw === 'cv' || raw === 'kiosk' || raw === 'all') {
    return raw;
  }

  if (requestProductType === 'cv' || requestProductType === 'kiosk') {
    return requestProductType;
  }

  return 'all';
}

export async function getOrders(req, res) {
  try {
    const requestProductType = resolveRequestProductType(req);
    if (!requestProductType) {
      return res.status(403).json({ success: false, error: 'Role admin tidak diizinkan mengakses orders.' });
    }

    const hasOrderType = await hasColumn('orders', 'order_type');
    if (!hasOrderType) {
      return res.status(500).json({ success: false, error: 'Kolom order_type belum tersedia. Jalankan migrasi database terlebih dahulu.' });
    }

    const rows = await query(
      requestProductType === 'all'
        ? `SELECT
            order_code AS orderId,
            created_at AS timestamp,
            service_type AS service,
            subtotal,
            discount,
            total,
            payment_method AS payment,
            COALESCE(order_type, 'kiosk') AS orderType
          FROM orders
          ORDER BY created_at DESC`
        : `SELECT
            order_code AS orderId,
            created_at AS timestamp,
            service_type AS service,
            subtotal,
            discount,
            total,
            payment_method AS payment,
            COALESCE(order_type, 'kiosk') AS orderType
          FROM orders
          WHERE order_type = ?
          ORDER BY created_at DESC`,
      requestProductType === 'all' ? [] : [requestProductType]
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function getOrderDetails(_req, res) {
  try {
    const usesOrderCode = await hasColumn('order_items', 'order_code');
    const rows = usesOrderCode
      ? await query(
          `SELECT
            order_code AS orderId,
            product_name_snapshot AS productName,
            qty,
            price_snapshot AS price,
            subtotal
          FROM order_items
          ORDER BY id DESC`
        )
      : await query(
          `SELECT
            o.order_code AS orderId,
            oi.product_name_snapshot AS productName,
            oi.qty,
            oi.price_snapshot AS price,
            oi.subtotal
          FROM order_items oi
          LEFT JOIN orders o ON oi.order_id = o.id
          ORDER BY oi.id DESC`
        );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function getProducts(req, res) {
  try {
    const requestProductType = resolveRequestProductType(req);
    if (!requestProductType) {
      return res.status(403).json({ success: false, error: 'Role admin tidak diizinkan mengakses produk.' });
    }

    const hasProductType = await hasColumn('products', 'product_type');
    if (!hasProductType) {
      return res.status(500).json({ success: false, error: 'Kolom product_type belum tersedia. Jalankan migrasi database terlebih dahulu.' });
    }

    const usesCategoryCode = await hasColumn('products', 'category_code');
    const rows = usesCategoryCode
      ? await query(
          requestProductType === 'all'
            ? `SELECT
                code AS id,
                name,
                category_code AS category,
                price,
                COALESCE(image_url, '') AS image,
                COALESCE(description, '') AS description,
                product_type,
                is_recommended AS isRecommended,
                cashback_reward AS cashbackReward,
                is_active AS isActive
              FROM products
              ORDER BY created_at DESC`
            : `SELECT
                code AS id,
                name,
                category_code AS category,
                price,
                COALESCE(image_url, '') AS image,
                COALESCE(description, '') AS description,
                product_type,
                is_recommended AS isRecommended,
                cashback_reward AS cashbackReward,
                is_active AS isActive
              FROM products
              WHERE product_type = ?
              ORDER BY created_at DESC`,
          requestProductType === 'all' ? [] : [requestProductType]
        )
      : await query(
          requestProductType === 'all'
            ? `SELECT
                p.code AS id,
                p.name,
                COALESCE(c.code, '') AS category,
                p.price,
                COALESCE(p.image_url, '') AS image,
                COALESCE(p.description, '') AS description,
                p.product_type,
                p.is_recommended AS isRecommended,
                p.cashback_reward AS cashbackReward,
                p.is_active AS isActive
              FROM products p
              LEFT JOIN categories c ON p.category_id = c.id
              ORDER BY p.created_at DESC`
            : `SELECT
                p.code AS id,
                p.name,
                COALESCE(c.code, '') AS category,
                p.price,
                COALESCE(p.image_url, '') AS image,
                COALESCE(p.description, '') AS description,
                p.product_type,
                p.is_recommended AS isRecommended,
                p.cashback_reward AS cashbackReward,
                p.is_active AS isActive
              FROM products p
              LEFT JOIN categories c ON p.category_id = c.id
              WHERE p.product_type = ?
              ORDER BY p.created_at DESC`,
          requestProductType === 'all' ? [] : [requestProductType]
        );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function getCategories(req, res) {
  try {
    const hasCategoryType = await hasColumn('categories', 'product_type');
    const requestProductType = resolveRequestProductType(req);

    const rows = hasCategoryType
      ? await query(
          requestProductType === 'all'
            ? `SELECT
                code AS id,
                name,
                COALESCE(product_type, 'all') AS productType,
                is_active AS isActive
              FROM categories
              ORDER BY created_at ASC`
            : `SELECT
                code AS id,
                name,
                COALESCE(product_type, 'all') AS productType,
                is_active AS isActive
              FROM categories
              WHERE product_type IN (?, 'all')
              ORDER BY created_at ASC`,
          requestProductType === 'all' ? [] : [requestProductType]
        )
      : await query(
          `SELECT
            code AS id,
            name,
            is_active AS isActive
          FROM categories
          ORDER BY created_at ASC`
        );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function saveProduct(req, res) {
  try {
    const requestProductType = resolveRequestProductType(req);
    if (!requestProductType) {
      return res.status(403).json({ success: false, error: 'Role admin tidak diizinkan menyimpan produk.' });
    }

    const hasProductType = await hasColumn('products', 'product_type');
    if (!hasProductType) {
      return res.status(500).json({ success: false, error: 'Kolom product_type belum tersedia. Jalankan migrasi database terlebih dahulu.' });
    }

    const product = req.body?.product || req.body || {};
    const code = String(product.id || `PROD-${Date.now()}`);
    const targetProductType = requestProductType === 'all'
      ? String(product.product_type || product.productType || 'kiosk').toLowerCase()
      : requestProductType;

    const hasCategoryType = await hasColumn('categories', 'product_type');
    if (hasCategoryType) {
      const categoryTypeRows = await query(
        `SELECT COALESCE(product_type, 'all') AS productType
        FROM categories
        WHERE code = ?
        LIMIT 1`,
        [String(product.category || 'recommended')]
      );
      const categoryProductType = String(categoryTypeRows[0]?.productType || 'all').toLowerCase();

      if (categoryProductType !== 'all' && categoryProductType !== targetProductType) {
        return res.status(400).json({
          success: false,
          error: 'Kategori tidak bisa dipakai untuk scope produk ini.',
        });
      }
    }

    const usesCategoryCode = await hasColumn('products', 'category_code');

    if (usesCategoryCode) {
      await query(
        `INSERT INTO products (
          code, name, category_code, price, image_url, description, product_type,
          is_recommended, cashback_reward, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          category_code = VALUES(category_code),
          price = VALUES(price),
          image_url = VALUES(image_url),
          description = VALUES(description),
          product_type = VALUES(product_type),
          is_recommended = VALUES(is_recommended),
          cashback_reward = VALUES(cashback_reward)` ,
        [
          code,
          String(product.name || ''),
          String(product.category || 'recommended'),
          Number(product.price || 0),
          String(product.image || ''),
          String(product.description || ''),
          targetProductType,
          product.isRecommended ? 1 : 0,
          Number(product.cashbackReward || 0),
        ]
      );
    } else {
      const categoryId = await resolveCategoryId(product.category);
      if (!categoryId) {
        return res.status(400).json({ success: false, error: 'Category tidak ditemukan. Pilih kategori yang valid.' });
      }

      await query(
        `INSERT INTO products (
          code, name, category_id, price, image_url, description, product_type,
          is_recommended, cashback_reward, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          category_id = VALUES(category_id),
          price = VALUES(price),
          image_url = VALUES(image_url),
          description = VALUES(description),
          product_type = VALUES(product_type),
          is_recommended = VALUES(is_recommended),
          cashback_reward = VALUES(cashback_reward)` ,
        [
          code,
          String(product.name || ''),
          Number(categoryId),
          Number(product.price || 0),
          String(product.image || ''),
          String(product.description || ''),
          targetProductType,
          product.isRecommended ? 1 : 0,
          Number(product.cashbackReward || 0),
        ]
      );
    }

    res.json({ success: true, id: code });
  } catch (error) {
    if (error?.code === 'ER_DATA_TOO_LONG') {
      return res.status(413).json({
        success: false,
        error: 'Data gambar terlalu besar untuk kolom database (image_url). Perbesar tipe kolom atau kompres gambar.',
      });
    }
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function deleteProduct(req, res) {
  try {
    const requestProductType = resolveRequestProductType(req);
    if (!requestProductType) {
      return res.status(403).json({ success: false, error: 'Role admin tidak diizinkan menghapus produk.' });
    }

    const hasProductType = await hasColumn('products', 'product_type');
    if (!hasProductType) {
      return res.status(500).json({ success: false, error: 'Kolom product_type belum tersedia. Jalankan migrasi database terlebih dahulu.' });
    }

    if (requestProductType === 'all') {
      await query('DELETE FROM products WHERE code = ?', [req.params.id]);
    } else {
      await query('DELETE FROM products WHERE code = ? AND product_type = ?', [req.params.id, requestProductType]);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function saveCategory(req, res) {
  try {
    const category = req.body?.category || req.body || {};
    const code = String(category.id || `CAT-${Date.now()}`);
    const requestProductType = resolveRequestProductType(req);
    const hasCategoryType = await hasColumn('categories', 'product_type');
    const targetCategoryType = resolveCategoryProductType(requestProductType, category.product_type || category.productType);

    if (!requestProductType) {
      return res.status(403).json({ success: false, error: 'Role admin tidak diizinkan menyimpan kategori.' });
    }

    if (hasCategoryType && requestProductType !== 'all' && targetCategoryType !== requestProductType) {
      return res.status(403).json({
        success: false,
        error: 'Role admin hanya boleh menyimpan kategori sesuai scope produknya.',
      });
    }

    if (hasCategoryType) {
      await query(
        `INSERT INTO categories (code, name, product_type, is_active)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          product_type = VALUES(product_type),
          is_active = VALUES(is_active)`,
        [code, String(category.name || '').toUpperCase(), targetCategoryType, category.isActive === false ? 0 : 1]
      );
    } else {
      await query(
        `INSERT INTO categories (code, name, is_active)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          is_active = VALUES(is_active)`,
        [code, String(category.name || '').toUpperCase(), category.isActive === false ? 0 : 1]
      );
    }

    res.json({ success: true, id: code });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function deleteCategory(req, res) {
  try {
    await query('DELETE FROM categories WHERE code = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}


