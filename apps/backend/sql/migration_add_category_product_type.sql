-- Migration: tambah scope product_type pada categories agar retail hanya tampil untuk CV.
-- Aman dijalankan berulang (idempotent).

SET @db_name := DATABASE();

-- 1) Tambah kolom product_type jika belum ada.
SET @col_exists := (
	SELECT COUNT(*)
	FROM INFORMATION_SCHEMA.COLUMNS
	WHERE TABLE_SCHEMA = @db_name
		AND TABLE_NAME = 'categories'
		AND COLUMN_NAME = 'product_type'
);

SET @sql_add_column := IF(
	@col_exists = 0,
	'ALTER TABLE categories ADD COLUMN product_type ENUM(''kiosk'',''cv'',''all'') NOT NULL DEFAULT ''all'' AFTER name',
	'SELECT ''Column categories.product_type already exists'' AS info'
);

PREPARE stmt_add_column FROM @sql_add_column;
EXECUTE stmt_add_column;
DEALLOCATE PREPARE stmt_add_column;

-- 2) Normalisasi data lama agar punya scope yang jelas.
UPDATE categories
SET product_type = CASE
	WHEN code IN ('recommended', 'all') THEN 'all'
	WHEN code = 'retail' THEN 'cv'
	ELSE 'kiosk'
END
WHERE product_type IS NULL OR product_type = '' OR product_type NOT IN ('kiosk', 'cv', 'all');

UPDATE categories
SET product_type = CASE
	WHEN code IN ('recommended', 'all') THEN 'all'
	WHEN code = 'retail' THEN 'cv'
	ELSE product_type
END;

-- 3) Tambah kategori retail jika belum ada.
INSERT IGNORE INTO categories (code, name, product_type, is_active)
VALUES ('retail', 'Retail', 'cv', 1);
