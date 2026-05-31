import fetch from 'node-fetch';

const BASE = process.env.BACKEND_URL || 'http://192.168.110.6:4000';
const referral = process.env.REFERRAL_CODE || '';

const payload = {
  username: `testuser_${Date.now()}`,
  email: `test_${Date.now()}@example.com`,
  password: 'Pass1234!',
};
if (referral) payload.referred_by = referral;

(async () => {
  console.log('Posting register to', BASE + '/api/membership/register');
  try {
    const res = await fetch(BASE + '/api/membership/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Response:', text);
  } catch (err) {
    console.error('Request failed', err && err.message ? err.message : err);
    process.exit(2);
  }
})();
