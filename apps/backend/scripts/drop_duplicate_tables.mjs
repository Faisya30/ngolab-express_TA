import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import path from 'path';
import readline from 'readline';

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

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.toLowerCase());
    });
  });
}

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                  DROP DUPLICATE TABLES                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\nTarget database: ${DB_USER}@${DB_HOST}:${DB_PORT} → ${DB_NAME}`);
  console.log('\nTables to DROP:');
  console.log('  1. menu_items');
  console.log('  2. transactions');
  console.log('  3. transaction_items');
  console.log('\nBackups already created:');
  console.log('  - menu_items_backup');
  console.log('  - transactions_backup');
  console.log('  - transaction_items_backup');
  console.log('\n⚠️  WARNING: This action cannot be undone without restoring from backup!');

  const proceed = await askQuestion('\nProceed with DROP? (yes/no): ');
  if (proceed !== 'yes' && proceed !== 'y') {
    console.log('Cancelled by user.');
    rl.close();
    process.exit(0);
  }

  const conn = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
  });

  try {
    console.log('\n=== Dropping duplicate tables ===');

    // Drop with FK checks temporarily disabled
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');

    await conn.query('DROP TABLE IF EXISTS transaction_items');
    console.log('✓ Dropped transaction_items');

    await conn.query('DROP TABLE IF EXISTS transactions');
    console.log('✓ Dropped transactions');

    await conn.query('DROP TABLE IF EXISTS menu_items');
    console.log('✓ Dropped menu_items');

    await conn.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('\n=== Verification: Remaining tables ===');
    const [tables] = await conn.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME NOT LIKE '%_backup'
      ORDER BY TABLE_NAME
    `, [DB_NAME]);

    console.log('\nExisting tables (excluding backups):');
    tables.forEach(t => console.log(`  - ${t.TABLE_NAME}`));

    console.log('\n✅ DUPLICATE TABLES SUCCESSFULLY DROPPED');
    console.log('\nBackups preserved:');
    console.log('  - menu_items_backup');
    console.log('  - transactions_backup');
    console.log('  - transaction_items_backup');
    console.log('\nYou can drop backups later when confident.');

    await conn.end();
  } catch (err) {
    console.error('\n❌ FAILED:', err.message);
    try {
      await conn.end();
    } catch (e) {
      // ignore
    }
    process.exit(1);
  }

  rl.close();
}

main();
