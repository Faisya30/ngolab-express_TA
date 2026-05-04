-- Migration: merge transactions/menu_items into orders/order_items/products
-- WARNING: Review on staging first. This script only prepares and runs safe INSERTs and backups.
-- Usage:
--   mysql -u DB_USER -p DB_NAME < apps/backend/sql/migration_merge_transactions.sql

SET @run_at = NOW();

-- 1) Backup original tables
DROP TABLE IF EXISTS menu_items_backup;
CREATE TABLE menu_items_backup LIKE menu_items;
INSERT INTO menu_items_backup SELECT * FROM menu_items;

DROP TABLE IF EXISTS transactions_backup;
CREATE TABLE transactions_backup LIKE transactions;
INSERT INTO transactions_backup SELECT * FROM transactions;

DROP TABLE IF EXISTS transaction_items_backup;
CREATE TABLE transaction_items_backup LIKE transaction_items;
INSERT INTO transaction_items_backup SELECT * FROM transaction_items;

-- 2) Migrate menu_items -> products
-- Only insert rows that don't already exist in products (by code)
-- Map basic columns: code, name, price, category -> category_code, is_active, created_at
-- Set product_type = 'kiosk' to mark origin
INSERT INTO products (code, name, price, category_code, is_active, product_type, created_at)
SELECT mi.code, mi.name, COALESCE(mi.price, 0), NULLIF(TRIM(mi.category), ''), COALESCE(mi.is_active, 1), 'kiosk', COALESCE(mi.created_at, @run_at)
FROM menu_items mi
LEFT JOIN products p ON p.code = mi.code
WHERE p.code IS NULL;

-- 3) Migrate transactions -> orders
-- Map: transaction_code -> order_code, transaction_type -> service_type, user_id -> member_code
-- Only insert if order_code not already present
INSERT INTO orders (order_code, service_type, subtotal, discount, total, payment_method, member_code, points_earned, points_used, created_at)
SELECT t.transaction_code, COALESCE(t.transaction_type, 'kiosk'), COALESCE(t.subtotal,0), COALESCE(t.discount,0), COALESCE(t.total,0), COALESCE(t.payment_method,'CASH'), NULLIF(TRIM(t.user_id),''), COALESCE(t.points_earned,0), COALESCE(t.points_used,0), COALESCE(t.created_at, @run_at)
FROM transactions t
LEFT JOIN orders o ON o.order_code = t.transaction_code
WHERE o.order_code IS NULL;

-- 4) Migrate transaction_items -> order_items
-- Map: transaction_code -> order_code, menu_item_code -> product_code
-- Only insert if identical row not present
INSERT INTO order_items (order_code, product_code, product_name_snapshot, price_snapshot, qty, subtotal)
SELECT ti.transaction_code, ti.menu_item_code, COALESCE(ti.item_name_snapshot, ''), COALESCE(ti.price_snapshot, 0), COALESCE(ti.qty, 1), COALESCE(ti.subtotal, 0)
FROM transaction_items ti
LEFT JOIN order_items oi ON (oi.order_code = ti.transaction_code AND oi.product_code = ti.menu_item_code AND oi.qty = ti.qty AND oi.subtotal = ti.subtotal)
WHERE oi.id IS NULL;

-- 5) Verification: counts and sample checks
SELECT 'menu_items_total' as what, COUNT(*) AS cnt FROM menu_items;
SELECT 'menu_items_backed' as what, COUNT(*) AS cnt FROM menu_items_backup;
SELECT 'new_products_total' as what, COUNT(*) AS cnt FROM products;

SELECT 'transactions_total' as what, COUNT(*) AS cnt FROM transactions;
SELECT 'transactions_backed' as what, COUNT(*) AS cnt FROM transactions_backup;
SELECT 'orders_total' as what, COUNT(*) AS cnt FROM orders;

SELECT 'transaction_items_total' as what, COUNT(*) AS cnt FROM transaction_items;
SELECT 'transaction_items_backed' as what, COUNT(*) AS cnt FROM transaction_items_backup;
SELECT 'order_items_total' as what, COUNT(*) AS cnt FROM order_items;

-- 6) Post-migration manual checks (run and inspect results above). If everything OK, you can drop duplicate tables.
-- Example DROP commands (execute only after manual verification):
-- DROP TABLE IF EXISTS transaction_items_backup; -- keep or move to archive
-- DROP TABLE IF EXISTS transactions_backup; -- keep or move to archive
-- DROP TABLE IF EXISTS menu_items_backup; -- keep or move to archive
-- DROP TABLE IF EXISTS transaction_items;
-- DROP TABLE IF EXISTS transactions;
-- DROP TABLE IF EXISTS menu_items;

-- 7) Notes / rollback
-- To rollback the data moves, you can restore from *_backup tables by INSERT ... SELECT back into original tables.
-- Restore example:
-- INSERT INTO menu_items SELECT * FROM menu_items_backup;

-- End of migration script
