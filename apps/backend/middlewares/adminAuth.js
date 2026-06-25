import { verifyAdminToken } from '../config/jwt.js';

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

export function requireAdminJwt(req, res, next) {
  try {
    const token = getBearerToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token otorisasi diperlukan.',
      });
    }

    const decoded = verifyAdminToken(token);
    req.adminAuth = decoded;
    console.log('[ADMIN JWT PAYLOAD]', req.adminAuth);
    return next();
  } catch (error) {
    const message = String(error?.name || '').toLowerCase() === 'tokenexpirederror'
      ? 'Token sudah kadaluarsa.'
      : 'Token tidak valid.';

    return res.status(401).json({
      success: false,
      error: message,
    });
  }
}