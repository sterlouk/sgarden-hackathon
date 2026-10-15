import test from 'ava';
import { User } from '../src/models/index.js';
import validations from '../src/utils/validations.js';

test('User defaults and comparePassword', (t) => {
  const now = new Date();
  const u = new User({ email: 'a@b.com', username: 'u', password: 'secret' });
  t.truthy(u.lastActiveAt instanceof Date);
  t.is(u.role, 'user');

  // set a real hashed password and compare
  const hash = validations.passwordDigest('mypwd', 1);
  u.password = hash;
  t.true(u.comparePassword('mypwd'));
});
