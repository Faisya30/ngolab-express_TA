import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(path.join(process.cwd(), 'apps', 'backend', '.env'));
dotenv.config({ path: envPath });

import { query } from '../config/db.js';

async function makeSuper() {
  try {
    const rows = await query(`SELECT id, username, role FROM admins WHERE LOWER(username) = 'admin' LIMIT 1`);
    if (!rows || rows.length === 0) {
      console.error('No admin user found with username "admin"');
      process.exit(1);
    }

    const admin = rows[0];
    console.log('Found admin:', admin);

    if (String(admin.role).toLowerCase() === 'super_admin') {
      console.log('User is already super_admin. No change needed.');
      process.exit(0);
    }

    await query(`UPDATE admins SET role = ? WHERE id = ?`, ['super_admin', admin.id]);
    console.log('Updated admin role to super_admin');
    process.exit(0);
  } catch (err) {
    console.error('Error updating admin role:', err.message || err);
    process.exit(2);
  }
}

makeSuper();
