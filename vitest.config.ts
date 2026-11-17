import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// 前端工作区的测试入口（pnpm qian:test）：
// - qian-gates：门禁自测（分层边界、循环依赖、包形状），Node 环境；
// - qian-ssr：组件在 Node 里 renderToString（SSR 兼容是验证门的一项）；
// - packages/qian/*/vitest.config.ts：各包的浏览器测试（Vitest browser mode + Playwright）。
// 外壳接线、身份与租户开通界面的测试项随这些包留在后端仓库（S1-YUE-023）。
export default defineConfig({
  test: {
    projects: [
      { test: { name: 'qian-gates', environment: 'node', include: ['tests/gates/qian/**/*.test.ts'], testTimeout: 120_000, hookTimeout: 120_000 } },
      { plugins: [react()], test: { name: 'qian-ssr', environment: 'node', include: ['packages/qian/*/src/**/*.ssr.test.tsx'] } },
      { test: { name: 'core-contracts', environment: 'node', include: ['packages/qian/core/src/**/*.manifest.test.ts'] } },
      { test: { name: 'qian-plugin-sdk', environment: 'node', include: ['packages/qian-plugin-sdk/test/**/*.test.ts'] } },
      'packages/qian/*/vitest.config.ts',
    ],
  },
});
