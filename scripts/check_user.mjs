import { query } from '../apps/backend/config/db.js';

async function run() {
  try {
    const email = 'qa_nim_script+123@example.com';
    console.log('Checking user by email:', email);
    const rows = await query(
      `SELECT user_id, email, nim, created_at FROM users WHERE email = ? ORDER BY created_at DESC LIMIT 5`,
      [email]
    );
    console.log('Rows:', JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Error querying DB:', err && err.stack ? err.stack : err);
    process.exit(2);
  }
}

run();
