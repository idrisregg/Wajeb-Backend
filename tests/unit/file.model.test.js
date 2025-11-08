import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import File from '../../src/models/file.model.js';

const mongoUri = process.env.MONGO_TEST_URI || 'mongodb://127.0.0.1:27017/wajeb_test';

beforeAll(async () => {
  try {
    await mongoose.connect(mongoUri, { dbName: 'wajeb_test' });
  } catch {}
});

afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});

describe('File model', () => {
  it('sets default expiresAt ~ 7 days from now', async () => {
    if (mongoose.connection.readyState !== 1) return;
    const now = Date.now();
    const f = await File.create({
      fileName: 'u1',
      originalName: 'o1',
      filePath: 'p',
      fileSize: 1,
      mimeType: 'text/plain',
      uploadedBy: new mongoose.Types.ObjectId(),
      recipientUserName: 'rec',
      senderName: 'snd',
    });
    const diffDays = Math.round((f.expiresAt.getTime() - now) / (24*60*60*1000));
    expect(diffDays).toBeGreaterThanOrEqual(6);
    expect(diffDays).toBeLessThanOrEqual(7);
  });
});
