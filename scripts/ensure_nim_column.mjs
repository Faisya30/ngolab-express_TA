import { query } from '../apps/backend/config/db.js';

async function run() {
  try {
    console.log('Checking for nim column in users...');
    const rows = await query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'nim' AND table_schema = DATABASE()");
    if (rows.length) {
      console.log('nim column already exists:', rows.map(r => r.column_name).join(','));
      process.exit(0);
    }

    console.log('nim column not found — adding column...');
    await query("ALTER TABLE users ADD COLUMN nim VARCHAR(64) NULL");
    console.log('nim column added');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exit(2);
  }
}

run();
