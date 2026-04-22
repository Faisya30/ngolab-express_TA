-- Migration: tambah product_type untuk memisahkan produk Kiosk vs CV.
-- Aman dijalankan berulang (idempotent).

SET @db_name := DATABASE();

-- 1) Tambah kolom product_type jika belum ada.
SET @col_exists := (
	SELECT COUNT(*)
	FROM INFORMATION_SCHEMA.COLUMNS
	WHERE TABLE_SCHEMA = @db_name
		AND TABLE_NAME = 'products'
		AND COLUMN_NAME = 'product_type'
);

SET @sql_add_column := IF(
	@col_exists = 0,
	'ALTER TABLE products ADD COLUMN product_type ENUM(''kiosk'',''cv'') NOT NULL DEFAULT ''kiosk'' AFTER description',
	'SELECT ''Column products.product_type already exists'' AS info'
);

PREPARE stmt_add_column FROM @sql_add_column;
EXECUTE stmt_add_column;
DEALLOCATE PREPARE stmt_add_column;

-- 2) Isi data lama supaya konsisten.
UPDATE products
SET product_type = 'kiosk'
WHERE product_type IS NULL OR product_type = '' OR product_type NOT IN ('kiosk', 'cv');

-- 3) Tambah index jika belum ada.
SET @idx_exists := (
	SELECT COUNT(*)
	FROM INFORMATION_SCHEMA.STATISTICS
	WHERE TABLE_SCHEMA = @db_name
		AND TABLE_NAME = 'products'
		AND INDEX_NAME = 'idx_products_product_type'
);

SET @sql_add_index := IF(
	@idx_exists = 0,
	'CREATE INDEX idx_products_product_type ON products (product_type)',
	'SELECT ''Index idx_products_product_type already exists'' AS info'
);

PREPARE stmt_add_index FROM @sql_add_index;
EXECUTE stmt_add_index;
DEALLOCATE PREPARE stmt_add_index;
