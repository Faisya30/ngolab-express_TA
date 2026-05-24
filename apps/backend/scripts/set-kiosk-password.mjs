import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';

try {
  const newPass = 'kiosk123';
  const hash = await bcrypt.hash(newPass, 10);
  const res = await query('UPDATE admins SET password_hash = ? WHERE LOWER(username) = LOWER(?)', [hash, 'kiosk_admin']);
  console.log('Updated kiosk_admin password hash.');
  process.exit(0);
} catch (err) {
  console.error('Error updating password:', err.message);
  process.exit(1);
}
