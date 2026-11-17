import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { name: 'qian-contracts', environment: 'node', include: ['src/**/*.test.ts'] } });
