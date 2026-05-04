import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import path from 'path';

const envPath = path.resolve(process.cwd(), 'apps/backend/.env');
dotenv.config({ path: envPath });

const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306;
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME;

if (!DB_NAME) {
  console.error('DB_NAME not set in apps/backend/.env. Aborting.');
  process.exit(1);
}

console.log(`Connecting to ${DB_USER}@${DB_HOST}:${DB_PORT} -> ${DB_NAME}`);
const conn = await mysql.createConnection({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  multipleStatements: true,
});

try {
  // 1) Backup original tables
  console.log('\n=== STEP 1: Creating backups ===');
  await conn.query('DROP TABLE IF EXISTS menu_items_backup');
  await conn.query('CREATE TABLE menu_items_backup LIKE menu_items');
  await conn.query('INSERT INTO menu_items_backup SELECT * FROM menu_items');
  console.log('✓ Backed up menu_items');

  await conn.query('DROP TABLE IF EXISTS transactions_backup');
  await conn.query('CREATE TABLE transactions_backup LIKE transactions');
  await conn.query('INSERT INTO transactions_backup SELECT * FROM transactions');
  console.log('✓ Backed up transactions');

  await conn.query('DROP TABLE IF EXISTS transaction_items_backup');
  await conn.query('CREATE TABLE transaction_items_backup LIKE transaction_items');
  await conn.query('INSERT INTO transaction_items_backup SELECT * FROM transaction_items');
  console.log('✓ Backed up transaction_items');

  // 2) Migrate menu_items -> products
  console.log('\n=== STEP 2: Migrating menu_items → products ===');
  const [miResult] = await conn.query(`INSERT INTO products (code, name, price, category_id, is_active, product_type, created_at)
    SELECT mi.code, mi.name, COALESCE(mi.price,0), c.id, COALESCE(mi.is_active,1), 'kiosk', COALESCE(mi.created_at, NOW())
    FROM menu_items mi
    LEFT JOIN products p ON p.code = mi.code
    LEFT JOIN categories c ON c.code = mi.category OR LOWER(c.name) = LOWER(mi.category)
    WHERE p.code IS NULL`);
  console.log(`✓ Inserted ${miResult.affectedRows} products from menu_items`);

  // 3) Migrate transactions -> orders
  console.log('\n=== STEP 3: Migrating transactions → orders ===');
  const [txResult] = await conn.query(`INSERT INTO orders (order_code, service_type, subtotal, discount, total, payment_method, points_earned, points_used, created_at)
    SELECT t.transaction_code, COALESCE(t.transaction_type,'kiosk'), COALESCE(t.subtotal,0), COALESCE(t.discount,0), COALESCE(t.total,0), COALESCE(t.payment_method,'CASH'), COALESCE(t.points_earned,0), COALESCE(t.points_used,0), COALESCE(t.created_at,NOW())
    FROM transactions t
    LEFT JOIN orders o ON o.order_code = t.transaction_code
    WHERE o.order_code IS NULL`);
  console.log(`✓ Inserted ${txResult.affectedRows} orders from transactions`);

  // 4) Migrate transaction_items -> order_items
  console.log('\n=== STEP 4: Migrating transaction_items → order_items ===');
  const [tiResult] = await conn.query(`INSERT INTO order_items (order_id, product_id, product_name_snapshot, price_snapshot, qty, subtotal)
    SELECT o.id AS order_id, p.id AS product_id, COALESCE(ti.item_name_snapshot,''), COALESCE(ti.price_snapshot,0), COALESCE(ti.qty,1), COALESCE(ti.subtotal,0)
    FROM transaction_items ti
    LEFT JOIN orders o ON o.order_code = ti.transaction_code
    LEFT JOIN products p ON p.code = ti.menu_item_code
    LEFT JOIN order_items oi ON oi.order_id = o.id AND oi.product_id = p.id AND oi.qty = ti.qty AND oi.subtotal = ti.subtotal
    WHERE o.id IS NOT NULL AND p.id IS NOT NULL AND oi.id IS NULL`);
  console.log(`✓ Inserted ${tiResult.affectedRows} order_items from transaction_items`);


  // 5) Verification queries
  console.log('\n=== STEP 5: Verifying counts ===');
  const checks = [
    `SELECT 'menu_items' as tbl, COUNT(*) AS cnt FROM menu_items`,
    `SELECT 'menu_items_backup' as tbl, COUNT(*) AS cnt FROM menu_items_backup`,
    `SELECT 'products' as tbl, COUNT(*) AS cnt FROM products`,
    `SELECT 'transactions' as tbl, COUNT(*) AS cnt FROM transactions`,
    `SELECT 'transactions_backup' as tbl, COUNT(*) AS cnt FROM transactions_backup`,
    `SELECT 'orders' as tbl, COUNT(*) AS cnt FROM orders`,
    `SELECT 'transaction_items' as tbl, COUNT(*) AS cnt FROM transaction_items`,
    `SELECT 'transaction_items_backup' as tbl, COUNT(*) AS cnt FROM transaction_items_backup`,
    `SELECT 'order_items' as tbl, COUNT(*) AS cnt FROM order_items`,
  ];

  for (const q of checks) {
    try {
      const [rows] = await conn.query(q);
      console.log(`${rows[0].tbl.padEnd(25)} ${rows[0].cnt}`);
    } catch (err) {
      console.warn(`Error querying ${q}:`, err.message);
    }
  }

  console.log('\n=== MIGRATION COMPLETE ===');
  console.log('Backups created: menu_items_backup, transactions_backup, transaction_items_backup');
  console.log('\nIf counts look good, next step is to DROP the 3 duplicate tables.');
  await conn.end();
} catch (err) {
  console.error('\n❌ Migration FAILED:', err.message);
  try {
    await conn.end();
  } catch (e) {
    // ignore
  }
  process.exit(1);
}
