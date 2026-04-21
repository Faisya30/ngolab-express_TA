import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db/mysql.js';

const router = Router();
const BCRYPT_HASH_REGEX = /^\$2[aby]\$\d{2}\$/;

router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Username and password are required' });
  }

  try {
    const rows = await query(
      `SELECT id, username, password_hash, role
      FROM admins
      WHERE LOWER(username) = LOWER(?)
      LIMIT 1`,
      [String(username)]
    );

    if (!rows.length) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const admin = rows[0];
    const hash = String(admin.password_hash || '');
    const looksLikeBcrypt = BCRYPT_HASH_REGEX.test(hash);
    let validPassword = false;

    if (looksLikeBcrypt) {
      validPassword = await bcrypt.compare(String(password), hash);
    } else if (String(password) === hash) {
      validPassword = true;
      // Migrate legacy plain password to bcrypt hash on successful login.
      const migratedHash = await bcrypt.hash(String(password), 10);
      await query('UPDATE admins SET password_hash = ? WHERE id = ?', [migratedHash, admin.id]);
    }

    if (validPassword) {
      return res.json({
        success: true,
        user: { username: admin.username, role: admin.role || 'Super Admin' },
      });
    }

    return res.status(401).json({ success: false, error: 'Invalid credentials' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/change-password', async (req, res) => {
  const { username, currentPassword, newPassword } = req.body || {};
  if (!username || !currentPassword || !newPassword) {
    return res.status(400).json({ success: false, error: 'Username, currentPassword, and newPassword are required' });
  }

  if (String(newPassword).length < 3) {
    return res.status(400).json({ success: false, error: 'New password must be at least 3 characters' });
  }

  try {
    const rows = await query(
      `SELECT id, username, password_hash
      FROM admins
      WHERE LOWER(username) = LOWER(?)
      LIMIT 1`,
      [String(username)]
    );

    if (!rows.length) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const admin = rows[0];
    const hash = String(admin.password_hash || '');
    const looksLikeBcrypt = BCRYPT_HASH_REGEX.test(hash);
    const passwordMatched = looksLikeBcrypt
      ? await bcrypt.compare(String(currentPassword), hash)
      : String(currentPassword) === hash;

    if (!passwordMatched) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect' });
    }

    const newHash = await bcrypt.hash(String(newPassword), 10);
    await query('UPDATE admins SET password_hash = ? WHERE id = ?', [newHash, admin.id]);

    return res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
