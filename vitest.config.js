import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.js'],
    coverage: {
      reporter: ['text', 'html'],
    },
    pool: 'threads',
    restoreMocks: true,
    mockReset: true,
    clearMocks: true,
    hookTimeout: 20000,
  },
});
