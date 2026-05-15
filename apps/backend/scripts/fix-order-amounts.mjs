import { query } from '../config/db.js';

async function fixOrderAmounts() {
  try {
    console.log('Starting order amounts fix...\n');
    
    // Show orders before update
    console.log('--- ORDERS BEFORE UPDATE ---');
    const beforeOrders = await query('SELECT order_code, subtotal, discount, total FROM orders WHERE total > 100000 LIMIT 5');
    console.table(beforeOrders);
    
    // Update orders table
    console.log('\nUpdating orders table...');
    const ordersResult = await query('UPDATE orders SET subtotal = ROUND(subtotal / 100, 2), discount = ROUND(discount / 100, 2), total = ROUND(total / 100, 2) WHERE total > 100000');
    console.log(`✓ Updated ${ordersResult.affectedRows} orders`);
    
    // Show orders after update
    console.log('\n--- ORDERS AFTER UPDATE ---');
    const afterOrders = await query('SELECT order_code, subtotal, discount, total FROM orders ORDER BY created_at DESC LIMIT 5');
    console.table(afterOrders);
    
    // Update order_items table
    console.log('\nUpdating order_items table...');
    const itemsResult = await query('UPDATE order_items SET price_snapshot = ROUND(price_snapshot / 100, 2), subtotal = ROUND(subtotal / 100, 2) WHERE subtotal > 100000');
    console.log(`✓ Updated ${itemsResult.affectedRows} order items`);
    
    // Show order items after update
    console.log('\n--- ORDER ITEMS AFTER UPDATE ---');
    const afterItems = await query(`SELECT oi.id, o.order_code, oi.product_name_snapshot, oi.price_snapshot, oi.qty, oi.subtotal FROM order_items oi LEFT JOIN orders o ON oi.order_id = o.id LIMIT 5`);
    console.table(afterItems);
    
    console.log('\n✓ All order amounts fixed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing order amounts:', error);
    process.exit(1);
  }
}

fixOrderAmounts();
