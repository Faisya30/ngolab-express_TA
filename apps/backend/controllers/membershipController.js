import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { query, withTransaction } from '../config/db.js';

const BCRYPT_HASH_REGEX = /^\$2[aby]\$\d{2}\$/;

function normalizeText(value) {
  return String(value || '').trim();
}

function normalizeEmail(value) {
  return normalizeText(value).toLowerCase();
}

function generateUserId() {
  return `USR-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

function generateReferralCode() {
  return `REF-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

function buildPublicUser(row) {
  return {
    user_id: row.user_id,
    username: row.username,
    email: row.email,
    role: row.role,
    status: row.status,
    membership_level: row.membership_level,
    referred_by: row.referred_by,
    created_at: row.created_at,
    phone_number: row.phone_number,
    profile_picture: row.profile_picture,
    ktm_picture: row.ktm_picture,
    is_ktm: Boolean(row.is_ktm),
    ai_reasoning: row.ai_reasoning,
  };
}

async function resolveReferralUserId(input) {
  const raw = normalizeText(input);
  if (!raw) return null;

  const [directUser] = await query(
    `SELECT user_id FROM users WHERE user_id = ? LIMIT 1`,
    [raw]
  );
  if (directUser?.user_id) return String(directUser.user_id);

  const [affiliateRow] = await query(
    `SELECT user_id FROM affiliate_networks WHERE referral_code = ? LIMIT 1`,
    [raw]
  );

  return affiliateRow?.user_id ? String(affiliateRow.user_id) : null;
}

async function ensureUniqueReferralCode(connection) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const referralCode = generateReferralCode();
    const [rows] = await connection.query(
      `SELECT user_id FROM affiliate_networks WHERE referral_code = ? LIMIT 1`,
      [referralCode]
    );

    if (!rows.length) {
      return referralCode;
    }
  }

  throw new Error('Gagal membuat referral code unik.');
}

export async function register(req, res) {
  try {
    const body = req.body || {};
    const username = normalizeText(body.username);
    const email = normalizeEmail(body.email);
    const password = normalizeText(body.password);
    const profilePicture = normalizeText(body.profile_picture || body.photo_url || body.profilePicture);
    const ktmPicture = normalizeText(body.ktm_picture || body.ktm_url || body.ktmPicture);
    const referredByInput = normalizeText(body.referred_by || body.referral_code || body.referredBy);
    const phoneNumber = normalizeText(body.phone_number || body.phoneNumber || body.phone);

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'username, email, dan password wajib diisi.',
      });
    }

    const [existingUser] = await query(
      `SELECT user_id FROM users WHERE LOWER(email) = LOWER(?) OR LOWER(username) = LOWER(?) LIMIT 1`,
      [email, username]
    );

    if (existingUser?.user_id) {
      return res.status(409).json({
        success: false,
        error: 'Email atau username sudah terdaftar.',
      });
    }

    const referredBy = await resolveReferralUserId(referredByInput);
    const userId = generateUserId();
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await withTransaction(async (connection) => {
      await connection.query(
        `INSERT INTO users (
          user_id,
          username,
          email,
          password,
          role,
          status,
          membership_level,
          referred_by,
          phone_number,
          profile_picture,
          ktm_picture,
          is_ktm,
          ai_reasoning
        ) VALUES (?, ?, ?, ?, 'MEMBER', 'ACTIVE', 'Silver', ?, ?, ?, ?, 0, NULL)`,
        [
          userId,
          username,
          email,
          passwordHash,
          referredBy,
          phoneNumber || null,
          profilePicture || null,
          ktmPicture || null,
        ]
      );

      const referralCode = await ensureUniqueReferralCode(connection);
      await connection.query(
        `INSERT INTO affiliate_networks (
          user_id,
          referral_code,
          affiliate_tier,
          total_referrals
        ) VALUES (?, ?, 'Basic', 0)`,
        [userId, referralCode]
      );

      await connection.query(
        `INSERT INTO user_points (
          user_id,
          total_points,
          commission_points,
          mission_points,
          cashback_points,
          voucher_points
        ) VALUES (?, 0, 0, 0, 0, 0)`,
        [userId]
      );

      if (referredBy) {
        await connection.query(
          `UPDATE affiliate_networks
          SET total_referrals = total_referrals + 1
          WHERE user_id = ?`,
          [referredBy]
        );
      }

      return { userId, referralCode };
    });

    const createdRows = await query(
      `SELECT user_id, username, email, role, status, membership_level, referred_by, created_at, phone_number, profile_picture, ktm_picture, is_ktm, ai_reasoning
      FROM users
      WHERE user_id = ?
      LIMIT 1`,
      [result.userId]
    );

    return res.status(201).json({
      success: true,
      message: 'Registrasi berhasil.',
      data: {
        user: buildPublicUser(createdRows[0]),
        referral_code: result.referralCode,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function login(req, res) {
  try {
    const body = req.body || {};
    const identifier = normalizeText(body.username || body.email);
    const password = normalizeText(body.password);

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        error: 'username/email dan password wajib diisi.',
      });
    }
    const rows = await query(
      `SELECT user_id, username, email, password, role, status, membership_level, referred_by, created_at, phone_number, profile_picture, ktm_picture, is_ktm, ai_reasoning
      FROM users
      WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)
      LIMIT 1`,
      [identifier, identifier]
    );

    if (!rows.length) {
      return res.status(401).json({ success: false, error: 'Akun tidak ditemukan.' });
    }

    const user = rows[0];
    const storedPassword = String(user.password || '');
    const looksLikeBcrypt = BCRYPT_HASH_REGEX.test(storedPassword);
    let validPassword = false;

    if (looksLikeBcrypt) {
      validPassword = await bcrypt.compare(password, storedPassword);
    } else if (password === storedPassword) {
      validPassword = true;
      const migratedHash = await bcrypt.hash(password, 10);
      await query('UPDATE users SET password = ? WHERE user_id = ?', [migratedHash, user.user_id]);
      user.password = migratedHash;
    }

    if (!validPassword) {
      return res.status(401).json({ success: false, error: 'Password salah.' });
    }

    const affiliateRows = await query(
      `SELECT referral_code, affiliate_tier, total_referrals
      FROM affiliate_networks
      WHERE user_id = ?
      LIMIT 1`,
      [user.user_id]
    );

    const pointsRows = await query(
      `SELECT total_points, commission_points, mission_points, cashback_points, voucher_points
      FROM user_points
      WHERE user_id = ?
      LIMIT 1`,
      [user.user_id]
    );

    return res.json({
      success: true,
      message: 'Login berhasil.',
      data: {
        user: buildPublicUser(user),
        affiliate_network: affiliateRows[0] || null,
        points: pointsRows[0] || null,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function getUserProfile(_req, res) {
  try {
    const userId = normalizeText(_req.params?.user_id);
    if (!userId) {
      return res.status(400).json({ success: false, error: 'user_id wajib diisi.' });
    }

    const users = await query(
      `SELECT user_id, username, email, role, status, membership_level, referred_by, created_at, phone_number, profile_picture, ktm_picture, is_ktm, ai_reasoning
      FROM users
      WHERE user_id = ?
      LIMIT 1`,
      [userId]
    );

    if (!users.length) {
      return res.status(404).json({ success: false, error: 'User tidak ditemukan.' });
    }

    const affiliateRows = await query(
      `SELECT referral_code, affiliate_tier, total_referrals
      FROM affiliate_networks
      WHERE user_id = ?
      LIMIT 1`,
      [userId]
    );

    const pointsRows = await query(
      `SELECT total_points, commission_points, mission_points, cashback_points, voucher_points
      FROM user_points
      WHERE user_id = ?
      LIMIT 1`,
      [userId]
    );

    const insightRows = await query(
      `SELECT favorite_category, peak_visit_time, ai_recommendation
      FROM user_ai_insights
      WHERE user_id = ?
      ORDER BY id DESC
      LIMIT 1`,
      [userId]
    );

    return res.json({
      success: true,
      data: {
        user: buildPublicUser(users[0]),
        affiliate_network: affiliateRows[0] || null,
        points: pointsRows[0] || null,
        ai_insight: insightRows[0] || null,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function updateProfile(_req, res) {
  try {
    const userId = normalizeText(_req.params?.user_id);
    const body = _req.body || {};

    if (!userId) {
      return res.status(400).json({ success: false, error: 'user_id wajib diisi.' });
    }

    const existingRows = await query(
      `SELECT user_id, username, email, role, status, membership_level, referred_by, created_at, phone_number, profile_picture, ktm_picture, is_ktm, ai_reasoning
      FROM users
      WHERE user_id = ?
      LIMIT 1`,
      [userId]
    );

    if (!existingRows.length) {
      return res.status(404).json({ success: false, error: 'User tidak ditemukan.' });
    }

    const currentUser = existingRows[0];
    const nextUsername = normalizeText(body.username);
    const nextEmail = normalizeEmail(body.email);
    const nextPhoneNumber = normalizeText(body.phone_number ?? body.phoneNumber);
    const nextProfilePicture = normalizeText(body.profile_picture ?? body.photo_url ?? body.profilePicture);
    const nextKtmPicture = normalizeText(body.ktm_picture ?? body.ktm_url ?? body.ktmPicture);
    const nextAiReasoning = body.ai_reasoning ?? body.aiReasoning;

    if (nextUsername && nextUsername.toLowerCase() !== String(currentUser.username || '').toLowerCase()) {
      const duplicateUsername = await query(
        `SELECT user_id FROM users WHERE LOWER(username) = LOWER(?) AND user_id <> ? LIMIT 1`,
        [nextUsername, userId]
      );

      if (duplicateUsername.length) {
        return res.status(409).json({ success: false, error: 'Username sudah dipakai user lain.' });
      }
    }

    if (nextEmail && nextEmail.toLowerCase() !== String(currentUser.email || '').toLowerCase()) {
      const duplicateEmail = await query(
        `SELECT user_id FROM users WHERE LOWER(email) = LOWER(?) AND user_id <> ? LIMIT 1`,
        [nextEmail, userId]
      );

      if (duplicateEmail.length) {
        return res.status(409).json({ success: false, error: 'Email sudah dipakai user lain.' });
      }
    }

    const updateFields = [];
    const updateValues = [];

    if (nextUsername) {
      updateFields.push('username = ?');
      updateValues.push(nextUsername);
    }

    if (nextEmail) {
      updateFields.push('email = ?');
      updateValues.push(nextEmail);
    }

    if (nextPhoneNumber) {
      updateFields.push('phone_number = ?');
      updateValues.push(nextPhoneNumber);
    }

    if (body.profile_picture !== undefined || body.photo_url !== undefined || body.profilePicture !== undefined) {
      updateFields.push('profile_picture = ?');
      updateValues.push(nextProfilePicture || null);
    }

    if (body.ktm_picture !== undefined || body.ktm_url !== undefined || body.ktmPicture !== undefined) {
      updateFields.push('ktm_picture = ?');
      updateValues.push(nextKtmPicture || null);
    }

    if (body.ai_reasoning !== undefined || body.aiReasoning !== undefined) {
      updateFields.push('ai_reasoning = ?');
      updateValues.push(nextAiReasoning ?? null);
    }

    if (!updateFields.length) {
      return res.status(400).json({ success: false, error: 'Tidak ada field yang diupdate.' });
    }

    updateValues.push(userId);

    await query(
      `UPDATE users
      SET ${updateFields.join(', ')}
      WHERE user_id = ?`,
      updateValues
    );

    const updatedRows = await query(
      `SELECT user_id, username, email, role, status, membership_level, referred_by, created_at, phone_number, profile_picture, ktm_picture, is_ktm, ai_reasoning
      FROM users
      WHERE user_id = ?
      LIMIT 1`,
      [userId]
    );

    return res.json({
      success: true,
      message: 'Profil berhasil diperbarui.',
      data: {
        user: buildPublicUser(updatedRows[0]),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function verifyAffiliate(_req, res) {
  try {
    const body = _req.body || {};
    const userId = normalizeText(body.user_id || body.userId);
    const isKtm = body.is_ktm ?? body.isKtm ?? body.verified;
    const aiReasoning = body.ai_reasoning ?? body.aiReasoning;
    const ktmPicture = normalizeText(body.ktm_picture || body.ktm_url || body.ktmPicture);
    const affiliateTier = normalizeText(body.affiliate_tier || body.affiliateTier) || 'Basic';

    if (!userId) {
      return res.status(400).json({ success: false, error: 'user_id wajib diisi.' });
    }

    const existingRows = await query(
      `SELECT user_id, username, email, role, status, membership_level, referred_by, created_at, phone_number, profile_picture, ktm_picture, is_ktm, ai_reasoning
      FROM users
      WHERE user_id = ?
      LIMIT 1`,
      [userId]
    );

    if (!existingRows.length) {
      return res.status(404).json({ success: false, error: 'User tidak ditemukan.' });
    }

    const verified = Boolean(isKtm === true || isKtm === 1 || String(isKtm).toLowerCase() === 'true');

    const result = await withTransaction(async (connection) => {
      await connection.query(
        `UPDATE users
        SET is_ktm = ?,
            role = ?,
            ai_reasoning = ?,
            ktm_picture = COALESCE(?, ktm_picture)
        WHERE user_id = ?`,
        [
          verified ? 1 : 0,
          verified ? 'MEMBER_AFFILIATE' : 'MEMBER',
          aiReasoning ?? null,
          ktmPicture || null,
          userId,
        ]
      );

      const [affiliateRows] = await connection.query(
        `SELECT user_id, referral_code, affiliate_tier, total_referrals
        FROM affiliate_networks
        WHERE user_id = ?
        LIMIT 1`,
        [userId]
      );

      let referralCode = affiliateRows[0]?.referral_code || null;

      if (!affiliateRows.length) {
        referralCode = await ensureUniqueReferralCode(connection);
        await connection.query(
          `INSERT INTO affiliate_networks (
            user_id,
            referral_code,
            affiliate_tier,
            total_referrals
          ) VALUES (?, ?, ?, 0)`,
          [userId, referralCode, affiliateTier]
        );
      } else if (verified) {
        await connection.query(
          `UPDATE affiliate_networks
          SET affiliate_tier = ?
          WHERE user_id = ?`,
          [affiliateTier, userId]
        );
      }

      return { referralCode };
    });

    const updatedUserRows = await query(
      `SELECT user_id, username, email, role, status, membership_level, referred_by, created_at, phone_number, profile_picture, ktm_picture, is_ktm, ai_reasoning
      FROM users
      WHERE user_id = ?
      LIMIT 1`,
      [userId]
    );

    const updatedAffiliateRows = await query(
      `SELECT referral_code, affiliate_tier, total_referrals
      FROM affiliate_networks
      WHERE user_id = ?
      LIMIT 1`,
      [userId]
    );

    return res.json({
      success: true,
      message: verified ? 'Akun berhasil diverifikasi sebagai affiliate.' : 'Status verifikasi berhasil disimpan.',
      data: {
        user: buildPublicUser(updatedUserRows[0]),
        affiliate_network: updatedAffiliateRows[0] || null,
        referral_code: result.referralCode,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function getHubDataAdmin(_req, res) {
  try {
    const [memberCountRows] = await Promise.all([
      query(`SELECT COUNT(*) AS total_members FROM users`),
    ]);

    const [affiliateCountRows] = await Promise.all([
      query(`SELECT COUNT(*) AS total_affiliates FROM affiliate_networks`),
    ]);

    const settingsRows = await query(
      `SELECT setting_key, setting_value
      FROM global_settings
      ORDER BY setting_key ASC`
    );

    return res.json({
      success: true,
      data: {
        total_members: Number(memberCountRows?.[0]?.total_members || 0),
        total_affiliates: Number(affiliateCountRows?.[0]?.total_affiliates || 0),
        global_settings: settingsRows,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function getAllMembers(_req, res) {
  try {
    const rows = await query(
      `SELECT
        u.user_id,
        u.username,
        u.email,
        u.role,
        u.status,
        u.membership_level,
        u.referred_by,
        u.created_at,
        u.phone_number,
        u.profile_picture,
        u.ktm_picture,
        u.is_ktm,
        u.ai_reasoning,
        COALESCE(up.total_points, 0) AS total_points,
        COALESCE(up.commission_points, 0) AS commission_points,
        COALESCE(up.mission_points, 0) AS mission_points,
        COALESCE(up.cashback_points, 0) AS cashback_points,
        COALESCE(up.voucher_points, 0) AS voucher_points,
        an.referral_code,
        an.affiliate_tier,
        an.total_referrals
      FROM users u
      LEFT JOIN user_points up ON up.user_id = u.user_id
      LEFT JOIN affiliate_networks an ON an.user_id = u.user_id
      ORDER BY u.created_at DESC`
    );

    return res.json({
      success: true,
      data: rows.map((row) => ({
        ...buildPublicUser(row),
        total_points: Number(row.total_points || 0),
        commission_points: Number(row.commission_points || 0),
        mission_points: Number(row.mission_points || 0),
        cashback_points: Number(row.cashback_points || 0),
        voucher_points: Number(row.voucher_points || 0),
        referral_code: row.referral_code || null,
        affiliate_tier: row.affiliate_tier || null,
        total_referrals: Number(row.total_referrals || 0),
      })),
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function getAllAffiliates(_req, res) {
  try {
    const rows = await query(
      `SELECT
        an.user_id,
        an.referral_code,
        an.affiliate_tier,
        an.total_referrals,
        an.created_at,
        u.username,
        u.email,
        u.role,
        u.status,
        u.membership_level,
        u.phone_number,
        u.profile_picture,
        u.ktm_picture,
        u.is_ktm
      FROM affiliate_networks an
      INNER JOIN users u ON u.user_id = an.user_id
      ORDER BY an.created_at DESC`
    );

    return res.json({
      success: true,
      data: rows.map((row) => ({
        user_id: row.user_id,
        username: row.username,
        email: row.email,
        role: row.role,
        status: row.status,
        membership_level: row.membership_level,
        phone_number: row.phone_number,
        profile_picture: row.profile_picture,
        ktm_picture: row.ktm_picture,
        is_ktm: Boolean(row.is_ktm),
        referral_code: row.referral_code,
        affiliate_tier: row.affiliate_tier,
        total_referrals: Number(row.total_referrals || 0),
        created_at: row.created_at,
      })),
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function updateMemberStatus(_req, res) {
  try {
    const userId = normalizeText(_req.params?.user_id || _req.body?.user_id || _req.body?.userId);
    const status = normalizeText(_req.body?.status || _req.body?.member_status || _req.body?.memberStatus).toUpperCase();

    if (!userId || !status) {
      return res.status(400).json({ success: false, error: 'user_id dan status wajib diisi.' });
    }

    const allowedStatuses = new Set(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING']);
    if (!allowedStatuses.has(status)) {
      return res.status(400).json({ success: false, error: 'status tidak valid.' });
    }

    const rows = await query(
      `SELECT user_id FROM users WHERE user_id = ? LIMIT 1`,
      [userId]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'User tidak ditemukan.' });
    }

    await query(
      `UPDATE users
      SET status = ?
      WHERE user_id = ?`,
      [status, userId]
    );

    return res.json({
      success: true,
      message: 'Status member berhasil diperbarui.',
      data: {
        user_id: userId,
        status,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function updateUserRole(_req, res) {
  try {
    const userId = normalizeText(_req.params?.user_id || _req.body?.user_id || _req.body?.userId);
    const role = normalizeText(_req.body?.role || _req.body?.user_role || _req.body?.userRole).toUpperCase();

    if (!userId || !role) {
      return res.status(400).json({ success: false, error: 'user_id dan role wajib diisi.' });
    }

    const allowedRoles = new Set(['MEMBER', 'MEMBER_AFFILIATE']);
    if (!allowedRoles.has(role)) {
      return res.status(400).json({ success: false, error: 'role tidak valid.' });
    }

    const rows = await query(
      `SELECT user_id FROM users WHERE user_id = ? LIMIT 1`,
      [userId]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'User tidak ditemukan.' });
    }

    await query(
      `UPDATE users
      SET role = ?
      WHERE user_id = ?`,
      [role, userId]
    );

    return res.json({
      success: true,
      message: 'Role user berhasil diperbarui.',
      data: {
        user_id: userId,
        role,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function getGlobalSettings(_req, res) {
  try {
    const rows = await query(
      `SELECT setting_key, setting_value, description, updated_at
      FROM global_settings
      ORDER BY setting_key ASC`
    );

    return res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function updateGlobalSetting(_req, res) {
  try {
    const settingKey = normalizeText(_req.params?.setting_key || _req.body?.setting_key || _req.body?.settingKey);
    const body = _req.body || {};
    const settingValue = body.setting_value ?? body.settingValue;
    const description = body.description ?? null;

    if (!settingKey) {
      return res.status(400).json({ success: false, error: 'setting_key wajib diisi.' });
    }

    if (settingValue === undefined || settingValue === null || String(settingValue).trim() === '') {
      return res.status(400).json({ success: false, error: 'setting_value wajib diisi.' });
    }

    await query(
      `INSERT INTO global_settings (setting_key, setting_value, description)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE
        setting_value = VALUES(setting_value),
        description = VALUES(description),
        updated_at = CURRENT_TIMESTAMP`,
      [settingKey, String(settingValue), description]
    );

    const rows = await query(
      `SELECT setting_key, setting_value, description, updated_at
      FROM global_settings
      WHERE setting_key = ?
      LIMIT 1`,
      [settingKey]
    );

    return res.json({
      success: true,
      message: 'Global setting berhasil disimpan.',
      data: rows[0] || null,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function getCommissionLogs(_req, res) {
  try {
    const userId = normalizeText(_req.query?.user_id || _req.params?.user_id);
    const rows = await query(
      `SELECT
        cl.id,
        cl.created_at,
        cl.receiver_id,
        receiver.username AS receiver_username,
        cl.referred_user_id,
        referred.username AS referred_username,
        cl.earned_points
      FROM commission_logs cl
      LEFT JOIN users receiver ON receiver.user_id = cl.receiver_id
      LEFT JOIN users referred ON referred.user_id = cl.referred_user_id
      ${userId ? 'WHERE cl.receiver_id = ? OR cl.referred_user_id = ?' : ''}
      ORDER BY cl.created_at DESC`,
      userId ? [userId, userId] : []
    );

    return res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function redeemPoints(_req, res) {
  try {
    const body = _req.body || {};
    const userId = normalizeText(body.user_id || body.userId);
    const voucherCode = normalizeText(body.voucher_code || body.voucherCode);
    const pointsUsed = Number(body.points_used ?? body.pointsUsed ?? 0);
    const note = body.note ?? null;

    if (!userId || !voucherCode || !pointsUsed) {
      return res.status(400).json({
        success: false,
        error: 'user_id, voucher_code, dan points_used wajib diisi.',
      });
    }

    if (pointsUsed <= 0) {
      return res.status(400).json({ success: false, error: 'points_used harus lebih dari 0.' });
    }

    const userRows = await query(`SELECT user_id FROM users WHERE user_id = ? LIMIT 1`, [userId]);
    if (!userRows.length) {
      return res.status(404).json({ success: false, error: 'User tidak ditemukan.' });
    }

    const voucherRows = await query(
      `SELECT voucher_code, is_active, points_cost
      FROM vouchers
      WHERE voucher_code = ?
      LIMIT 1`,
      [voucherCode]
    );

    if (!voucherRows.length) {
      return res.status(404).json({ success: false, error: 'Voucher tidak ditemukan.' });
    }

    if (!Number(voucherRows[0].is_active)) {
      return res.status(400).json({ success: false, error: 'Voucher sedang tidak aktif.' });
    }

    if (Number(voucherRows[0].points_cost || 0) > 0 && pointsUsed < Number(voucherRows[0].points_cost || 0)) {
      return res.status(400).json({ success: false, error: 'Poin yang dipakai belum sesuai biaya voucher.' });
    }

    const result = await withTransaction(async (connection) => {
      const [pointRows] = await connection.query(
        `SELECT total_points, commission_points, mission_points, cashback_points, voucher_points
        FROM user_points
        WHERE user_id = ?
        LIMIT 1
        FOR UPDATE`,
        [userId]
      );

      if (!pointRows.length) {
        throw new Error('Data poin user tidak ditemukan.');
      }

      const currentPoints = Number(pointRows[0].total_points || 0);
      if (currentPoints < pointsUsed) {
        throw new Error('Poin user tidak mencukupi.');
      }

      const currentVoucherPoints = Number(pointRows[0].voucher_points || 0);
      const nextVoucherPoints = Math.max(currentVoucherPoints - pointsUsed, 0);
      const nextTotalPoints = currentPoints - pointsUsed;

      await connection.query(
        `UPDATE user_points
        SET total_points = ?,
            voucher_points = ?
        WHERE user_id = ?`,
        [nextTotalPoints, nextVoucherPoints, userId]
      );

      await connection.query(
        `INSERT INTO redemption_logs (
          user_id,
          voucher_code,
          points_used,
          status
        ) VALUES (?, ?, ?, 'COMPLETED')`,
        [userId, voucherCode, pointsUsed]
      );

      await connection.query(
        `INSERT INTO point_logs (
          user_id,
          point_type,
          points,
          reference_type,
          reference_id,
          note
        ) VALUES (?, 'voucher', ?, 'voucher', ?, ?)`,
        [userId, -pointsUsed, voucherCode, note || 'Redeem voucher']
      );

      return { nextTotalPoints };
    });

    return res.json({
      success: true,
      message: 'Redeem poin berhasil.',
      data: {
        user_id: userId,
        voucher_code: voucherCode,
        points_used: pointsUsed,
        remaining_points: result.nextTotalPoints,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function getPointLogs(_req, res) {
  try {
    const userId = normalizeText(_req.params?.user_id || _req.query?.user_id);
    if (!userId) {
      return res.status(400).json({ success: false, error: 'user_id wajib diisi.' });
    }

    const rows = await query(
      `SELECT
        id,
        user_id,
        point_type,
        points,
        reference_type,
        reference_id,
        note,
        created_at
      FROM point_logs
      WHERE user_id = ?
      ORDER BY created_at DESC`,
      [userId]
    );

    return res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function createTransaction(_req, res) {
  try {
    const body = _req.body || {};
    const transaction = body.transaction || body;
    const items = Array.isArray(body.items) ? body.items : Array.isArray(body.transaction_items) ? body.transaction_items : [];
    const transactionCode = normalizeText(transaction.transaction_code || transaction.transactionCode || `TRX-${Date.now()}`);
    const userId = normalizeText(transaction.user_id || transaction.userId);
    const transactionType = normalizeText(transaction.transaction_type || transaction.transactionType || 'manual').toLowerCase();
    const paymentMethod = normalizeText(transaction.payment_method || transaction.paymentMethod || 'CASH');
    const subtotal = Number(transaction.subtotal ?? 0);
    const discount = Number(transaction.discount ?? 0);
    const total = Number(transaction.total ?? Math.max(subtotal - discount, 0));
    const pointsEarned = Number(transaction.points_earned ?? transaction.pointsEarned ?? 0);
    const pointsUsed = Number(transaction.points_used ?? transaction.pointsUsed ?? 0);

    if (!transactionCode) {
      return res.status(400).json({ success: false, error: 'transaction_code wajib diisi.' });
    }

    const result = await withTransaction(async (connection) => {
      const [transactionRows] = await connection.query(
        `SELECT id FROM transactions WHERE transaction_code = ? LIMIT 1`,
        [transactionCode]
      );

      if (transactionRows.length) {
        throw new Error('Transaction code sudah digunakan.');
      }

      if (userId) {
        const [userRows] = await connection.query(`SELECT user_id FROM users WHERE user_id = ? LIMIT 1`, [userId]);
        if (!userRows.length) {
          throw new Error('User tidak ditemukan.');
        }
      }

      await connection.query(
        `INSERT INTO transactions (
          transaction_code,
          user_id,
          transaction_type,
          subtotal,
          discount,
          total,
          points_earned,
          points_used,
          payment_method
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          transactionCode,
          userId || null,
          transactionType,
          subtotal,
          discount,
          total,
          pointsEarned,
          pointsUsed,
          paymentMethod,
        ]
      );

      for (const item of items) {
        const itemCode = normalizeText(item.menu_item_code || item.code || item.item_code || item.product_code);
        const itemName = normalizeText(item.item_name_snapshot || item.name || item.product_name || 'Unknown Item');
        const price = Number(item.price_snapshot ?? item.price ?? 0);
        const qty = Number(item.qty ?? item.quantity ?? 1) || 1;
        const itemSubtotal = Number(item.subtotal ?? price * qty);

        if (!itemName) {
          throw new Error('Setiap item wajib punya nama.');
        }

        // ensure referenced menu_item_code exists, otherwise insert NULL to avoid FK failure
        let menuItemCodeToInsert = itemCode || null;
        if (menuItemCodeToInsert) {
          const [menuRows] = await connection.query(
            `SELECT code FROM menu_items WHERE code = ? LIMIT 1`,
            [menuItemCodeToInsert]
          );
          if (!menuRows.length) {
            menuItemCodeToInsert = null;
          }
        }

        await connection.query(
          `INSERT INTO transaction_items (
            transaction_code,
            menu_item_code,
            item_name_snapshot,
            price_snapshot,
            qty,
            subtotal
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [transactionCode, menuItemCodeToInsert, itemName, price, qty, itemSubtotal]
        );
      }

      if (userId && pointsEarned > 0) {
        await connection.query(
          `INSERT INTO point_logs (
            user_id,
            point_type,
            points,
            reference_type,
            reference_id,
            note
          ) VALUES (?, 'cashback', ?, 'transaction', ?, 'Points earned from transaction')`,
          [userId, pointsEarned, transactionCode]
        );

        await connection.query(
          `UPDATE user_points
          SET total_points = total_points + ?,
              cashback_points = cashback_points + ?
          WHERE user_id = ?`,
          [pointsEarned, pointsEarned, userId]
        );
      }

      return { transactionCode };
    });

    return res.status(201).json({
      success: true,
      message: 'Transaksi berhasil disimpan.',
      data: {
        transaction_code: result.transactionCode,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function getTransactionDetail(_req, res) {
  try {
    const transactionCode = normalizeText(_req.params?.transaction_code || _req.query?.transaction_code);
    if (!transactionCode) {
      return res.status(400).json({ success: false, error: 'transaction_code wajib diisi.' });
    }

    const transactionRows = await query(
      `SELECT
        id,
        transaction_code,
        user_id,
        transaction_type,
        subtotal,
        discount,
        total,
        points_earned,
        points_used,
        payment_method,
        created_at
      FROM transactions
      WHERE transaction_code = ?
      LIMIT 1`,
      [transactionCode]
    );

    if (!transactionRows.length) {
      return res.status(404).json({ success: false, error: 'Transaction tidak ditemukan.' });
    }

    const itemRows = await query(
      `SELECT
        id,
        transaction_code,
        menu_item_code,
        item_name_snapshot,
        price_snapshot,
        qty,
        subtotal
      FROM transaction_items
      WHERE transaction_code = ?
      ORDER BY id ASC`,
      [transactionCode]
    );

    return res.json({
      success: true,
      data: {
        transaction: transactionRows[0],
        items: itemRows,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function earnPoints(_req, res) {
  try {
    const body = _req.body || {};
    const userId = normalizeText(body.user_id || body.userId);
    const pointType = normalizeText(body.point_type || body.pointType || 'mission').toLowerCase();
    const points = Number(body.points ?? 0);
    const referenceType = normalizeText(body.reference_type || body.referenceType || null) || null;
    const referenceId = normalizeText(body.reference_id || body.referenceId || null) || null;
    const note = body.note ?? null;

    if (!userId || !points) {
      return res.status(400).json({ success: false, error: 'user_id dan points wajib diisi.' });
    }

    if (points <= 0) {
      return res.status(400).json({ success: false, error: 'points harus lebih dari 0.' });
    }

    const allowedPointTypes = new Set(['commission', 'mission', 'cashback', 'voucher']);
    if (!allowedPointTypes.has(pointType)) {
      return res.status(400).json({ success: false, error: 'point_type tidak valid.' });
    }

    const userRows = await query(`SELECT user_id FROM users WHERE user_id = ? LIMIT 1`, [userId]);
    if (!userRows.length) {
      return res.status(404).json({ success: false, error: 'User tidak ditemukan.' });
    }

    const result = await withTransaction(async (connection) => {
      const [pointRows] = await connection.query(
        `SELECT total_points, commission_points, mission_points, cashback_points, voucher_points
        FROM user_points
        WHERE user_id = ?
        LIMIT 1
        FOR UPDATE`,
        [userId]
      );

      if (!pointRows.length) {
        throw new Error('Data poin user tidak ditemukan.');
      }

      const current = pointRows[0];
      const nextCommission = Number(current.commission_points || 0) + (pointType === 'commission' ? points : 0);
      const nextMission = Number(current.mission_points || 0) + (pointType === 'mission' ? points : 0);
      const nextCashback = Number(current.cashback_points || 0) + (pointType === 'cashback' ? points : 0);
      const nextVoucher = Number(current.voucher_points || 0) + (pointType === 'voucher' ? points : 0);
      const nextTotal = Number(current.total_points || 0) + points;

      await connection.query(
        `UPDATE user_points
        SET total_points = ?,
            commission_points = ?,
            mission_points = ?,
            cashback_points = ?,
            voucher_points = ?
        WHERE user_id = ?`,
        [nextTotal, nextCommission, nextMission, nextCashback, nextVoucher, userId]
      );

      await connection.query(
        `INSERT INTO point_logs (
          user_id,
          point_type,
          points,
          reference_type,
          reference_id,
          note
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, pointType, points, referenceType, referenceId, note]
      );

      return { nextTotal };
    });

    return res.json({
      success: true,
      message: 'Poin berhasil ditambahkan.',
      data: {
        user_id: userId,
        point_type: pointType,
        points,
        total_points: result.nextTotal,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}