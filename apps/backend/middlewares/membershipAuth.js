import { verifyMembershipToken } from '../config/jwt.js';

function getBearerToken(req) {
  const header = String(req.headers.authorization || '').trim();

  if (!header) {
    return null;
  }

  const [scheme, token] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null;
  }

  return token.trim();
}

function getTargetUserId(req) {
  return String(req.params?.user_id || req.body?.user_id || req.query?.user_id || '').trim();
}

export function requireMembershipJwt(req, res, next) {
  try {
    const token = getBearerToken(req);

    if (!token) {
      return res.status(401).json({ success: false, error: 'Authorization Bearer token wajib diisi.' });
    }

    const decoded = verifyMembershipToken(token);
    req.membershipAuth = decoded;
    console.log('[JWT PAYLOAD]', req.membershipAuth);
    return next();
  } catch (error) {
    const message = String(error?.name || '').toLowerCase() === 'tokenexpirederror'
      ? 'Token sudah kadaluarsa.'
      : 'Token tidak valid.';

    return res.status(401).json({ success: false, error: message });
  }
}

export function requireSelfMembershipAccess(req, res, next) {
  const authUserId = String(req.membershipAuth?.user_id || req.membershipAuth?.sub || '').trim();
  const targetUserId = getTargetUserId(req);

  if (!targetUserId) {
    return res.status(400).json({ success: false, error: 'user_id wajib diisi.' });
  }

  if (!authUserId || authUserId !== targetUserId) {
    return res.status(403).json({ success: false, error: 'Token tidak cocok dengan user_id.' });
  }

  return next();
}
