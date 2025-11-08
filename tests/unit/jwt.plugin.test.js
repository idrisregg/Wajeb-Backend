import { describe, it, expect, beforeAll } from 'vitest';
import Fastify from 'fastify';
import jwtPlugin from '../../src/plugins/jwt.js';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';

describe('JWT plugin', () => {
  it('registers jwtAuth decorator and validates token', async () => {
    const app = Fastify();
    await app.register(jwtPlugin);

    app.get('/protected', { onRequest: [app.jwtAuth] }, async (req) => {
      return { ok: true, user: req.user };
    });

    const token = app.jwt.sign({ userId: '123', email: 'a@b.com' });

    const res = await app.inject({
      method: 'GET',
      url: '/protected',
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.ok).toBe(true);
    expect(body.user.userId).toBe('123');
  });

  it('rejects invalid token', async () => {
    const app = Fastify();
    await app.register(jwtPlugin);

    app.get('/protected', { onRequest: [app.jwtAuth] }, async () => ({ ok: true }));

    const res = await app.inject({
      method: 'GET',
      url: '/protected',
      headers: { Authorization: 'Bearer bad.token.here' },
    });

    expect(res.statusCode).toBe(401);
  });
});
