import dotenv from 'dotenv';

dotenv.config();

const baseUrl = String(process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 4000}`).replace(/\/$/, '');

async function check() {
  console.log('Checking health:', baseUrl + '/health');
  try {
    const res = await fetch(baseUrl + '/health');
    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Body:', text);
  } catch (err) {
    console.error('Health check error:', err.message || err);
  }

  // try membership users table existence via a simple GET to settings endpoint
  try {
    const res2 = await fetch(baseUrl + '/api/membership/settings');
    console.log('/api/membership/settings status:', res2.status);
    const body = await res2.text();
    console.log('Response body (truncated):', body ? body.slice(0, 300) : '');
  } catch (err) {
    console.error('Settings check error:', err.message || err);
  }
}

check().then(() => process.exit(0)).catch(() => process.exit(1));
