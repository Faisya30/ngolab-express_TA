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
    // Validasi role admin dan dapatkan product_type-nya
    const requestProductType = resolveRequestProductType(req);
    if (!requestProductType) {
      return res.status(403).json({ success: false, error: 'Role admin tidak diizinkan mengakses orders.' });
    }

    const usesMemberCode = await hasColumn('orders', 'member_code');
    const hasProductType = await hasColumn('products', 'product_type');
    
    // Jika product_type belum ada di products, assume semua orders adalah kiosk (legacy mode)
    if (!hasProductType) {
      const rows = usesMemberCode
        ? await query(
            `SELECT
              order_code AS orderId,
              created_at AS timestamp,
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
              o.order_code AS orderId,
              o.created_at AS timestamp,
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
      return res.json(rows);
    }

    // Filter orders berdasarkan product_type dari order items
    // Super admin (requestProductType='all') melihat semua orders
    const filterClause = requestProductType === 'all' 
      ? '' 
      : `WHERE p.product_type = '${requestProductType}'`;

    // Cek struktur order_items - bisa punya order_code atau order_id, product_code atau product_id
    const hasOrderItemsOrderCode = await hasColumn('order_items', 'order_code');
    const hasOrderItemsProductCode = await hasColumn('order_items', 'product_code');
    
    let joinClause1, joinClause2, selectProductJoin;
    
    if (hasOrderItemsOrderCode) {
      joinClause1 = 'o.order_code = oi.order_code';
    } else {
      joinClause1 = 'o.id = oi.order_id';
    }
    
    if (hasOrderItemsProductCode) {
      joinClause2 = 'oi.product_code = p.code';
    } else {
      joinClause2 = 'oi.product_id = p.id';
    }

    const rows = await query(
      `SELECT DISTINCT
        o.order_code AS orderId,
        o.created_at AS timestamp,
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
      ${filterClause}
      ORDER BY o.created_at DESC`
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

export async function getVouchers(_req, res) {
  try {
    const rows = await query(
      `SELECT
        code AS id,
        title,
        COALESCE(description, '') AS description,
        discount,
        type,
        is_active AS isActive
      FROM vouchers
      ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function getMembers(_req, res) {
  try {
    const rows = await query(
      `SELECT
        code,
        name,
        cashback_points AS cashbackPoints,
        is_affiliate AS isAffiliate
      FROM members
      ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function getMemberLogs(_req, res) {
  try {
    const usesMemberCode = await hasColumn('member_logs', 'member_code');
    const usesOrderCode = await hasColumn('member_logs', 'order_code');

    const rows = usesMemberCode
      ? await query(
          `SELECT
            created_at AS timestamp,
            member_code AS memberCode,
            COALESCE(m.name, '') AS memberName,
            order_code AS orderId,
            points_earned AS pointsEarned,
            points_used AS pointsUsed,
            note,
            COALESCE(m.is_affiliate, 0) AS affiliate
          FROM member_logs ml
          LEFT JOIN members m ON ml.member_code = m.code
          ORDER BY ml.created_at DESC`
        )
      : await query(
          `SELECT
            ml.created_at AS timestamp,
            COALESCE(m.code, '') AS memberCode,
            COALESCE(m.name, '') AS memberName,
            COALESCE(o.order_code, '') AS orderId,
            ml.points_earned AS pointsEarned,
            ml.points_used AS pointsUsed,
            ml.note,
            COALESCE(m.is_affiliate, 0) AS affiliate
          FROM member_logs ml
          LEFT JOIN members m ON ml.member_id = m.id
          LEFT JOIN orders o ON ml.order_id = o.id
          ORDER BY ml.created_at DESC`
        );

    if (!usesOrderCode) {
      return res.json(rows);
    }

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

export async function saveVoucher(req, res) {
  try {
    const voucher = req.body?.voucher || req.body || {};
    const code = String(voucher.id || `VOU-${Date.now()}`);

    await query(
      `INSERT INTO vouchers (code, title, description, discount, type, is_active)
      VALUES (?, ?, ?, ?, ?, 1)
      ON DUPLICATE KEY UPDATE
        title = VALUES(title),
        description = VALUES(description),
        discount = VALUES(discount),
        type = VALUES(type)`,
      [
        code,
        String(voucher.title || ''),
        String(voucher.description || ''),
        Number(voucher.discount || 0),
        String(voucher.type || 'PERCENT').toUpperCase() === 'VALUE' ? 'VALUE' : 'PERCENT',
      ]
    );

    res.json({ success: true, id: code });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function deleteVoucher(req, res) {
  try {
    await query('DELETE FROM vouchers WHERE code = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
