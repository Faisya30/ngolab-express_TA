import bcrypt from 'bcryptjs';

const hash = '$2a$10$2S/tB8i5SqA2wnJdyRrRhum/SFWRYuLCwDTmvolmJIu0T.pY0ryEO';
const password = '123';

bcrypt.compare(password, hash).then(result => {
  console.log(`Password "${password}" matches hash:`, result);
  process.exit(0);
}).catch(e => {
  console.error('bcrypt error:', e.message);
  process.exit(1);
});
