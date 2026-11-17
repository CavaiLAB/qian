// 发布的 10 个包与它们在仓库里的目录（S1-YUE-022）。打包验证、发布与消费者验证共用这一份清单。
// 顺序按依赖：被依赖的在前。
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const REPOSITORY = 'CavaiLAB/qian';
export const REGISTRY = 'https://npm.pkg.github.com';
export const SCOPE = '@cavailab';

export const PACKAGES = Object.freeze([
  { name: '@cavailab/qian-tokens', dir: 'packages/qian/tokens' },
  { name: '@cavailab/qian-contracts', dir: 'packages/qian/contracts' },
  { name: '@cavailab/qian-sdk', dir: 'packages/qian/sdk' },
  { name: '@cavailab/qian-core', dir: 'packages/qian/core' },
  { name: '@cavailab/qian-form', dir: 'packages/qian/form' },
  { name: '@cavailab/qian-data', dir: 'packages/qian/data' },
  { name: '@cavailab/qian-shell', dir: 'packages/qian/shell' },
  { name: '@cavailab/qian-biz', dir: 'packages/qian/biz' },
  { name: '@cavailab/qian-runtime', dir: 'packages/qian-runtime' },
  { name: '@cavailab/qian-plugin-sdk', dir: 'packages/qian-plugin-sdk' },
].map(Object.freeze));

// 后端仓库从安装目录读的文件（docs/migration.md 第 4 节）：缺了就算打包失败。
export const REQUIRED_FILES = Object.freeze({
  '@cavailab/qian-biz': ['contracts/biz.openapi.json'],
  '@cavailab/qian-core': ['dist/qian-manifest.json'],
});

/** 工作区里某个包的 package.json。 */
export const workspacePackage = (dir) => JSON.parse(readFileSync(path.join(ROOT, dir, 'package.json'), 'utf8'));

/** pnpm pack 的产物文件名：@scope/name@1.2.3 → scope-name-1.2.3.tgz。 */
export const tarballName = (name, version) => `${name.slice(1).replace('/', '-')}-${version}.tgz`;
