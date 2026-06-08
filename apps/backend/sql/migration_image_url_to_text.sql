-- Fix: Convert image_url from BLOB to TEXT for storing file paths
ALTER TABLE products 
  MODIFY COLUMN image_url TEXT NULL;

-- Verify change
-- SHOW COLUMNS FROM products LIKE 'image_url';