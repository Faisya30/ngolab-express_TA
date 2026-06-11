import { query } from './config/db.js';
import bcrypt from 'bcryptjs';

try {
  // Check if kiosk_admin account exists
  let existing = await query(
    'SELECT id, username, role FROM admins WHERE username = ? LIMIT 1',
    ['kiosk_admin']
  );

  if (!existing || existing.length === 0) {
    const hashedPassword = await bcrypt.hash('kiosk123', 10);
    await query(
      'INSERT INTO admins (username, password_hash, role, created_at) VALUES (?, ?, ?, NOW())',
      ['kiosk_admin', hashedPassword, 'kiosk_admin']
    );
    console.log('✓ Account kiosk_admin created');
  } else {
    console.log('✓ Account kiosk_admin already exists');
  }

  // Check if cv_admin account exists
  existing = await query(
    'SELECT id, username, role FROM admins WHERE username = ? LIMIT 1',
    ['cv_admin']
  );

  if (!existing || existing.length === 0) {
    const hashedPassword = await bcrypt.hash('cv_admin', 10);
    await query(
      'INSERT INTO admins (username, password_hash, role, created_at) VALUES (?, ?, ?, NOW())',
      ['cv_admin', hashedPassword, 'cv_admin']
    );
    console.log('✓ Account cv_admin created');
  } else {
    console.log('✓ Account cv_admin already exists');
  }

  console.log('\n=== ADMIN ACCOUNTS ===');
  console.log('Kiosk Admin: kiosk_admin / kiosk123');
  console.log('CV Admin: cv_admin / cv_admin');
  
  process.exit(0);
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
}
