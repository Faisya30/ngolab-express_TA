export const CONNECTION_KEY = 'isi_key_kamu';
export const CONNECTION_KEY_HEADER = 'x-connection-key';

export function requireConnectionKey(_req, _res, next) {
  const headerValue = String(_req.headers[CONNECTION_KEY_HEADER] || '').trim();

  if (headerValue && headerValue === CONNECTION_KEY) {
    return next();
  }

  return _res.status(403).json({
    success: false,
    error: 'Koneksi tidak diizinkan: Connection Key tidak valid.'
  });
} 