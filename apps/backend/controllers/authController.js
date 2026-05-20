import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';

const BCRYPT_HASH_REGEX = /^\$2[aby]\$\d{2}\$/;

function normalizeRole(rawRole) {
	const role = String(rawRole || '').trim().toLowerCase();

	if (role === 'super admin' || role === 'super_admin' || role === 'admin') {
		return 'super_admin';
	}

	if (role === 'kiosk admin' || role === 'kiosk_admin' || role === 'kiosk') {
		return 'kiosk_admin';
	}

	if (role === 'cv admin' || role === 'cv_admin' || role === 'cv') {
		return 'cv_admin';
	}

	return role || 'super_admin';
}

export async function login(req, res) {
	const { username, password } = req.body || {};
	console.log('[LOGIN] Body:', { username, password, bodyFull: req.body });
	if (!username || !password) {
		return res.status(400).json({ success: false, error: 'Username and password are required' });
	}

	try {
		console.log('[LOGIN] Querying for user:', username);
		const rows = await query(
			`SELECT id, username, password_hash, role
			FROM admins
			WHERE LOWER(username) = LOWER(?)
			LIMIT 1`,
			[String(username)]
		);

		console.log('[LOGIN] Query result:', rows.length, 'rows');
		if (!rows.length) {
			return res.status(401).json({ success: false, error: 'Invalid credentials' });
		}

		const admin = rows[0];
		const hash = String(admin.password_hash || '');
		const looksLikeBcrypt = BCRYPT_HASH_REGEX.test(hash);
		console.log('[LOGIN] Hash format:', looksLikeBcrypt ? 'bcrypt' : 'plaintext');
		let validPassword = false;

		if (looksLikeBcrypt) {
			console.log('[LOGIN] Comparing bcrypt...');
			validPassword = await bcrypt.compare(String(password), hash);
		} else if (String(password) === hash) {
			validPassword = true;
			const migratedHash = await bcrypt.hash(String(password), 10);
			await query('UPDATE admins SET password_hash = ? WHERE id = ?', [migratedHash, admin.id]);
		}

		console.log('[LOGIN] Password valid:', validPassword);
		if (validPassword) {
			return res.json({
				success: true,
				user: { username: admin.username, role: normalizeRole(admin.role) },
			});
		}

		return res.status(401).json({ success: false, error: 'Invalid credentials' });
	} catch (error) {
		console.error('[LOGIN] Error:', error);
		return res.status(500).json({ success: false, error: error.message });
	}
}

export async function changePassword(req, res) {
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
}
