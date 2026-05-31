import mysql from 'mysql2/promise';

const host = process.env.DB_HOST || '127.0.0.1';
const port = Number(process.env.DB_PORT || 3306);
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';
const database = process.env.DB_NAME || 'ngolab_express_system';

(async () => {
  console.log('Trying DB connect with', { host, port, user, database });
  try {
    const conn = await mysql.createConnection({ host, port, user, password, database, connectTimeout: 5000 });
    const [rows] = await conn.query('SELECT 1 AS ok');
    console.log('DB query result:', rows);
    await conn.end();
    process.exit(0);
  } catch (err) {
    console.error('DB connect error:', err && err.message ? err.message : err);
    process.exit(2);
  }
})();
