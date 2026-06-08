-- Migration: Perbaiki struktur tabel products untuk kompatibilitas
-- Jalankan ini jika gambar tidak tersimpan atau muncul random

-- Pastikan image_url bisa menampung data besar
ALTER TABLE products 
  MODIFY COLUMN image_url LONGBLOB NULL;

-- Pastikan category_code ada (bukan category_id)
SET @hasCategoryCode := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'products' 
  AND COLUMN_NAME = 'category_code'
);

SET @sqlAddColumn := IF(
  @hasCategoryCode = 0,
  'ALTER TABLE products ADD COLUMN category_code VARCHAR(50) NULL AFTER name',
  'SELECT ''category_code already exists'' as info'
);

PREPARE stmt FROM @sqlAddColumn;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Migrasi data lama dari category_id ke category_code
UPDATE products p
JOIN categories c ON p.category_id = c.id
SET p.category_code = c.code
WHERE p.category_code IS NULL OR p.category_code = '';

-- Drop category_id lama jika ada
SET @hasCategoryId := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'products' 
  AND COLUMN_NAME = 'category_id'
);

SET @sqlDropCategoryId := IF(
  @hasCategoryId = 1,
  'ALTER TABLE products DROP COLUMN category_id',
  'SELECT ''no category_id column'' as info'
);

PREPARE stmt2 FROM @sqlDropCategoryId;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;