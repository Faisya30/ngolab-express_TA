import dotenv from 'dotenv';

dotenv.config();

function unique(items) {
  return items.filter((item, index) => items.indexOf(item) === index);
}

export function getServerConfig() {
  const port = Number(process.env.PORT || 4000);
  const frontendOrigins = unique([
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    ...String(process.env.FRONTEND_ORIGIN || '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  ]).map((origin) => origin.trim());

  return { port, frontendOrigins };
}

export function validateEnvironment() {
  const recommended = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_NAME', 'FRONTEND_ORIGIN'];
  const missing = recommended.filter((key) => !String(process.env[key] || '').trim());

  if (missing.length) {
    console.warn(`Env warning: missing recommended variables: ${missing.join(', ')}`);
  }
}
