import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: { host: '0.0.0.0' },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
