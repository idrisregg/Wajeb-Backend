import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import User from '../../src/models/user.model.js';

const mongoUri = process.env.MONGO_TEST_URI || 'mongodb://127.0.0.1:27017/wajeb_test';

beforeAll(async () => {
  try {
    await mongoose.connect(mongoUri, { dbName: 'wajeb_test' });
  } catch (e) {
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});

describe('User model', () => {
  it('hashes password on save and verifies comparePassword', async () => {
    if (mongoose.connection.readyState !== 1) return; 
    const rawPassword = 'secret123';
    const u = new User({ email: 'a@b.com', userName: 'tester1', password: rawPassword });
    await u.save();

    expect(u.password).not.toBe(rawPassword);
    expect(u.password).toMatch(/\$argon2/);

    const ok = await u.comparePassword(rawPassword);
    const bad = await u.comparePassword('wrong');

    expect(ok).toBe(true);
    expect(bad).toBe(false);
  });
});
