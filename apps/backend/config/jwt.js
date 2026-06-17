import jwt from 'jsonwebtoken';

const DEFAULT_JWT_SECRET = 'ngolab-dev-membership-secret';
const DEFAULT_JWT_EXPIRES_IN = '7d';

function getJwtConfig() {
  const secret = String(process.env.JWT_SECRET || process.env.MEMBERSHIP_JWT_SECRET || DEFAULT_JWT_SECRET).trim();
  const expiresIn = String(process.env.JWT_EXPIRES_IN || DEFAULT_JWT_EXPIRES_IN).trim();

  return {
    secret,
    expiresIn,
  };
}

export function createMembershipToken(user) {
  const { secret, expiresIn } = getJwtConfig();

  if (!secret) {
    throw new Error('JWT_SECRET tidak terdefinisi.');
  }

  const payload = {
    type: 'membership',
    sub: String(user?.user_id || ''),
    user_id: String(user?.user_id || ''),
    username: String(user?.username || ''),
    email: String(user?.email || ''),
    role: String(user?.role || ''),
  };

  try {
    const token = jwt.sign(payload, secret, { expiresIn });

    return {
      token,
      accessToken: token,
      expiresIn,
      tokenType: 'Bearer',
    };
  } catch (error) {
    console.error('[JWT] Error creating token:', error);
    throw error;
  }
}

export function verifyMembershipToken(token) {
  const { secret } = getJwtConfig();
  return jwt.verify(token, secret);
}
