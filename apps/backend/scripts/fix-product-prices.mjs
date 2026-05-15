import { query } from '../config/db.js';

async function fixProductPrices() {
  try {
    console.log('Starting product price fix...');
    
    // Show prices before update
    console.log('\n--- BEFORE UPDATE ---');
    const beforeRows = await query('SELECT code, name, price FROM products WHERE is_active = 1 AND price > 100000 ORDER BY name LIMIT 5');
    console.table(beforeRows);
    
    // Update prices
    console.log('\nExecuting UPDATE query...');
    const result = await query('UPDATE products SET price = ROUND(price / 100, 2) WHERE price > 100000');
    console.log(`✓ Updated ${result.affectedRows} products`);
    
    // Show prices after update
    console.log('\n--- AFTER UPDATE ---');
    const afterRows = await query('SELECT code, name, price FROM products WHERE is_active = 1 ORDER BY name LIMIT 10');
    console.table(afterRows);
    
    console.log('\n✓ Product prices fixed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing prices:', error);
    process.exit(1);
  }
}

fixProductPrices();
