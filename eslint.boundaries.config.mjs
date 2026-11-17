// 只跑 qian 分层边界门禁（pnpm qian:boundaries）；规则本体在 packages/qian/boundaries.config.mjs。
import { qianBoundariesConfig } from './packages/qian/boundaries.config.mjs';

export default [
  { ignores: ['**/node_modules/**', '**/dist/**', 'tests/**'] },
  ...qianBoundariesConfig,
];
