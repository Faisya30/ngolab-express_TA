import dotenv from 'dotenv';
import { query } from '../config/db.js';

dotenv.config();

async function run() {
  try {
    const users = await query("SHOW TABLES LIKE 'users'");
    console.log('users table exists:', users.length > 0);

    const tables = await query("SHOW TABLES");
    console.log('Tables count:', tables.length);
    const tableNames = tables.map(t => Object.values(t)[0]);
    console.log('Some tables:', tableNames.slice(0, 20).join(', '));
  } catch (err) {
    console.error('DB check error:', err.message || err);
    process.exit(1);
  }
}

run().then(() => process.exit(0));
