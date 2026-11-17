import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { LAYER_SCOPE, QIAN_PACKAGES, allowedDependencies, isLayerPackageName } from '../../../packages/qian/boundaries.config.mjs';

// 包形状门禁：每个层包（packages/qian/*）的 package.json 与矩阵、catalog、发布形状一致（docs/prd/specs/yue.md §3.1、§4.1；PRD §07 7.15.2）。
const ROOT = path.resolve(__dirname, '../../..');
const QIAN_DIR = path.join(ROOT, 'packages', 'qian');

interface Pkg {
  name: string;
  version: string;
  private?: boolean;
  type?: string;
  exports?: Record<string, unknown>;
  publishConfig?: { access?: string; exports?: Record<string, unknown> };
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
  files?: string[];
}

const dirs = fs
  .readdirSync(QIAN_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory() && fs.existsSync(path.join(QIAN_DIR, d.name, 'package.json')))
  .map((d) => d.name);
const packages = dirs.map((dir) => ({ dir, pkg: JSON.parse(fs.readFileSync(path.join(QIAN_DIR, dir, 'package.json'), 'utf8')) as Pkg }));

describe('packages/qian/* 的 package.json', () => {
  it('至少建立了 S1 的包，目录名与包名一致且都登记在分层矩阵里', () => {
    expect(dirs).toEqual(expect.arrayContaining(['tokens', 'contracts', 'core', 'sdk', 'shell', 'data', 'form', 'biz']));
    for (const { dir, pkg } of packages) {
      expect(pkg.name).toBe(`@cavailab/qian-${dir}`);
      expect(QIAN_PACKAGES).toContain(dir);
    }
  });

  it('dependencies 里的层包不超出矩阵允许范围，且用 workspace 协议', () => {
    for (const { dir, pkg } of packages) {
      const allowed = allowedDependencies(dir);
      for (const [name, range] of Object.entries(pkg.dependencies ?? {})) {
        if (!isLayerPackageName(name)) continue;
        expect(allowed, `${pkg.name} 不得依赖 ${name}`).toContain(name.slice(LAYER_SCOPE.length));
        expect(range).toMatch(/^workspace:/);
      }
    }
  });

  it('packages/qian 下的包同一版本、ESM、开发期 exports 指源码、publishConfig 指 dist、第三方依赖走 catalog', () => {
    const versions = new Set(packages.map((p) => p.pkg.version));
    expect(versions.size).toBe(1);
    for (const { pkg } of packages) {
      expect(pkg.private).toBeUndefined();
      expect(pkg.type).toBe('module');
      expect(pkg.exports?.['.']).toBe('./src/index.ts');
      expect(pkg.publishConfig?.access).toBe('public');
      expect(pkg.publishConfig?.exports?.['.']).toEqual({ types: './dist/index.d.ts', default: './dist/index.js' });
      expect(pkg.files).toContain('dist');
      expect(pkg.scripts?.build).toBe('rslib build');
      expect(pkg.scripts?.publint).toMatch(/^publint/);
      expect(pkg.peerDependencies?.react).toBeDefined();
      for (const [name, range] of Object.entries({ ...pkg.dependencies, ...pkg.devDependencies })) {
        if (isLayerPackageName(name)) continue;
        expect(range, `${pkg.name} 的 ${name} 要写 catalog:`).toBe('catalog:');
      }
    }
  });
});
