export default {
  async uploadFile(buffer, key, mime) {
    return `mock/${key}`;
  },
  async deleteFile(key) {
    return true;
  },
  async fileExists(key) {
    return true;
  },
  async getFileStream(key) {
    const { Readable } = await import('stream');
    const stream = Readable.from(['mock content']);
    return stream;
  },
};
