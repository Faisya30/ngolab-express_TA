import { query } from './config/db.js';

const userId = 'USR-1779682378224-8DCA21';
const transactions = await query(
  `SELECT
    o.id AS order_id,
    o.user_id,
    o.order_code,
    o.total,
    o.created_at,
    oi.product_name_snapshot,
    oi.qty,
    oi.subtotal AS item_subtotal
  FROM orders o
  LEFT JOIN order_items oi ON oi.order_id = o.id
  WHERE o.user_id = ?
  ORDER BY o.created_at DESC`,
  [userId]
);
console.log('Jumlah transaksi:', transactions.length);
console.log(JSON.stringify(transactions, null, 2));
