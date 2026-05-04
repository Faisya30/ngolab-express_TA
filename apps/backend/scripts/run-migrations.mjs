import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ngolab_express_system',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function runMigrations() {
  const conn = await pool.getConnection();
  
  try {
    console.log('Running migrations...\n');
    
    // Run migration_add_product_type.sql
    const migrationPath1 = path.join(process.cwd(), 'sql', 'migration_add_product_type.sql');
    const migrationSQL1 = fs.readFileSync(migrationPath1, 'utf8');
    
    console.log('> Running migration_add_product_type.sql');
    const statements1 = migrationSQL1.split(';').filter(s => s.trim());
    for (const statement of statements1) {
      if (statement.trim()) {
        try {
          await conn.query(statement);
          console.log('  ✓ Executed');
        } catch (err) {
          console.log('  ✗ Error:', err.message);
        }
      }
    }
    
    // Run migration_add_category_product_type.sql
    const migrationPath2 = path.join(process.cwd(), 'sql', 'migration_add_category_product_type.sql');
    const migrationSQL2 = fs.readFileSync(migrationPath2, 'utf8');
    
    console.log('\n> Running migration_add_category_product_type.sql');
    const statements2 = migrationSQL2.split(';').filter(s => s.trim());
    for (const statement of statements2) {
      if (statement.trim()) {
        try {
          await conn.query(statement);
          console.log('  ✓ Executed');
        } catch (err) {
          console.log('  ✗ Error:', err.message);
        }
      }
    }

    // Run migration_expand_image_storage.sql
    const migrationPath3 = path.join(process.cwd(), 'sql', 'migration_expand_image_storage.sql');
    const migrationSQL3 = fs.readFileSync(migrationPath3, 'utf8');

    console.log('\n> Running migration_expand_image_storage.sql');
    const statements3 = migrationSQL3.split(';').filter(s => s.trim());
    for (const statement of statements3) {
      if (statement.trim()) {
        try {
          await conn.query(statement);
          console.log('  ✓ Executed');
        } catch (err) {
          console.log('  ✗ Error:', err.message);
        }
      }
    }

    // Run migration_membership.sql
    const migrationPath4 = path.join(process.cwd(), 'sql', 'migration_membership.sql');
    const migrationSQL4 = fs.readFileSync(migrationPath4, 'utf8');

    console.log('\n> Running migration_membership.sql');
    const statements4 = migrationSQL4.split(';').filter(s => s.trim());
    for (const statement of statements4) {
      if (statement.trim()) {
        try {
          await conn.query(statement);
          console.log('  ✓ Executed');
        } catch (err) {
          console.log('  ✗ Error:', err.message);
        }
      }
    }
    
    console.log('\n✓ Migrations completed!');
    
    // Verify
    console.log('\n=== Verification ===');
    const [products] = await conn.query(`SHOW COLUMNS FROM products LIKE 'product_type'`);
    console.log('Products table has product_type:', products.length > 0 ? '✓ YES' : '✗ NO');
    
    const [categories] = await conn.query(`SHOW COLUMNS FROM categories LIKE 'product_type'`);
    console.log('Categories table has product_type:', categories.length > 0 ? '✓ YES' : '✗ NO');

    const [users] = await conn.query(`SHOW TABLES LIKE 'users'`);
    console.log('Membership users table exists:', users.length > 0 ? '✓ YES' : '✗ NO');
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    conn.release();
    await pool.end();
    process.exit(0);
  }
}

runMigrations();
