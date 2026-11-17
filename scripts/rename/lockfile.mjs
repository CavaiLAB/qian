#!/usr/bin/env node
// 更名（S1-YUE-022）之后重新生成锁文件、并与更名之前的锁文件逐项比对。锁文件只用 pnpm install 生成，不做文本替换。
//
//   node scripts/rename/lockfile.mjs regenerate      重新生成 pnpm-lock.yaml（两次 pnpm install，原因见下）
//   node scripts/rename/lockfile.mjs compare <提交>   把工作区里的 pnpm-lock.yaml 与 <提交> 里的逐项比对，名字按更名映射换算
//
// 为什么 regenerate 要跑两次：目录改名之后，pnpm 把 apps/qian-playground 当成新的工作区项目重新解析，
// 它的 @lhci/cli 那一支里 debug 的可选同伴依赖 supports-color 会取锁文件里最高的 10.2.2（来自 openapi-typescript），
// 而原锁文件里是 8.1.1（来自 api-extractor 的 @rushstack/terminal，根项目的同一支也是 8.1.1），结果多出 22 个快照。
// 先在演练场临时声明 supports-color@8.1.1 装一次，让这一支按原来的版本解析；再撤掉声明装一次，pnpm 沿用这份解析。
// 两次之后 package.json 与更名提交逐字节相同，锁文件除名字之外与原来逐项一致（compare 核对）。
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PLAYGROUND = path.join(ROOT, 'apps/qian-playground/package.json');
const pnpm = (...args) => execFileSync('pnpm', args, { cwd: ROOT, stdio: 'inherit' });

function regenerate() {
  const original = readFileSync(PLAYGROUND);
  const manifest = JSON.parse(original.toString('utf8'));
  assert(!manifest.devDependencies?.['supports-color'], '演练场已经声明了 supports-color，先撤掉');
  try {
    manifest.devDependencies['supports-color'] = '8.1.1';
    writeFileSync(PLAYGROUND, JSON.stringify(manifest, null, 2) + '\n');
    pnpm('install');
  } finally {
    writeFileSync(PLAYGROUND, original);
  }
  pnpm('install');
}

// 更名映射：内部包名与工作区目录。
const mapName = (value) => value.replace(/@idadawn\/yue-/g, '@cavailab/qian-').replace(/@idadawn\//g, '@cavailab/');
const mapPath = (value) => value.replace(/(^|\/)yue-playground(?=\/|$)/g, '$1qian-playground').replace(/(^|\/)yue(?=\/|$)/g, '$1qian');
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const KINDS = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'];

function compare(revision) {
  assert(revision, '用法：node scripts/rename/lockfile.mjs compare <更名之前的提交>');
  const YAML = createRequire(path.join(ROOT, 'packages/qian-runtime/package.json'))('yaml');
  const parse = (text) => YAML.parseAllDocuments(text).map((document) => document.toJS());
  const [before0, before] = parse(execFileSync('git', ['show', `${revision}:pnpm-lock.yaml`], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28 }));
  const [after0, after] = parse(readFileSync(path.join(ROOT, 'pnpm-lock.yaml'), 'utf8'));
  const rows = [];
  const row = (item, result, detail = []) => rows.push({ item, result, detail });

  row('包管理器自身的锁定（第一段）', same(before0, after0) ? '完全相同' : '不同');
  const importers = Object.keys(before.importers);
  const mapped = importers.map(mapPath).sort();
  row(`工作区项目 ${importers.length} 个（目录按更名映射换算）`, same(mapped, Object.keys(after.importers).sort()) ? '一一对应' : '不同',
    importers.filter((key) => key !== mapPath(key)).map((key) => `${key} → ${mapPath(key)}`));
  let direct = 0;
  const directDiff = [];
  for (const key of importers) {
    const b = before.importers[key];
    const a = after.importers[mapPath(key)] ?? {};
    for (const kind of KINDS) {
      const bd = Object.fromEntries(Object.entries(b[kind] ?? {}).map(([name, v]) => [mapName(name), { specifier: mapName(v.specifier ?? ''), version: mapPath(mapName(v.version ?? '')) }]));
      const ad = Object.fromEntries(Object.entries(a[kind] ?? {}).map(([name, v]) => [name, { specifier: v.specifier ?? '', version: v.version ?? '' }]));
      for (const name of new Set([...Object.keys(bd), ...Object.keys(ad)])) {
        direct += 1;
        if (!same(bd[name], ad[name])) directDiff.push(`${mapPath(key)} ${kind} ${name}：${JSON.stringify(bd[name])} → ${JSON.stringify(ad[name])}`);
      }
    }
    for (const field of Object.keys({ ...b, ...a })) if (!KINDS.includes(field) && !same(b[field], a[field])) directDiff.push(`${mapPath(key)} 的 ${field} 不同`);
  }
  row(`直接依赖 ${direct} 个的说明符与版本（内部包名按更名映射换算）`, directDiff.length ? `不同 ${directDiff.length} 个` : '逐个相同', directDiff);
  for (const section of ['packages', 'snapshots']) {
    const b = before[section] ?? {};
    const a = after[section] ?? {};
    const onlyBefore = Object.keys(b).filter((key) => !(key in a));
    const onlyAfter = Object.keys(a).filter((key) => !(key in b));
    const changed = Object.keys(b).filter((key) => key in a && !same(b[key], a[key]));
    const ok = !onlyBefore.length && !onlyAfter.length && !changed.length;
    row(`${section}：原 ${Object.keys(b).length} 个，新 ${Object.keys(a).length} 个`, ok ? '逐项相同' : '不同',
      [...onlyBefore.map((key) => `只在原锁文件：${key}`), ...onlyAfter.map((key) => `只在新锁文件：${key}`), ...changed.map((key) => `内容变了：${key}`)]);
  }
  for (const field of Object.keys({ ...before, ...after })) {
    if (['importers', 'packages', 'snapshots'].includes(field)) continue;
    row(`其它字段 ${field}`, same(before[field], after[field]) ? '相同' : '不同');
  }
  const fresh = Object.keys(after.packages ?? {}).filter((key) => !(key in (before.packages ?? {})));
  row('原锁文件里没有的包版本', fresh.length ? `${fresh.length} 个` : '没有', fresh);

  console.log('| 项 | 结果 |\n|---|---|');
  for (const { item, result } of rows) console.log(`| ${item} | ${result} |`);
  for (const { item, detail } of rows) if (detail.length) console.log(`\n${item}：\n${detail.map((line) => `  ${line}`).join('\n')}`);
  const failed = rows.filter(({ result }) => /不同|^\d+ 个$/.test(result));
  if (failed.length) process.exitCode = 1;
}

const [command, argument] = process.argv.slice(2);
if (command === 'regenerate') regenerate();
else if (command === 'compare') compare(argument);
else {
  console.error('用法：node scripts/rename/lockfile.mjs regenerate | compare <更名之前的提交>');
  process.exit(2);
}
