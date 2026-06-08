-- Fix: Change image_url to LONGBLOB for storing larger base64 images
-- Run this if you get max_allowed_packet errors

ALTER TABLE products 
  MODIFY COLUMN image_url LONGBLOB NULL;

-- Alternative: If you want to keep LONGTEXT (up to 4GB)
-- ALTER TABLE products 
--   MODIFY COLUMN image_url LONGTEXT NULL;

-- To check current column structure:
-- SHOW COLUMNS FROM products LIKE 'image_url';

-- To check current max_allowed_packet:
-- SHOW VARIABLES LIKE 'max_allowed_packet';