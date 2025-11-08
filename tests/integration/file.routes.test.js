import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import Fastify from 'fastify';
import jwtPlugin from '../../src/plugins/jwt.js';
import fileRoutes from '../../src/routes/file.routes.js';
import mongoose from 'mongoose';
import User from '../../src/models/user.model.js';
import File from '../../src/models/file.model.js';

vi.mock('../../src/services/s3Service.js', async () => {
  const mock = await import('../__mocks__/s3Service.mock.js');
  return { default: mock.default };
});

process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';
const mongoUri = process.env.MONGO_TEST_URI || 'mongodb://127.0.0.1:27017/wajeb_test';

let app;
let sender;
let recipient;
let senderToken;
let recipientToken;
let createdFile;

beforeAll(async () => {
  app = Fastify();
  await app.register(jwtPlugin);
  await app.register(fileRoutes, { prefix: 'api/files' });

  try {
    await mongoose.connect(mongoUri, { dbName: 'wajeb_test' });
  } catch {}

  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.db.dropDatabase();
    sender = await User.create({ email: 's@t.com', userName: 'sender', password: 'p4ssw0rd' });
    recipient = await User.create({ email: 'r@t.com', userName: 'recipient', password: 'p4ssw0rd' });

    senderToken = app.jwt.sign({ userId: sender._id.toString(), email: sender.email, userName: sender.userName });
    recipientToken = app.jwt.sign({ userId: recipient._id.toString(), email: recipient.email, userName: recipient.userName });

    createdFile = await File.create({
      fileName: 'f1',
      originalName: 'file.txt',
      filePath: 'mock/file.txt',
      fileSize: 10,
      mimeType: 'text/plain',
      uploadedBy: sender._id,
      recipientUserName: recipient.userName,
      senderName: 'Sender',
      description: 'desc',
      tags: ['a','b'],
      isPublic: false,
    });
  }
});

afterAll(async () => {
  await app.close();
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});

describe('File routes (protected)', () => {
  it('lists files for recipient', async () => {
    if (mongoose.connection.readyState !== 1) return;
    const res = await app.inject({
      method: 'GET',
      url: '/api/files',
      headers: { Authorization: `Bearer ${recipientToken}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.files.length).toBeGreaterThanOrEqual(1);
    expect(body.files[0].recipientUserName).toBe('recipient');
  });

  it('prevents non-authorized user from reading private file', async () => {
    if (mongoose.connection.readyState !== 1) return;
    const stranger = await User.create({ email: 'x@y.com', userName: 'stranger', password: 'p4ssw0rd' });
    const strangerToken = app.jwt.sign({ userId: stranger._id.toString(), email: stranger.email, userName: stranger.userName });

    const res = await app.inject({
      method: 'GET',
      url: `/api/files/${createdFile._id}`,
      headers: { Authorization: `Bearer ${strangerToken}` },
    });
    expect(res.statusCode).toBe(403);
  });

  it('allows sender to update file metadata', async () => {
    if (mongoose.connection.readyState !== 1) return;
    const res = await app.inject({
      method: 'PUT',
      url: `/api/files/${createdFile._id}`,
      headers: { Authorization: `Bearer ${senderToken}` },
      payload: { description: 'updated', tags: 'x,y', isPublic: 'true' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.file.description).toBe('updated');
    expect(body.file.isPublic).toBe(true);
  });

  it('allows recipient to delete file', async () => {
    if (mongoose.connection.readyState !== 1) return;
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/files/${createdFile._id}`,
      headers: { Authorization: `Bearer ${recipientToken}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.message).toBe('File deleted successfully');
  });
});
