import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { query } from '../config/db.js';

dotenv.config();

const username = String(process.env.SEED_ADMIN_USERNAME || 'admin').trim();
const password = String(process.env.SEED_ADMIN_PASSWORD || '123');
const role = String(process.env.SEED_ADMIN_ROLE || 'Super Admin').trim();

if (!username || !password || !role) {
  console.error('SEED_ADMIN_USERNAME, SEED_ADMIN_PASSWORD, and SEED_ADMIN_ROLE must not be empty.');
  process.exit(1);
}

const existing = await query(
  `SELECT id, username, role
   FROM admins
   WHERE LOWER(username) = LOWER(?)
   LIMIT 1`,
  [username]
);

if (existing.length) {
  console.log(`admin already exists: ${existing[0].username} (${existing[0].role})`);
} else {
  const hash = await bcrypt.hash(password, 10);
  await query('INSERT INTO admins (username, password_hash, role) VALUES (?, ?, ?)', [username, hash, role]);
  console.log(`seeded admin: ${username}/${password} (${role})`);
}

const rows = await query('SELECT username, role FROM admins ORDER BY id ASC');
console.log(JSON.stringify(rows, null, 2));
