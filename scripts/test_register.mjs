const fetch = globalThis.fetch || (await import('node-fetch')).default;

async function run() {
  const url = 'http://127.0.0.1:4000/api/membership/register';
  const body = {
    username: 'qa_nim_script',
    email: 'qa_nim_script+123@example.com',
    password: 'Secret123!',
    nim: '1301201234'
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    console.log('STATUS', res.status);
    console.log('BODY', text);
  } catch (err) {
    console.error('FETCH ERROR', err);
  }
}

run();
