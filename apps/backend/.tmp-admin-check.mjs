import bcrypt from 'bcryptjs';
import { query } from './src/db/mysql.js';

const countRows = await query('SELECT COUNT(*) AS total FROM admins');
const total = Number(countRows[0]?.total || 0);
if (total === 0) {
  const hash = await bcrypt.hash('123', 10);
  await query('INSERT INTO admins (username, password_hash, role) VALUES (?, ?, ?)', ['admin', hash, 'Super Admin']);
  console.log('seeded admin: admin/123');
} else {
  console.log('admins already exist:', total);
}

const rows = await query('SELECT username, role FROM admins ORDER BY id ASC');
console.log(JSON.stringify(rows));
