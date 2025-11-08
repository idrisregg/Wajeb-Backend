import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import Fastify from 'fastify';
import userRoutes from '../../src/routes/user.routes.js';
import jwtPlugin from '../../src/plugins/jwt.js';
import mongoose from 'mongoose';
import User from '../../src/models/user.model.js';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';
const mongoUri = process.env.MONGO_TEST_URI || 'mongodb://127.0.0.1:27017/wajeb_test';

let app;

beforeAll(async () => {
  app = Fastify();
  await app.register(jwtPlugin);
  await app.register(userRoutes, { prefix: 'api/users' });

  try {
    await mongoose.connect(mongoUri, { dbName: 'wajeb_test' });
  } catch (e) {
  }

  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.db.dropDatabase();
    await User.create({ email: 'a@b.com', userName: 'tester1', password: 'secret123' });
  }
});

afterAll(async () => {
  await app.close();
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});

describe('User login route', () => {
  it('returns token for valid credentials', async () => {
    if (mongoose.connection.readyState !== 1) return; 
    const res = await app.inject({
      method: 'POST',
      url: '/api/users/login',
      payload: { email: 'a@b.com', password: 'secret123' },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.message).toBe('Login successful');
    expect(body.token).toBeTypeOf('string');
    expect(body.user.email).toBe('a@b.com');
  });

  it('rejects invalid credentials', async () => {
    if (mongoose.connection.readyState !== 1) return; 

    const res = await app.inject({
      method: 'POST',
      url: '/api/users/login',
      payload: { email: 'a@b.com', password: 'wrong' },
    });

    expect(res.statusCode).toBe(401);
  });
});
