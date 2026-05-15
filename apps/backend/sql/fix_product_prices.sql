-- Fix product prices that are 100x too large
-- For example: 2500000 becomes 25000, 1999900 becomes 19999
-- This migration corrects prices that are stored incorrectly in the database

-- Backup before update (just for verification)
-- SELECT 'BACKUP' as action, code, name, price FROM products WHERE is_active = 1;

-- Bagi harga dengan 100 untuk produk dengan harga > 100.000
UPDATE products SET price = ROUND(price / 100, 2) WHERE price > 100000;

-- Verifikasi hasilnya
SELECT code, name, price FROM products WHERE is_active = 1 ORDER BY name;
