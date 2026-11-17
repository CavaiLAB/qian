#!/usr/bin/env node
// 干净消费者验证（S1-YUE-022）：在仓库外的空目录里新建一个项目，只用 10 个包的制品装起来，
// 再做一次类型检查与生产构建。第三方依赖从公共 npm 源装，版本取工作区里装着的版本。
//
//   node scripts/release/consumer.mjs archive <pack.mjs 的输出目录>   用本地 tarball（打包验证）
//   node scripts/release/consumer.mjs registry                       从 GitHub Packages 装已发布的版本（发布之后）
//
// registry 模式要环境变量 NODE_AUTH_TOKEN（能读 @cavailab 包的令牌）。
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { PACKAGES, REGISTRY, REQUIRED_FILES, ROOT, SCOPE, tarballName, workspacePackage } from './packages.mjs';

const [mode, packDirectory] = process.argv.slice(2);
assert(['archive', 'registry'].includes(mode), '用法：node scripts/release/consumer.mjs archive <打包目录> | registry');
if (mode === 'archive') assert(packDirectory, 'archive 模式要 pack.mjs 的输出目录');
if (mode === 'registry') assert(process.env.NODE_AUTH_TOKEN, 'registry 模式要 NODE_AUTH_TOKEN');

const versions = Object.fromEntries(PACKAGES.map(({ name, dir }) => [name, workspacePackage(dir).version]));
const archives = mode === 'archive'
  ? Object.fromEntries(PACKAGES.map(({ name }) => {
      const archive = path.join(path.resolve(packDirectory), tarballName(name, versions[name]));
      assert(existsSync(archive), `缺少 ${archive}，先跑 pack.mjs`);
      return [name, `file:${archive}`];
    }))
  : null;

// 第三方依赖的版本取工作区实际装着的（演练场的依赖覆盖了要用的这几样）。
// 有的包不在 exports 里导出 package.json，直接读演练场 node_modules 下的那一份（pnpm 的链接指向真实目录）。
const installed = (name) => JSON.parse(readFileSync(path.join(ROOT, 'apps/qian-playground/node_modules', name, 'package.json'), 'utf8')).version;
const thirdParty = Object.fromEntries(['react', 'react-dom'].map((name) => [name, installed(name)]));
const tooling = Object.fromEntries(['typescript', '@types/react', '@types/react-dom', 'vite', '@vitejs/plugin-react', 'tailwindcss', '@tailwindcss/vite'].map((name) => [name, installed(name)]));

const directory = mkdtempSync(path.join(tmpdir(), 'qian-consumer-'));
assert(!path.relative(ROOT, directory).match(/^[^.]/), '消费者目录必须在仓库外');
const write = (file, content) => { mkdirSync(path.dirname(path.join(directory, file)), { recursive: true }); writeFileSync(path.join(directory, file), content); };
let keep = false;
try {
  const internal = Object.fromEntries(PACKAGES.map(({ name }) => [name, mode === 'archive' ? archives[name] : versions[name]]));
  write('package.json', JSON.stringify({
    name: 'qian-consumer', private: true, type: 'module',
    dependencies: { ...internal, ...thirdParty },
    devDependencies: tooling,
    // 包之间的依赖写的是真实版本；本地验证时让它们也落到同一批 tarball 上，不去包源里找。
    ...(mode === 'archive' ? { overrides: archives } : {}),
  }, null, 2) + '\n');
  write('user.npmrc', `registry=https://registry.npmjs.org/\n${SCOPE}:registry=${REGISTRY}\n` + (process.env.NODE_AUTH_TOKEN ? `//${new URL(REGISTRY).host}/:_authToken=\${NODE_AUTH_TOKEN}\n` : ''));
  const env = { ...process.env, NPM_CONFIG_USERCONFIG: path.join(directory, 'user.npmrc'), NPM_CONFIG_CACHE: path.join(directory, '.npm-cache'), NPM_CONFIG_UPDATE_NOTIFIER: 'false' };
  const npm = (...args) => execFileSync('npm', args, { cwd: directory, env, stdio: ['ignore', 'inherit', 'inherit'] });
  npm('install', '--ignore-scripts', '--no-audit', '--no-fund');

  // 装进来的是真实制品：不是链接，名字与版本对得上，来源是 tarball 或 GitHub Packages。
  const lock = JSON.parse(readFileSync(path.join(directory, 'package-lock.json'), 'utf8'));
  for (const { name } of PACKAGES) {
    const location = path.join(directory, 'node_modules', name);
    assert(!lstatSync(location).isSymbolicLink(), `${name} 是链接，不是制品`);
    const pkg = JSON.parse(readFileSync(path.join(location, 'package.json'), 'utf8'));
    assert.equal(pkg.name, name); assert.equal(pkg.version, versions[name]);
    assert.equal(pkg.license, 'MIT', `${name} 的 license`);
    const resolved = lock.packages[`node_modules/${name}`]?.resolved ?? '';
    if (mode === 'registry') assert.equal(new URL(resolved).host, new URL(REGISTRY).host, `${name} 不是从 GitHub Packages 装的：${resolved}`);
    else assert(resolved.endsWith(tarballName(name, versions[name])), `${name} 不是从本地 tarball 装的：${resolved}`);
    for (const file of REQUIRED_FILES[name] ?? []) assert(existsSync(path.join(location, file)), `${name} 的安装目录里没有 ${file}`);
  }
  const nested = lock.packages ? Object.keys(lock.packages).filter((key) => key.includes(`node_modules/${SCOPE}/`) && key.split('node_modules/').length > 2) : [];
  assert.deepEqual(nested, [], `出现了嵌套的第二份内部包：${nested.join(', ')}`);

  // 后端从安装目录读的两样东西（docs/migration.md 第 4 节）。
  const coreDir = path.join(directory, 'node_modules/@cavailab/qian-core');
  const manifest = JSON.parse(readFileSync(path.join(coreDir, 'dist/qian-manifest.json'), 'utf8'));
  assert(manifest.length > 0 && manifest.every((item) => item.package === '@cavailab/qian-core' && item.version === versions['@cavailab/qian-core']), '组件清单的 package / version 不对');
  const contract = JSON.parse(readFileSync(path.join(directory, 'node_modules/@cavailab/qian-biz/contracts/biz.openapi.json'), 'utf8'));
  assert.match(contract.openapi ?? '', /^3\./, '业务选择器的接口契约不是 OpenAPI 3');

  write('tsconfig.json', JSON.stringify({
    compilerOptions: {
      target: 'ES2022', lib: ['ES2023', 'DOM', 'DOM.Iterable'], module: 'ESNext', moduleResolution: 'bundler', jsx: 'react-jsx',
      strict: true, noEmit: true, resolveJsonModule: true, isolatedModules: true, skipLibCheck: true, types: [],
    },
    include: ['src'],
  }, null, 2) + '\n');
  write('index.html', '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>qian 消费者验证</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>\n');
  write('src/vite-env.d.ts', '/// <reference types="vite/client" />\n');
  write('src/index.css', `@import 'tailwindcss';\n@import '${SCOPE}/qian-tokens/theme.css';\n@source '../node_modules/${SCOPE}';\n`);
  write('src/main.tsx', `import './index.css';
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { PACKAGE_NAME as TOKENS, initializeTheme } from '@cavailab/qian-tokens';
import { componentManifestSchema, type ComponentManifest } from '@cavailab/qian-contracts';
import { PlatformClient, createI18n } from '@cavailab/qian-sdk';
import { Button, cn, type QianProps } from '@cavailab/qian-core';
import * as coreShell from '@cavailab/qian-core/shell';
import catalog from '@cavailab/qian-core/manifest.json';
import { PACKAGE_NAME as FORM } from '@cavailab/qian-form';
import { Tree, type TreeNode } from '@cavailab/qian-data';
import { AppShell, Page, PageHeader, PreferencesProvider, initPreferences, installShellLanguagePacks } from '@cavailab/qian-shell';
import { initPreferences as initFromSubpath } from '@cavailab/qian-shell/preferences';
import { PACKAGE_NAME as BIZ, useRemoteOptions } from '@cavailab/qian-biz';
import { PluginLoader, defineEvent } from '@cavailab/qian-runtime';
import { SLOT_IDS, ShellHost, validateManifest } from '@cavailab/qian-plugin-sdk';
import { adaptFederation } from '@cavailab/qian-plugin-sdk/federation';

const describe = (manifest: ComponentManifest) => manifest.package + '@' + manifest.version + ':' + manifest.name;
const manifests = catalog.map((item) => describe(item as unknown as ComponentManifest));
const props: QianProps<{ title?: string }> = { testId: 'consumer-proof', className: cn('p-4') };
const i18n = createI18n(); installShellLanguagePacks(i18n);
const preferences = initPreferences({ namespace: 'consumer', storage: null });
const nodes: TreeNode[] = [{ id: 'root', label: '根', children: [{ id: 'leaf', label: '叶' }] }];
const client = new PlatformClient({ baseUrl: 'https://consumer.test', transport: async () => Response.json({}) });
const proof = [TOKENS, FORM, BIZ, componentManifestSchema.title, manifests.length, SLOT_IDS.length, typeof ShellHost, typeof validateManifest,
  typeof adaptFederation, typeof useRemoteOptions, typeof initFromSubpath, Object.keys(coreShell).length, client instanceof PlatformClient, typeof PluginLoader, typeof defineEvent];
initializeTheme({ storageKey: 'qian-consumer-theme' });

function App() {
  const [count, setCount] = useState(0);
  return (
    <PreferencesProvider store={preferences}>
      <AppShell i18n={i18n} brand="qian 消费者" menu={[]}>
        <Page header={<PageHeader title="消费者验证" />}>
          <Button {...props} onClick={() => setCount(count + 1)}>点了 {count} 次</Button>
          <Tree nodes={nodes} aria-label="树" />
          <pre>{JSON.stringify(proof)}</pre>
        </Page>
      </AppShell>
    </PreferencesProvider>
  );
}
createRoot(document.getElementById('root')!).render(<App />);
`);
  write('build.mjs', `import { build } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
await build({ root: import.meta.dirname, configFile: false, logLevel: 'warn', plugins: [react(), tailwindcss()] });
`);

  const tsc = path.join(directory, 'node_modules/typescript/bin/tsc');
  execFileSync(process.execPath, [tsc, '-p', 'tsconfig.json'], { cwd: directory, env, stdio: 'inherit' });
  // 声明文件检查：连同各包与第三方的 .d.ts 一起再查一遍（skipLibCheck: false）。
  // 本仓库 10 个包的声明文件有错误就不通过（使用方不跳过库检查时会撞上）；第三方的只报告，不计入结论。
  // 不落在第三方声明文件里的错误（消费者自己的源码、没有文件位置的全局错误）也不通过。
  const ownDeclarations = new RegExp(`^node_modules/(?:${PACKAGES.map(({ name }) => name.replace('/', '\\/')).join('|')})/`);
  const declarationErrors = { own: [], thirdParty: [] };
  try {
    execFileSync(process.execPath, [tsc, '-p', 'tsconfig.json', '--skipLibCheck', 'false'], { cwd: directory, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (error) {
    const lines = String(error.stdout ?? '').split('\n').filter((line) => /error TS\d+:/.test(line));
    assert(lines.length, `声明文件检查失败，但没有读到 TS 错误：${error.message}`);
    for (const line of lines) {
      const file = line.match(/^(.+?)\(\d+,\d+\): error/)?.[1] ?? '';
      const thirdParty = file.startsWith('node_modules/') && !ownDeclarations.test(file) && /\.d\.[cm]?ts$/.test(file);
      declarationErrors[thirdParty ? 'thirdParty' : 'own'].push(line.trim());
    }
  }
  assert.deepEqual(declarationErrors.own, [], `本仓库包的声明文件（或消费者源码）在 skipLibCheck: false 下有错误：\n${declarationErrors.own.join('\n')}`);
  const thirdPartyDeclarations = [...new Set(declarationErrors.thirdParty.map((line) => line.replace(/^node_modules\//, '').replace(/\(\d+,\d+\): error (TS\d+).*$/, ' $1')))];
  execFileSync(process.execPath, ['build.mjs'], { cwd: directory, env, stdio: 'inherit' });

  const assets = path.join(directory, 'dist/assets');
  const files = readdirSync(assets);
  const css = files.filter((file) => file.endsWith('.css')).map((file) => readFileSync(path.join(assets, file), 'utf8')).join('\n');
  const js = files.filter((file) => file.endsWith('.js')).map((file) => readFileSync(path.join(assets, file), 'utf8')).join('\n');
  assert(css.includes('--qian-primary'), '构建出的样式里没有 --qian-* 令牌');
  assert(!/--yue-|data-yue-|\byue-[a-z]/.test(css + js), '构建产物里还有 yue 前缀');
  assert(js.includes('qian-'), '构建产物里没有 qian- 测试标识');
  console.log(JSON.stringify({
    phase: 'consumer', mode, directory: '<临时目录>', packages: PACKAGES.map(({ name }) => `${name}@${versions[name]}`),
    thirdParty: { ...thirdParty, ...tooling }, typecheck: 'passed', build: 'passed', assets: files.length,
    ownDeclarations: 'passed',
    thirdPartyDeclarations: thirdPartyDeclarations.length ? thirdPartyDeclarations : 'passed',
    backendReads: ['@cavailab/qian-core/package.json#version', '@cavailab/qian-core/dist/qian-manifest.json', '@cavailab/qian-biz/contracts/biz.openapi.json'],
  }, null, 2));
} catch (error) {
  keep = Boolean(process.env.QIAN_CONSUMER_KEEP);
  throw error;
} finally {
  if (keep) console.error(`消费者目录保留在 ${directory}`);
  else rmSync(directory, { recursive: true, force: true });
}
