// 前端工作区（packages/qian/*、apps/*、前端插件开发包）的 ESLint 配置：代码规则 + qian 分层边界。
// 只跑边界门禁用 eslint.boundaries.config.mjs。
import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { qianBoundariesConfig } from './packages/qian/boundaries.config.mjs';
import { noHardcodedText } from './packages/qian/sdk/eslint-i18n.mjs';

export default tseslint.config(
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/.turbo/**', '**/playwright-report/**', '**/test-results/**', '**/.lighthouseci/**', 'tests/gates/qian/fixtures/**'],
  },
  {
    files: ['packages/qian/**/*.{ts,tsx,mts}', 'apps/**/*.{ts,tsx,mts}', 'packages/qian-plugin-sdk/**/*.{ts,tsx,mts}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended, reactHooks.configs.flat.recommended],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: ['packages/qian/**/*.mjs', 'apps/**/*.mjs', 'packages/qian-plugin-sdk/**/*.mjs', '**/*.cjs'],
    extends: [js.configs.recommended],
    languageOptions: { globals: { ...globals.node } },
  },
  ...qianBoundariesConfig,
  {
    files: ['packages/qian/{sdk,shell,data,form,biz}/src/**/*.{ts,tsx}'],
    ignores: ['**/*.test.ts', '**/*.test.tsx', '**/test/**', '**/*.generated.ts', '**/i18n.ts', '**/locales.ts'],
    plugins: { 'qian-i18n': { rules: { 'no-hardcoded-text': noHardcodedText } } },
    rules: { 'qian-i18n/no-hardcoded-text': 'error' },
  },
);
