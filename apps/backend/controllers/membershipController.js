import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { query, withTransaction } from '../config/db.js';
import { createMembershipToken } from '../config/jwt.js';

const tableColumnsCache = new Map();

async function getTableColumns(tableName) {
  if (tableColumnsCache.has(tableName)) {
    return tableColumnsCache.get(tableName);
  }

  const rows = await query(`SHOW COLUMNS FROM ${tableName}`);
  const cols = new Set(rows.map((row) => String(row.Field)));
  tableColumnsCache.set(tableName, cols);
  return cols;
}

async function hasColumn(tableName, columnName) {
  const cols = await getTableColumns(tableName);
  return cols.has(columnName);
}

const AFFILIATE_REFERRAL_BONUS_BASIC = Number(process.env.AFFILIATE_REFERRAL_BONUS_BASIC || 5000);
const AFFILIATE_REFERRAL_BONUS_STARTER = Number(process.env.AFFILIATE_REFERRAL_BONUS_STARTER || 5000);
const AFFILIATE_REFERRAL_BONUS_PRO = Number(process.env.AFFILIATE_REFERRAL_BONUS_PRO || 10000);
const AFFILIATE_REFERRAL_BONUS_ELITE = Number(process.env.AFFILIATE_REFERRAL_BONUS_ELITE || 15000);
const AFFILIATE_COMMISSION_RATE_BASIC = Number(process.env.AFFILIATE_COMMISSION_RATE_BASIC || 0);
const AFFILIATE_COMMISSION_RATE_STARTER = Number(process.env.AFFILIATE_COMMISSION_RATE_STARTER || 0.02);
const AFFILIATE_COMMISSION_RATE_PRO = Number(process.env.AFFILIATE_COMMISSION_RATE_PRO || 0.05);
const AFFILIATE_COMMISSION_RATE_ELITE = Number(process.env.AFFILIATE_COMMISSION_RATE_ELITE || 0.08);

const BCRYPT_HASH_REGEX = /^\$2[aby]\$\d{2}\$/;

function normalizeText(value) {
  return String(value || '').trim();
}

function normalizeNim(value) {
  return normalizeText(value).replace(/\s+/g, '');
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeAffiliateTier(value) {
  const normalized = normalizeText(value).toLowerCase();
  if (normalized === 'elite') return 'Elite';
  if (normalized === 'pro') return 'Pro';
  if (normalized === 'starter') return 'Starter';
  return 'Basic';
}

function resolveAffiliateTierByReferrals(totalReferrals) {
  const referrals = Number(totalReferrals || 0);

  if (referrals >= 30) {
    return {
      affiliate_tier: 'Elite',
      level: 'Elite',
      commission_rate: AFFILIATE_COMMISSION_RATE_ELITE,
      referral_bonus: AFFILIATE_REFERRAL_BONUS_ELITE,
    };
  }

  if (referrals >= 20) {
    return {
      affiliate_tier: 'Pro',
      level: 'Pro',
      commission_rate: AFFILIATE_COMMISSION_RATE_PRO,
      referral_bonus: AFFILIATE_REFERRAL_BONUS_PRO,
    };
  }

  if (referrals >= 10) {
    return {
      affiliate_tier: 'Starter',
      level: 'Starter',
      commission_rate: AFFILIATE_COMMISSION_RATE_STARTER,
      referral_bonus: AFFILIATE_REFERRAL_BONUS_STARTER,
    };
  }

  return {
    affiliate_tier: 'Basic',
    level: 'Basic',
    commission_rate: AFFILIATE_COMMISSION_RATE_BASIC,
    referral_bonus: AFFILIATE_REFERRAL_BONUS_BASIC,
  };
}

function buildAffiliateNetwork(row) {
  if (!row) return null;

  const normalizedTier = normalizeAffiliateTier(row.affiliate_tier || row.level || 'Basic');
  const normalizedByReferrals = resolveAffiliateTierByReferrals(row.total_referrals || row.total_downlines || 0);

  return {
    referralCode: row.referral_code || null,
    affiliateId: row.affiliate_id || null,
    affiliateTier: normalizedTier,
    affiliateLevel: normalizedTier,
    level: normalizedTier,
    totalReferrals: Number(row.total_referrals || 0),
    totalDownlines: Number(row.total_downlines || 0),
    commissionPoints: Number(row.commission_points || 0),
    totalPoints: Number(row.total_points || 0),
    commissionRate: Number(row.commission_rate ?? normalizedByReferrals.commission_rate),
    referral_code: row.referral_code || null,
    affiliate_id: row.affiliate_id || null,
    affiliate_tier: normalizedTier,
    total_referrals: Number(row.total_referrals || 0),
    total_downlines: Number(row.total_downlines || 0),
    commission_points: Number(row.commission_points || 0),
    total_points: Number(row.total_points || 0),
    commission_rate: Number(row.commission_rate ?? normalizedByReferrals.commission_rate),
  };
}

function buildAffiliateNetworkSummary(row) {
  if (!row) return null;

  const network = buildAffiliateNetwork(row);

  return {
    totalDownlines: Number(network.totalDownlines || 0),
    totalCommission: Number(network.commissionPoints || 0),
    totalPoints: Number(network.totalPoints || 0),
    affiliateLevel: network.affiliateTier,
    referralCode: network.referralCode,
    affiliateId: network.affiliateId,
    totalReferrals: Number(network.totalReferrals || 0),
  };
}

function isUnknownColumnError(error) {
  const message = String(error?.message || '').toLowerCase();
  return message.includes('unknown column') || message.includes('doesn\'t exist');
}

async function fetchAffiliateNetworkRow(userId) {
  const fullSelect = `SELECT
        an.user_id,
        an.affiliate_id,
        an.referral_code,
        an.affiliate_tier,
        an.total_referrals,
        an.total_downlines,
        an.level,
        an.commission_rate,
        an.commission_points,
        an.total_points
      FROM affiliate_networks an
      WHERE an.user_id = ?
      LIMIT 1`;

  const fallbackSelect = `SELECT
        an.user_id,
        an.affiliate_id,
        an.referral_code,
        an.affiliate_tier
      FROM affiliate_networks an
      WHERE an.user_id = ?
      LIMIT 1`;

  try {
    const rows = await query(fullSelect, [userId]);
    if (rows.length) return rows[0];
  } catch (error) {
    console.warn('[fetchAffiliateNetworkRow] fullSelect failed, trying fallback:', error?.message);
    if (!isUnknownColumnError(error)) throw error;
  }

  try {
    const rows = await query(fallbackSelect, [userId]);
    if (rows.length) return rows[0];
  } catch (error) {
    console.warn('[fetchAffiliateNetworkRow] fallbackSelect failed:', error?.message);
    if (!isUnknownColumnError(error)) throw error;
  }

  try {
    const insertResult = await query(
`INSERT INTO affiliate_networks (user_id, affiliate_id, referral_code, total_referrals, total_downlines, commission_rate, commission_points, total_points)
       VALUES (?, ?, ?, 0, 0, ?, 0, 0)
       ON DUPLICATE KEY UPDATE user_id = user_id`,
      [userId, `AFF-${userId}`, await ensureUniqueReferralCodeFromPool(), AFFILIATE_COMMISSION_RATE_BASIC],
    );
    console.log('[fetchAffiliateNetworkRow] Insert attempted, result:', insertResult);
    const rows = await query(fullSelect, [userId]);
    return rows[0] || null;
  } catch (error) {
    console.warn('[fetchAffiliateNetworkRow] Insert failed, returning null:', error?.message);
    return null;
  }
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

function extractNimFromBarcodeValue(value) {
  const raw = normalizeText(value);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'string') return normalizeNim(parsed);
    const candidate = parsed.nim || parsed.NIM || parsed.user_nim || null;
    if (candidate) return normalizeNim(candidate);
  } catch (_) {
    // not JSON
  }

  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw);
      const params = new URLSearchParams(url.search);
      const fromQuery = params.get('nim') || params.get('NIM') || params.get('user_nim') || null;
      if (fromQuery) return normalizeNim(fromQuery);
      const segments = url.pathname.split('/').filter(Boolean);
      const last = segments[segments.length - 1];
      if (last && /^\d{8,15}$/.test(last)) return normalizeNim(last);
    } catch (_) {
      // not a valid URL
    }
    const plainFromUrl = raw.replace(/^https?:\/\/[^/]+/, '').replace(/[^0-9]/g, '');
    if (plainFromUrl) return normalizeNim(plainFromUrl);
  }

  return normalizeNim(raw);
}

function buildPublicUser(row) {
  return {
    user_id: row.user_id,
    username: row.username,
    email: row.email,
    nim: row.nim || null,
    role: row.role,
    status: row.status,
    membership_level: row.membership_level || 'Silver',
    referred_by: row.referred_by,
    affiliate_upline: row.affiliate_upline || null,
    created_at: row.created_at,
    phone_number: row.phone_number,
    profile_picture: row.profile_picture,
  };
}

function buildMembershipPointsPayload(membershipPointsRow, gamificationPoints) {
  const membershipPoints = membershipPointsRow || {};
  const commissionPoints = toNumber(membershipPoints.commission_points, 0);
  const normalizedGamificationPoints = toNumber(gamificationPoints, 0);
  const totalPoints = normalizedGamificationPoints + commissionPoints;

  return {
    ...membershipPoints,
    gamification_points: normalizedGamificationPoints,
    commission_points: commissionPoints,
    total_points: totalPoints,
    points: totalPoints,
  };
}

async function fetchGamificationPoints(userId) {
  const rows = await query(
    `SELECT COALESCE(ug.points, 0) AS points
    FROM usergamification ug
    WHERE ug.user_id = ?
    LIMIT 1`,
    [userId]
  );

  return toNumber(rows[0]?.points, 0);
}

async function fetchUserGamificationLevel(userId) {
  const rows = await query(
    `SELECT memberLevel
    FROM usergamification
    WHERE user_id = ?
    LIMIT 1`,
    [userId]
  );

  return rows[0]?.memberLevel || 'Silver';
}

async function fetchCashbackPoints(userId) {
  const rows = await query(
    `SELECT COALESCE(SUM(points_earned), 0) AS cashback_points
    FROM orders
    WHERE user_id = ?`,
    [userId]
  );

  return toNumber(rows[0]?.cashback_points, 0);
}

async function fetchCommissionPoints(userId) {
  const rows = await query(
    `SELECT COALESCE(commission_points, 0) AS commission_points
    FROM user_points
    WHERE user_id = ?
    LIMIT 1`,
    [userId]
  );

  return toNumber(rows[0]?.commission_points, 0);
}

async function buildPointsPayload(userId) {
  const [gamificationPoints, cashbackPoints, commissionPoints, memberLevel] = await Promise.all([
    fetchGamificationPoints(userId),
    fetchCashbackPoints(userId),
    fetchCommissionPoints(userId),
    fetchUserGamificationLevel(userId),
  ]);

  const totalPoints = gamificationPoints + cashbackPoints + commissionPoints;

  return {
    total_points: totalPoints,
    poin_gamification: gamificationPoints,
    cashback_points: cashbackPoints,
    commission_points: commissionPoints,
    memberLevel,
  };
}

async function upsertUserPoints(userId) {
  const [gamificationPoints, cashbackPoints, commissionPoints] = await Promise.all([
    fetchGamificationPoints(userId),
    fetchCashbackPoints(userId),
    fetchCommissionPoints(userId),
  ]);

  const totalPoints = gamificationPoints + cashbackPoints + commissionPoints;

  await query(
    `INSERT INTO user_points (user_id, total_points, poin_gamification, cashback_points, commission_points)
    VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      total_points = VALUES(total_points),
      poin_gamification = VALUES(poin_gamification),
      cashback_points = VALUES(cashback_points),
      commission_points = VALUES(commission_points),
      updated_at = CURRENT_TIMESTAMP`,
    [userId, totalPoints, gamificationPoints, cashbackPoints, commissionPoints]
  );

  return { totalPoints, gamificationPoints, cashbackPoints, commissionPoints };
}

function buildVerificationPayload(row) {
  if (!row) return null;

  return {
    id: row.id,
    user_id: row.user_id,
    registered_nim: row.registered_nim,
    detected_nim: row.registered_nim || row.detected_nim,
    ai_is_telkom: null,
    ai_confidence: 0,
    ai_reasoning: null,
    file_url: null,
    reviewed_by: null,
    review_notes: null,
    status: row.status,
    verification_method: row.verification_method || null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function resolveReferralTarget(input) {
  const raw = normalizeText(input);
  if (!raw) return null;

  const [directUser] = await query(
    `SELECT user_id FROM users WHERE user_id = ? LIMIT 1`,
    [raw]
  );
  if (directUser?.user_id) {
    const affiliateRows = await query(
      `SELECT affiliate_id
      FROM affiliate_networks
      WHERE user_id = ?
      LIMIT 1`,
      [directUser.user_id]
    );

    return {
      user_id: String(directUser.user_id),
      affiliate_id: affiliateRows[0]?.affiliate_id ? String(affiliateRows[0].affiliate_id) : null,
    };
  }

  const [affiliateRow] = await query(
    `SELECT user_id, affiliate_id FROM affiliate_networks WHERE referral_code = ? LIMIT 1`,
    [raw]
  );

  if (!affiliateRow?.user_id) return null;

  return {
    user_id: String(affiliateRow.user_id),
    affiliate_id: affiliateRow.affiliate_id ? String(affiliateRow.affiliate_id) : null,
  };
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

async function ensureUniqueReferralCodeFromPool() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const referralCode = generateReferralCode();
    const rows = await query(
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
    console.log('[REGISTER] Received register body:', body);
    const username = normalizeText(body.username);
    const email = normalizeEmail(body.email);
    const password = normalizeText(body.password);
    const profilePicture = normalizeText(body.profile_picture || body.photo_url || body.profilePicture);
    const nim = normalizeText(body.nim || body.nim_number || body.nimNumber || body.student_id || body.studentId);
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

    const referralTarget = await resolveReferralTarget(referredByInput);
    const referredBy = referralTarget?.user_id || null;
    const affiliateUpline = referralTarget?.affiliate_id || null;
    const userId = generateUserId();
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await withTransaction(async (connection) => {
      console.log('[REGISTER] START TRANSACTION - inserting user values', { userId, username, email, referredBy, affiliateUpline });

const insertUserSql = `INSERT INTO users (
          user_id,
          username,
          email,
          password,
          role,
          status,
          membership_level,
          referred_by,
          affiliate_upline,
          phone_number,
          nim,
          profile_picture
        ) VALUES (?, ?, ?, ?, 'MEMBER', 'ACTIVE', 'Silver', ?, ?, ?, ?, ?)`;

    console.log('[REGISTER] QUERY -> insert user');
    await connection.query(insertUserSql, [userId, username, email, passwordHash, referredBy, affiliateUpline, phoneNumber || null, nim || null, profilePicture || null]);
      console.log('[REGISTER] INSERTED user', { userId });

      const referralCode = await ensureUniqueReferralCode(connection);
      const insertAffiliateSql = `INSERT INTO affiliate_networks (
          user_id,
          affiliate_id,
          referral_code,
          affiliate_tier,
          total_referrals,
          total_downlines
        ) VALUES (?, ?, ?, 'Basic', 0, 0)`;

      console.log('[REGISTER] QUERY -> insert affiliate_networks', { userId, affiliateId: `AFF-${userId}`, referralCode });
      await connection.query(insertAffiliateSql, [userId, `AFF-${userId}`, referralCode]);
      console.log('[REGISTER] INSERTED affiliate_network for', { userId, referralCode });

console.log('[REGISTER] QUERY -> insert user_points');
      await connection.query(`INSERT INTO user_points (
          user_id,
          total_points,
          poin_gamification,
          cashback_points,
          commission_points
        ) VALUES (?, 0, 0, 0, 0)`, [userId]);
      console.log('[REGISTER] INSERTED user_points for', { userId });

      if (referredBy) {
        console.log('[REGISTER] referredBy present, resolving referrer and applying updates', { referredBy });
        const [referrerRows] = await connection.query(
          `SELECT user_id, affiliate_id, affiliate_tier, level, total_referrals, total_downlines, commission_points, total_points, commission_rate
          FROM affiliate_networks
          WHERE user_id = ?
          LIMIT 1
          FOR UPDATE`,
          [referredBy]
        );

        if (referrerRows.length) {
          const referrer = referrerRows[0];
          const nextTotalReferrals = Number(referrer.total_referrals || 0) + 1;
          const nextTotalDownlines = Number(referrer.total_downlines || 0) + 1;
          const nextTier = resolveAffiliateTierByReferrals(nextTotalReferrals);
          const referralBonus = nextTier.referral_bonus;

          console.log('[REGISTER] QUERY -> update affiliate_networks for referrer', { referredBy, nextTotalReferrals, nextTotalDownlines, nextTier });
          await connection.query(
            `UPDATE affiliate_networks
            SET total_referrals = ?,
                total_downlines = ?,
                affiliate_tier = ?,
                level = ?,
                commission_points = commission_points + ?,
                total_points = total_points + ?,
                commission_rate = ?
            WHERE user_id = ?`,
            [
              nextTotalReferrals,
              nextTotalDownlines,
              nextTier.affiliate_tier,
              nextTier.level,
              referralBonus,
              referralBonus,
              nextTier.commission_rate,
              referredBy,
            ]
          );
          console.log('[REGISTER] UPDATED referrer affiliate_networks', { referredBy });

          console.log('[REGISTER] QUERY -> insert affiliate_commission_logs');
          await connection.query(
            `INSERT INTO affiliate_commission_logs (
              affiliate_id,
              member_id,
              transaction_code,
              transaction_amount,
              commission_earned
            ) VALUES (?, ?, ?, ?, ?)` ,
            [referrer.affiliate_id || `AFF-${referredBy}`, userId, null, 0, referralBonus]
          );
          console.log('[REGISTER] INSERTED affiliate_commission_log for', { member: userId, referrer: referredBy, bonus: referralBonus });
        } else {
          console.log('[REGISTER] referredBy provided but referrer not found', { referredBy });
        }

      }

      console.log('[REGISTER] COMMIT TRANSACTION for', { userId });

      return { userId, referralCode };
    });

    const createdRows = await query(
      `SELECT user_id, username, email, role, status, membership_level, referred_by, affiliate_upline, created_at, phone_number, profile_picture
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
        ...createMembershipToken(buildPublicUser(createdRows[0])),
        referral_code: result.referralCode,
      },
    });
  } catch (error) {
    console.error('[REGISTER] Error:', error && error.stack ? error.stack : error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function login(req, res) {
  console.log('[LOGIN] ===== START =====');
  console.log('[LOGIN] Request body:', req.body);

  try {
    const body = req.body || {};
    const identifier = normalizeText(body.username || body.email);
    const password = normalizeText(body.password);

    console.log('[LOGIN] Identifier:', identifier);

    if (!identifier || !password) {
      console.log('[LOGIN] Missing credentials - returning 400');
      return res.status(400).json({
        success: false,
        error: 'username/email dan password wajib diisi.',
      });
    }

    console.log('[LOGIN] Starting login query for identifier:', identifier);
    const queryStart = Date.now();
    const rows = await query(
      `SELECT user_id, username, email, password, role, status, membership_level, referred_by, affiliate_upline, created_at, phone_number, profile_picture
      FROM users
      WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)
      LIMIT 1`,
      [identifier, identifier]
    );
    console.log('[LOGIN] Query completed in', Date.now() - queryStart, 'ms. Rows:', rows.length);

    if (!rows.length) {
      console.log('[LOGIN] User not found - returning 401');
      return res.status(401).json({ success: false, error: 'Akun tidak ditemukan.' });
    }

    const user = rows[0];
    const storedPassword = String(user.password || '');
    const looksLikeBcrypt = BCRYPT_HASH_REGEX.test(storedPassword);
    let validPassword = false;

    if (looksLikeBcrypt) {
      console.log('[LOGIN] Comparing bcrypt password');
      validPassword = await bcrypt.compare(password, storedPassword);
    } else if (password === storedPassword) {
      validPassword = true;
      const migratedHash = await bcrypt.hash(password, 10);
      console.log('[LOGIN] Migrating plaintext password to bcrypt');
      await query('UPDATE users SET password = ? WHERE user_id = ?', [migratedHash, user.user_id]);
      user.password = migratedHash;
    }

    console.log('[LOGIN] Password valid:', validPassword);

    if (!validPassword) {
      console.log('[LOGIN] Invalid password - returning 401');
      return res.status(401).json({ success: false, error: 'Password salah.' });
    }

    const isAffiliate = String(user.role || '').toUpperCase() === 'MEMBER_AFFILIATE';

    console.log('[LOGIN] Fetching affiliate network for user:', user.user_id, 'isAffiliate:', isAffiliate);
    let affiliateRow = null;
    try {
      affiliateRow = isAffiliate ? await fetchAffiliateNetworkRow(user.user_id) : null;
      console.log('[LOGIN] Affiliate network fetched for user:', user.user_id);
    } catch (affError) {
      console.warn('[LOGIN] Warning: Failed to fetch affiliate network, continuing without it:', affError?.message);
      affiliateRow = null;
    }

const referralCode = isAffiliate ? affiliateRow?.referral_code || null : null;
    const publicUser = buildPublicUser(user);
    publicUser.referral_code = referralCode;

console.log('[LOGIN] Fetching points for user:', user.user_id);
    let pointsPayload = { total_points: 0, poin_gamification: 0, cashback_points: 0, commission_points: 0, memberLevel: 'Silver' };
    try {
      pointsPayload = await buildPointsPayload(user.user_id);
      console.log('[LOGIN] Points fetched:', pointsPayload);
    } catch (pointsError) {
      console.warn('[LOGIN] Warning: Failed to fetch user points, using null:', pointsError?.message);
      pointsPayload = { total_points: 0, poin_gamification: 0, cashback_points: 0, commission_points: 0, memberLevel: 'Silver' };
    }

    let tokenResult = null;
    try {
      tokenResult = createMembershipToken(publicUser);
      console.log('[LOGIN] Token created successfully');
    } catch (tokenError) {
      console.error('[LOGIN] Error creating token:', tokenError);
      return res.status(500).json({ success: false, error: 'Gagal membuat token autentikasi.' });
    }

    console.log('[LOGIN] ===== END - SUCCESS =====');
    return res.json({
      success: true,
      message: 'Login berhasil.',
      data: {
        user: publicUser,
        ...tokenResult,
        affiliate_network: isAffiliate ? buildAffiliateNetwork(affiliateRow) : null,
        referralCode,
        points: pointsPayload,
      },
    });
  } catch (error) {
    console.error('[LOGIN] ===== ERROR =====', error);
    if (error?.stack) {
      console.error('[LOGIN] Stack trace:', error.stack);
    }
    return res.status(500).json({ success: false, error: error?.message || 'Terjadi kesalahan pada server.' });
  }
}

export async function getUserProfile(_req, res) {
  try {
    const userId = normalizeText(_req.params?.user_id);
    if (!userId) {
      return res.status(400).json({ success: false, error: 'user_id wajib diisi.' });
    }

    const users = await query(
      `SELECT user_id, username, email, nim, role, status, referred_by, affiliate_upline, created_at, phone_number, profile_picture
      FROM users
      WHERE user_id = ?
      LIMIT 1`,
      [userId]
    );

    if (!users.length) {
      return res.status(404).json({ success: false, error: 'User tidak ditemukan.' });
    }

    const affiliateRow = await fetchAffiliateNetworkRow(userId);

    const pointsPayload = await buildPointsPayload(userId);

    const insightRows = await query(
      `SELECT favorite_category, peak_visit_time, ai_recommendation
      FROM user_ai_insights
      WHERE user_id = ?
      ORDER BY id DESC
      LIMIT 1`,
      [userId]
    );

    const affiliateNetwork = affiliateRow
      ? buildAffiliateNetwork(affiliateRow)
      : null;

    const userRow = users[0];
    const user = {
      ...buildPublicUser(userRow),
      membership_level: pointsPayload.memberLevel,
      memberLevel: pointsPayload.memberLevel,
    };

    return res.json({
      success: true,
      data: {
        user,
        affiliate_network: affiliateNetwork,
        referralCode: affiliateNetwork?.referralCode || affiliateRow?.referral_code || null,
        points: pointsPayload,
        ai_insight: insightRows[0] || null,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function getMembershipPoints(_req, res) {
  try {
    const userId = normalizeText(_req.params?.user_id);

    if (!userId) {
      return res.status(400).json({ success: false, error: 'user_id wajib diisi.' });
    }

    const [userRows] = await query(
      `SELECT user_id FROM users WHERE user_id = ? LIMIT 1`,
      [userId]
    );

    if (!userRows.length) {
      return res.status(404).json({ success: false, error: 'User tidak ditemukan.' });
    }

    const points = await buildPointsPayload(userId);

    return res.json({
      success: true,
      data: {
        user_id: userId,
        points,
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
      `SELECT user_id, username, email, nim, role, status, membership_level, referred_by, created_at, phone_number, profile_picture
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
    let nextProfilePicture = normalizeText(body.profile_picture ?? body.photo_url ?? body.profilePicture);
    const nextNim = normalizeText(body.nim ?? body.nim_number ?? body.nimNumber ?? body.student_id ?? body.studentId);

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

    if (_req.file && _req.file.buffer) {
      const uploadsDir = path.join(process.cwd(), 'apps', 'backend', 'uploads');
      try {
        await fs.promises.mkdir(uploadsDir, { recursive: true });
      } catch (e) {
        // ignore
      }
      const filename = `profile-${Date.now()}-${crypto.randomBytes(3).toString('hex')}${path.extname(_req.file.originalname) || '.jpg'}`;
      const filePath = path.join(uploadsDir, filename);
      await fs.promises.writeFile(filePath, _req.file.buffer);
      nextProfilePicture = `/uploads/${filename}`;
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

    if (_req.file) {
      updateFields.push('profile_picture = ?');
      updateValues.push(nextProfilePicture || null);
    } else if (body.profile_picture !== undefined || body.photo_url !== undefined || body.profilePicture !== undefined) {
      updateFields.push('profile_picture = ?');
      updateValues.push(nextProfilePicture || null);
    }

    if (body.nim !== undefined || body.nim_number !== undefined || body.nimNumber !== undefined || body.student_id !== undefined || body.studentId !== undefined) {
      updateFields.push('nim = ?');
      updateValues.push(nextNim || null);
    }

    updateValues.push(userId);

    if (updateFields.length) {
      await query(
        `UPDATE users
        SET ${updateFields.join(', ')}
        WHERE user_id = ?`,
        updateValues
      );
    }

    const updatedRows = await query(
      `SELECT user_id, username, email, nim, role, status, membership_level, referred_by, created_at, phone_number, profile_picture
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
        profile_picture: updatedRows[0]?.profile_picture || null,
        photo_url: updatedRows[0]?.profile_picture || null,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function verifyAffiliateByBarcode(req, res) {
  try {
    const body = req.body || {};
    const userId = normalizeText(body.user_id || body.userId);
    const barcodeValue = normalizeText(body.barcode_value || body.barcodeValue || body.barcode);

    if (!userId) {
      return res.status(400).json({ success: false, error: 'user_id wajib diisi.' });
    }

    if (!barcodeValue) {
      return res.status(400).json({ success: false, error: 'barcode_value wajib diisi.' });
    }

    const barcodeNim = extractNimFromBarcodeValue(barcodeValue);
    if (!barcodeNim) {
      return res.status(400).json({ success: false, error: 'Gagal mengekstrak NIM dari barcode.' });
    }

    const userRows = await query(
      `SELECT user_id, username, email, role, status, membership_level, referred_by, created_at, phone_number, profile_picture, nim
       FROM users
       WHERE user_id = ?
       LIMIT 1`,
      [userId]
    );

    if (!userRows.length) {
      return res.status(404).json({ success: false, error: 'User tidak ditemukan.' });
    }

    const registeredNim = normalizeNim(userRows[0].nim || '');

    if (!registeredNim) {
      return res.status(400).json({ success: false, error: 'Akun belum memiliki NIM, tidak dapat verifikasi barcode.' });
    }

    if (registeredNim !== barcodeNim) {
      return res.status(400).json({ success: false, error: 'NIM barcode tidak sesuai dengan NIM akun.' });
    }

    const affiliateTier = 'Basic';

const result = await withTransaction(async (connection) => {
       const [verificationInsert] = await connection.query(
         `INSERT INTO affiliate_verifications (
           user_id,
           registered_nim,
           status,
           verification_method
         ) VALUES (?, ?, ?, ?)`,
         [userId, registeredNim, 'APPROVED', 'BARCODE']
       );

      await connection.query(
        `UPDATE users
         SET role = 'MEMBER_AFFILIATE',
             status = 'ACTIVE'
         WHERE user_id = ?`,
        [userId]
      );

      const [affiliateRows] = await connection.query(
        `SELECT user_id, affiliate_id, referral_code, affiliate_tier, level, total_referrals, total_downlines, commission_points, total_points
         FROM affiliate_networks
         WHERE user_id = ?
         LIMIT 1
         FOR UPDATE`,
        [userId]
      );

      let referralCode = affiliateRows[0]?.referral_code || null;

      if (!affiliateRows.length) {
        referralCode = await ensureUniqueReferralCode(connection);
        await connection.query(
          `INSERT INTO affiliate_networks (
            user_id,
            affiliate_id,
            referral_code,
            affiliate_tier,
            level,
            total_referrals,
            total_downlines,
            commission_points,
            total_points
          ) VALUES (?, ?, ?, ?, ?, 0, 0, 0, 0)`,
          [userId, `AFF-${userId}`, referralCode, affiliateTier, affiliateTier]
        );
      } else {
        const updateFields = [];
        const updateValues = [];

        if (!affiliateRows[0].affiliate_id) {
          updateFields.push('affiliate_id = ?');
          updateValues.push(`AFF-${userId}`);
        }

        if (!referralCode) {
          referralCode = await ensureUniqueReferralCode(connection);
          updateFields.push('referral_code = ?');
          updateValues.push(referralCode);
        }

        if (!affiliateRows[0].affiliate_tier || !affiliateRows[0].level) {
          updateFields.push('affiliate_tier = ?', 'level = ?');
          updateValues.push(affiliateTier, affiliateTier);
        }

        if (updateFields.length) {
          updateValues.push(userId);
          await connection.query(
            `UPDATE affiliate_networks
             SET ${updateFields.join(', ')}
             WHERE user_id = ?`,
            updateValues
          );
        }
      }

      return { referralCode, verificationId: verificationInsert.insertId };
    });

    const updatedUserRows = await query(
      `SELECT user_id, username, email, role, status, membership_level, referred_by, created_at, phone_number, profile_picture, nim
       FROM users
       WHERE user_id = ?
       LIMIT 1`,
      [userId]
    );

const verificationRows = await query(
       `SELECT id, user_id, registered_nim, status, verification_method, created_at, updated_at
        FROM affiliate_verifications
        WHERE id = ?
        LIMIT 1`,
       [result.verificationId]
     );

     const updatedAffiliateRow = await fetchAffiliateNetworkRow(userId);

     return res.json({
       success: true,
       message: 'Akun berhasil diverifikasi sebagai affiliate.',
       status: 'APPROVED',
       data: {
         verification_id: String(result.verificationId),
         user: buildPublicUser(updatedUserRows[0]),
         verification: {
           id: verificationRows[0].id,
           user_id: verificationRows[0].user_id,
           registered_nim: verificationRows[0].registered_nim,
           detected_nim: verificationRows[0].registered_nim,
           ai_is_telkom: null,
           ai_confidence: 0,
           ai_reasoning: null,
           file_url: null,
           reviewed_by: null,
           review_notes: null,
           status: verificationRows[0].status,
           verification_method: verificationRows[0].verification_method || null,
           created_at: verificationRows[0].created_at,
           updated_at: verificationRows[0].updated_at,
         },
         affiliate_network: buildAffiliateNetwork(updatedAffiliateRow),
         referral_code: result.referralCode || updatedAffiliateRow?.referral_code || null,
       },
     });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function getAffiliateNetwork(_req, res) {
  try {
    const userId = normalizeText(_req.params?.user_id || _req.query?.user_id);

    if (!userId) {
      return res.status(400).json({ success: false, error: 'user_id wajib diisi.' });
    }

    const row = await fetchAffiliateNetworkRow(userId);

    if (!row) {
      return res.status(404).json({ success: false, error: 'Affiliate network tidak ditemukan.' });
    }

    const summary = buildAffiliateNetworkSummary(row);

    return res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function getAffiliateStats(req, res) {
  return getAffiliateNetwork(req, res);
}

export async function getAffiliateVerifications(_req, res) {
  try {
    const status = normalizeText(_req.query?.status || _req.params?.status).toUpperCase();
    const params = [];
    let whereClause = '';

    if (status) {
      whereClause = 'WHERE av.status = ?';
      params.push(status);
    }

const rows = await query(
       `SELECT av.id, av.user_id, u.username, u.email, av.registered_nim, av.status, av.verification_method, av.created_at, av.updated_at
       FROM affiliate_verifications av
       LEFT JOIN users u ON u.user_id = av.user_id
       ${whereClause}
       ORDER BY av.created_at DESC`,
       params
     );

     return res.json({
       success: true,
       data: rows.map((row) => ({
         id: row.id,
         user_id: row.user_id,
         registered_nim: row.registered_nim,
         detected_nim: row.registered_nim,
         ai_is_telkom: null,
         ai_confidence: 0,
         ai_reasoning: null,
         file_url: null,
         reviewed_by: null,
         review_notes: null,
         status: row.status,
         verification_method: row.verification_method || null,
         created_at: row.created_at,
         updated_at: row.updated_at,
         username: row.username || null,
         email: row.email || null,
       })),
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
    const userRows = await query(
      `SELECT
        u.user_id,
        u.nim,
        u.username,
        u.email,
        u.role,
        u.status,
        u.referred_by,
        u.affiliate_upline,
        u.created_at,
        u.phone_number,
        u.profile_picture,
        an.referral_code,
        an.affiliate_tier,
        an.total_referrals
      FROM users u
      LEFT JOIN affiliate_networks an ON an.user_id = u.user_id
      ORDER BY u.created_at DESC`
    );

    const pointsResults = await Promise.all(userRows.map(row => buildPointsPayload(row.user_id)));
    const pointsMap = new Map(pointsResults.map((p, i) => [userRows[i].user_id, p]));

    return res.json({
      success: true,
      data: userRows.map((row) => {
        const pts = pointsMap.get(row.user_id) || { total_points: 0, poin_gamification: 0, cashback_points: 0, commission_points: 0, memberLevel: 'Silver' };
        return {
          ...buildPublicUser(row),
          total_points: pts.total_points,
          commission_points: pts.commission_points,
          mission_points: 0,
          cashback_points: pts.cashback_points,
          voucher_points: 0,
          membership_level: pts.memberLevel,
          memberLevel: pts.memberLevel,
          referral_code: row.referral_code || null,
          affiliate_tier: row.affiliate_tier || null,
          total_referrals: Number(row.total_referrals || 0),
          nim: row.nim || null,
          affiliate_network: buildAffiliateNetwork(row),
        };
      }),
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function getAdminAiInsights(_req, res) {
  try {
    const usesOrderCode = await hasColumn('order_items', 'order_code');
    const hasMemberCode = await hasColumn('orders', 'member_code');
    const hasUserIdInOrders = await hasColumn('orders', 'user_id');
    const usesUserColumn = hasUserIdInOrders && !hasMemberCode;
    const joinCondition = usesOrderCode
      ? 'JOIN orders o ON o.order_code = oi.order_code'
      : 'LEFT JOIN orders o ON oi.order_id = o.id';
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];

    const todayProductRows = await query(
      `SELECT oi.product_name_snapshot, SUM(oi.qty) AS total_qty
       FROM order_items oi
       ${joinCondition}
       WHERE DATE(o.created_at) = ?
       GROUP BY oi.product_name_snapshot
       ORDER BY total_qty DESC
       LIMIT 1`,
      [todayStr]
    );

    const monthProductRows = await query(
      `SELECT oi.product_name_snapshot, SUM(oi.qty) AS total_qty
       FROM order_items oi
       ${joinCondition}
       WHERE DATE(o.created_at) >= ?
       GROUP BY oi.product_name_snapshot
       ORDER BY total_qty DESC
       LIMIT 1`,
      [firstDayOfMonth]
    );

    const ordersTodayRows = await query(
      `SELECT COUNT(*) AS total_orders
       FROM orders
       WHERE DATE(created_at) = ?`,
      [todayStr]
    );

    const hourRows = await query(
      `SELECT HOUR(created_at) AS hour, COUNT(*) AS order_count
       FROM orders
       WHERE DATE(created_at) = ?
       GROUP BY HOUR(created_at)
       ORDER BY order_count DESC
       LIMIT 1`,
      [todayStr]
    );

    const topProductToday = todayProductRows[0]?.product_name_snapshot || null;
    const topProductMonth = monthProductRows[0]?.product_name_snapshot || null;
    const peakHour = hourRows?.[0]?.hour != null
      ? `${String(hourRows[0].hour).padStart(2, '0')}:00 - ${String(hourRows[0].hour + 1).padStart(2, '0')}:00`
      : null;

    const ordersToday = Number(ordersTodayRows?.[0]?.total_orders || 0);

    return res.json({
      success: true,
      data: {
        best_selling_today: topProductToday || '-',
        best_selling_month: topProductMonth || '-',
        peak_hour: peakHour || '-',
        orders_today: ordersToday,
      },
    });
  } catch (error) {
    console.error('[getAdminAiInsights] Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function getUserVouchers(_req, res) {
  try {
    const userId = normalizeText(_req.params?.user_id || _req.query?.user_id);
    if (!userId) {
      return res.status(400).json({ success: false, error: 'user_id wajib diisi.' });
    }

    let userVoucherCols;
    let userVoucherTable = 'user_voucher';
    try {
      userVoucherCols = await getTableColumns('user_voucher');
    } catch {
      try {
        userVoucherCols = await getTableColumns('user_vouchers');
        userVoucherTable = 'user_vouchers';
      } catch {
        return res.json({ success: true, data: [] });
      }
    }

    const hasStatus = userVoucherCols.has('status');
    const hasClaimedAt = userVoucherCols.has('claimed_at');

    const voucherCols = await getTableColumns('vouchers');
    const hasDescription = voucherCols.has('description');
    const hasImageUrl = voucherCols.has('image_url');
    const hasExpiryDays = voucherCols.has('expiry_days');
    const hasMaxDiscount = voucherCols.has('max_discount');
    const hasMinPurchase = voucherCols.has('min_purchase');
    const hasCashierInstruction = voucherCols.has('cashier_instruction');

    const extraVoucherCols = [
      hasDescription ? 'v.description' : 'NULL AS description',
      hasImageUrl ? 'v.image_url' : 'NULL AS image_url',
      hasExpiryDays ? 'v.expiry_days' : 'NULL AS expiry_days',
      hasMaxDiscount ? 'v.max_discount' : 'NULL AS max_discount',
      hasMinPurchase ? 'v.min_purchase' : 'NULL AS min_purchase',
      hasCashierInstruction ? 'v.cashier_instruction' : 'NULL AS cashier_instruction',
    ].join(',\n        ');

    let statusFilter = '';
    if (hasStatus) {
      statusFilter = "AND (uv.status = 'CLAIMED' OR uv.status = 'ACTIVE' OR uv.status = 'UNUSED')";
    }

    const rows = await query(
      `SELECT
        uv.voucher_code,
        v.voucher_name,
        v.voucher_type,
        v.points_cost,
        v.value_amount,
        ${extraVoucherCols}
      FROM ${userVoucherTable} uv
      JOIN vouchers v ON uv.voucher_code = v.voucher_code
      WHERE uv.user_id = ?
        ${statusFilter}
      ORDER BY uv.${hasClaimedAt ? 'claimed_at' : 'created_at'} DESC`,
      [userId]
    );

    const vouchers = rows.map((row) => ({
      voucher_code: row.voucher_code,
      voucher_name: row.voucher_name,
      voucher_type: row.voucher_type,
      points_cost: Number(row.points_cost || 0),
      value_amount: Number(row.value_amount || 0),
      description: row.description || '',
      image_url: row.image_url || '',
      expiry_days: Number(row.expiry_days || 0),
      max_discount: Number(row.max_discount || 0),
      min_purchase: Number(row.min_purchase || 0),
      cashier_instruction: row.cashier_instruction || '',
      status: row.status || 'ACTIVE',
      claimed_at: row.claimed_at || row.created_at || null,
    }));

    return res.json({
      success: true,
      data: vouchers,
    });
  } catch (error) {
    console.error('[getUserVouchers] Error:', error);
    if (String(error?.message || '').includes("doesn't exist") || String(error?.message || '').includes('Unknown table')) {
      return res.json({
        success: true,
        data: [],
      });
    }
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function getAllAffiliates(_req, res) {
  try {
    const rows = await query(
      `SELECT
        an.user_id,
        an.affiliate_id,
        u.nim,
        an.referral_code,
        an.affiliate_tier,
        an.total_referrals,
        an.total_downlines,
        an.level,
        an.commission_rate,
        an.commission_points,
        an.total_points,
        an.created_at,
        u.username,
        u.email,
        u.role,
        u.status,
        u.phone_number,
        u.profile_picture
      FROM affiliate_networks an
      INNER JOIN users u ON u.user_id = an.user_id
      ORDER BY an.created_at DESC`
    );

    let gamificationMap = new Map();
    if (rows.length > 0) {
      const gamificationRows = await query(
        `SELECT user_id, memberLevel FROM usergamification WHERE user_id IN (${rows.map(() => '?').join(',')})`,
        rows.map(r => r.user_id)
      );
      gamificationMap = new Map(gamificationRows.map(r => [r.user_id, r.memberLevel || 'Silver']));
    }

    return res.json({
      success: true,
      data: rows.map((row) => ({
        user_id: row.user_id,
        affiliate_id: row.affiliate_id || null,
        nim: row.nim || null,
        username: row.username,
        email: row.email,
        role: row.role,
        status: row.status,
        membership_level: gamificationMap.get(row.user_id) || 'Silver',
        memberLevel: gamificationMap.get(row.user_id) || 'Silver',
        phone_number: row.phone_number,
        profile_picture: row.profile_picture,
        referral_code: row.referral_code,
        affiliate_tier: row.affiliate_tier,
        total_referrals: Number(row.total_referrals || 0),
        total_downlines: Number(row.total_downlines || 0),
        level: row.level || 'Starter',
        commission_rate: Number(row.commission_rate ?? AFFILIATE_COMMISSION_RATE_BASIC),
        commission_points: Number(row.commission_points || 0),
        total_points: Number(row.total_points || 0),
        created_at: row.created_at,
        affiliate_network: buildAffiliateNetwork(row),
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
    if (!userId) {
      return res.status(400).json({ success: false, error: 'user_id wajib diisi.' });
    }

    const networkRows = await query(
      `SELECT affiliate_id
       FROM affiliate_networks
       WHERE user_id = ?
       LIMIT 1`,
      [userId]
    );

    if (!networkRows.length || !networkRows[0]?.affiliate_id) {
      return res.json({
        success: true,
        message: 'User bukan affiliate atau belum memiliki affiliate_id.',
        data: [],
      });
    }

    const affiliateId = networkRows[0].affiliate_id;
    const rows = await query(
      `SELECT
        id,
        affiliate_id,
        member_id,
        transaction_code,
        transaction_amount,
        commission_earned,
        created_at
      FROM affiliate_commission_logs
      WHERE affiliate_id = ?
      ORDER BY created_at DESC`,
      [affiliateId]
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
        `SELECT total_points
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

      const nextTotalPoints = currentPoints - pointsUsed;

      await connection.query(
        `UPDATE user_points
        SET total_points = ?
        WHERE user_id = ?`,
        [nextTotalPoints, userId]
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
    const items = Array.isArray(body.items) ? body.items : [];
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
        `SELECT order_code FROM orders WHERE order_code = ? LIMIT 1`,
        [transactionCode]
      );

      if (transactionRows.length) {
        throw new Error('Transaction code sudah digunakan.');
      }

      if (userId) {
        const [userRows] = await connection.query(
          `SELECT user_id, affiliate_upline
          FROM users
          WHERE user_id = ?
          LIMIT 1`,
          [userId]
        );
        if (!userRows.length) {
          throw new Error('User tidak ditemukan.');
        }
      }

      await connection.query(
        `INSERT INTO orders (
          order_code,
          service_type,
          subtotal,
          discount,
          total,
          points_earned,
          points_used,
          payment_method,
          member_code
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          transactionCode,
          transactionType,
          subtotal,
          discount,
          total,
          pointsEarned,
          pointsUsed,
          paymentMethod,
          userId || null,
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

        // ensure referenced product_code exists, otherwise insert NULL to avoid FK failure
        let productCodeToInsert = itemCode || null;
        if (productCodeToInsert) {
          const [productRows] = await connection.query(
            `SELECT code FROM products WHERE code = ? LIMIT 1`,
            [productCodeToInsert]
          );
          if (!productRows.length) {
            productCodeToInsert = null;
          }
        }

        await connection.query(
          `INSERT INTO order_items (
            order_code,
            product_code,
            product_name_snapshot,
            price_snapshot,
            qty,
            subtotal
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [transactionCode, productCodeToInsert, itemName, price, qty, itemSubtotal]
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
  }

      if (userId && total > 0) {
        const [memberRows] = await connection.query(
          `SELECT affiliate_upline
          FROM users
          WHERE user_id = ?
          LIMIT 1`,
          [userId]
        );

        const affiliateUpline = normalizeText(memberRows[0]?.affiliate_upline || '');

        if (affiliateUpline) {
          const [uplineRows] = await connection.query(
            `SELECT affiliate_id, affiliate_tier, level, commission_rate, total_referrals, total_downlines
            FROM affiliate_networks
            WHERE affiliate_id = ?
            LIMIT 1
            FOR UPDATE`,
            [affiliateUpline]
          );

          if (uplineRows.length) {
            const upline = uplineRows[0];
            const nextTier = resolveAffiliateTierByReferrals(upline.total_downlines || 0);
            const commissionRate = Number(upline.commission_rate || nextTier.commission_rate);
            const commissionEarned = Number((total * commissionRate).toFixed(2));
            const totalDownlines = Number(upline.total_downlines || 0);

            const tierSnapshot = resolveAffiliateTierByReferrals(totalDownlines);

            await connection.query(
              `UPDATE affiliate_networks
              SET commission_points = commission_points + ?,
                  total_points = total_points + ?,
                  affiliate_tier = ?,
                  level = ?,
                  commission_rate = ?
              WHERE affiliate_id = ?`,
              [
                commissionEarned,
                commissionEarned,
                tierSnapshot.affiliate_tier,
                tierSnapshot.level,
                tierSnapshot.commission_rate,
                affiliateUpline,
              ]
            );

            await connection.query(
              `INSERT INTO affiliate_commission_logs (
                affiliate_id,
                member_id,
                transaction_code,
                transaction_amount,
                commission_earned
              ) VALUES (?, ?, ?, ?, ?)`,
              [affiliateUpline, userId, transactionCode, total, commissionEarned]
            );
          }
        }
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
        order_code,
        member_code,
        service_type,
        subtotal,
        discount,
        total,
        points_earned,
        points_used,
        payment_method,
        created_at
      FROM orders
      WHERE order_code = ?
      LIMIT 1`,
      [transactionCode]
    );

    if (!transactionRows.length) {
      return res.status(404).json({ success: false, error: 'Transaction tidak ditemukan.' });
    }

    const itemRows = await query(
      `SELECT
        id,
        order_code,
        product_code,
        product_name_snapshot,
        price_snapshot,
        qty,
        subtotal
      FROM order_items
      WHERE order_code = ?
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

    const allowedPointTypes = new Set(['commission', 'cashback']);
    if (!allowedPointTypes.has(pointType)) {
      return res.status(400).json({ success: false, error: 'point_type tidak valid.' });
    }

    const userRows = await query(`SELECT user_id FROM users WHERE user_id = ? LIMIT 1`, [userId]);
    if (!userRows.length) {
      return res.status(404).json({ success: false, error: 'User tidak ditemukan.' });
    }

    const result = await withTransaction(async (connection) => {
      const [pointRows] = await connection.query(
        `SELECT total_points, commission_points, cashback_points
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
      const nextCashback = Number(current.cashback_points || 0) + (pointType === 'cashback' ? points : 0);
      const nextTotal = Number(current.total_points || 0) + points;

      await connection.query(
        `UPDATE user_points
        SET total_points = ?,
            commission_points = ?,
            cashback_points = ?
        WHERE user_id = ?`,
        [nextTotal, nextCommission, nextCashback, userId]
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

export async function getTransactionHistory(req, res) {
  try {
    const userId = String(req.user?.user_id || req.params?.user_id || req.query?.user_id || '').trim();
    if (!userId) {
      return res.status(400).json({ message: 'user_id wajib diisi.' });
    }

    const transactions = await query(
      `SELECT
        o.id AS order_id,
        o.order_code,
        o.user_id,
        o.nama_pelanggan,
        o.service_type,
        o.subtotal,
        o.discount,
        o.total,
        o.payment_method,
        o.points_earned,
        o.points_used,
        o.order_type,
        o.created_at,
        oi.id AS order_item_id,
        oi.product_id,
        oi.product_name_snapshot,
        oi.price_snapshot,
        oi.qty,
        oi.subtotal AS item_subtotal
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC, oi.id ASC`,
      [userId]
    );

    if (!transactions.length) {
      return res.json({
        message: 'Tidak ada riwayat transaksi',
        data: [],
      });
    }

    const grouped = new Map();
    for (const row of transactions) {
      if (!grouped.has(row.order_code)) {
        grouped.set(row.order_code, {
          order_id: Number(row.order_id || 0),
          order_code: row.order_code,
          user_id: row.user_id,
          nama_pelanggan: row.nama_pelanggan,
          service_type: row.service_type,
          subtotal: Number(row.subtotal || 0),
          discount: Number(row.discount || 0),
          total: Number(row.total || 0),
          payment_method: row.payment_method,
          points_earned: Number(row.points_earned || 0),
          points_used: Number(row.points_used || 0),
          order_type: row.order_type,
          transaction_date: row.created_at,
          items: [],
        });
      }
      const tx = grouped.get(row.order_code);
      tx.items.push({
        order_item_id: Number(row.order_item_id || 0),
        product_id: row.product_id,
        product_name_snapshot: row.product_name_snapshot,
        price_snapshot: Number(row.price_snapshot || 0),
        qty: Number(row.qty || 0),
        item_subtotal: Number(row.item_subtotal || 0),
      });
    }

    return res.json({
      message: 'Riwayat transaksi berhasil diambil',
      data: Array.from(grouped.values()),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function getAllCommissionLogs(_req, res) {
  try {
    const rows = await query(
      `SELECT
        acl.id,
        acl.affiliate_id,
        acl.member_id,
        acl.transaction_code,
        acl.transaction_amount,
        acl.commission_earned,
        acl.created_at,
        u_affiliate.username AS affiliate_username,
        u_member.username AS member_username
      FROM affiliate_commission_logs acl
      LEFT JOIN affiliate_networks an ON an.affiliate_id = acl.affiliate_id
      LEFT JOIN users u_affiliate ON u_affiliate.user_id = an.user_id
      LEFT JOIN users u_member ON u_member.user_id = acl.member_id
      ORDER BY acl.created_at DESC`
    );

    return res.json({
      success: true,
      data: rows.map((row) => ({
        id: row.id,
        affiliate_id: row.affiliate_id,
        affiliate_username: row.affiliate_username || null,
        member_id: row.member_id,
        member_username: row.member_username || null,
        transaction_code: row.transaction_code,
        transaction_amount: Number(row.transaction_amount || 0),
        commission_earned: Number(row.commission_earned || 0),
        created_at: row.created_at,
      })),
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function lookupMember(req, res) {
  try {
    const code = String(req.body?.code || req.body?.user_id || '').trim();
    if (!code) {
      return res.status(400).json({ success: false, error: 'code wajib diisi.' });
    }

    const [rows] = await query(
      `SELECT user_id, username, phone_number, email, status, created_at
      FROM users
      WHERE user_id = ? OR phone_number = ? OR username = ?
      LIMIT 1`,
      [code, code, code]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'User tidak ditemukan.' });
    }

    const userRow = rows[0];

    const pointsPayload = await buildPointsPayload(userRow.user_id);

    return res.json({
      success: true,
      user: {
        ...buildPublicUser(userRow),
        membership_level: pointsPayload.memberLevel,
        memberLevel: pointsPayload.memberLevel,
        points: pointsPayload,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function getRecommendedProducts(_req, res) {
  try {
    const rows = await query(
      `SELECT
        id,
        code,
        name,
        price,
        image_url,
        description,
        cashback_reward
      FROM products
      WHERE product_type = 'kiosk'
        AND is_active = 1
        AND is_recommended = 1
      ORDER BY created_at DESC`,
    );

const baseUrl = _req.app?.get?.('baseUrl') || 'http://0.0.0.0:4000';

    return res.json({
      success: true,
      data: rows.map((row) => {
        let imageUrl = row.image_url || null;
        if (imageUrl && !imageUrl.startsWith('http')) {
          imageUrl = `${baseUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
        }
        return {
          id: row.id,
          code: row.code,
          name: row.name,
          price: Number(row.price || 0),
          image_url: imageUrl,
          description: row.description || null,
          cashback_reward: Number(row.cashback_reward || 0),
        };
      }),
    });
  } catch (error) {
    console.error('[getRecommendedProducts] Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}