import { query } from './config/db.js';

try {
  const rows = await query(
    'SELECT id, name, category_id, product_type, price FROM products WHERE is_active = 1 ORDER BY name'
  );
  
  console.log('\n=== ACTIVE PRODUCTS ===\n');
  rows.forEach(p => {
    console.log(`ID: ${p.id}`);
    console.log(`Name: ${p.name}`);
    console.log(`Category ID: ${p.category_id || 'NULL'}`);
    console.log(`Product Type: ${p.product_type || 'NULL'}`);
    console.log(`Price: ${p.price}`);
    console.log('---');
  });
  
  process.exit(0);
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
}
