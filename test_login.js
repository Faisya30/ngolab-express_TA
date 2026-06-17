import http from 'http';

async function test() {
  // Test login dengan user yang baru dibuat sebelumnya
  console.log('=== TEST LOGIN ===');
  const loginData = JSON.stringify({
    username: 'testuser_1781688802969',
    password: 'password123'
  });
  
  const loginReq = http.request({
    hostname: '10.20.112.106',
    port: 4000,
    path: '/api/membership/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginData)
    }
  }, (res) => {
    let body = '';
    console.log('Login STATUS:', res.statusCode);
    res.on('data', d => body += d);
    res.on('end', () => {
      console.log('Login Response:', body);
    });
  });
  loginReq.on('error', e => console.log('Login Error:', e.message));
  loginReq.write(loginData);
  loginReq.end();
}

test();