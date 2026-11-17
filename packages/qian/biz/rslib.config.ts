import { defineConfig } from '@rslib/core';

// ESM + d.ts（docs/prd/specs/yue.md §4.1、PRD §07 7.15.2「技术落点」）；dependencies / peerDependencies 默认外置。
// 测试文件只在 tsconfig.json 里参与类型检查，不进 dist（tsconfig.build.json）。
export default defineConfig({
  lib: [{ format: 'esm', syntax: 'es2022', dts: true }],
  source: { entry: { index: './src/index.ts' }, tsconfigPath: './tsconfig.build.json' },
  // 发布的 ESM 显式导入 JSX runtime，不依赖消费方提供全局 React。0.2.0 漏了这一行，dist 里是没有绑定的 React.createElement；
  // scripts/release/pack.mjs 现在会查出这种制品。
  tools: { swc: { jsc: { transform: { react: { runtime: 'automatic' } } } } },
  output: { target: 'web' },
});
