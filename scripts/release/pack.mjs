#!/usr/bin/env node
// 打包验证（S1-YUE-022）：10 个包各打一个 tarball，逐个核对名字、版本、许可、仓库地址、文件清单，
// 以及工作区依赖已换成真实版本。不发布。发布工作流用同一个脚本打包。
//
//   node scripts/release/pack.mjs <输出目录> [--no-build]
//
// 输出目录里留下 tarball 与 packages.json（每个包的名字、版本、完整性摘要、文件清单）。
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { PACKAGES, REPOSITORY, REQUIRED_FILES, ROOT, tarballName, workspacePackage } from './packages.mjs';

const args = process.argv.slice(2);
const output = args.find((arg) => !arg.startsWith('--'));
assert(output, '用法：node scripts/release/pack.mjs <输出目录> [--no-build]');
const directory = path.resolve(output);
mkdirSync(directory, { recursive: true });

const run = (command, commandArgs) => execFileSync(command, commandArgs, { cwd: ROOT, stdio: ['ignore', 'inherit', 'inherit'] });
const tar = (archive, ...rest) => execFileSync('tar', [...rest, archive], { encoding: 'utf8', maxBuffer: 1 << 28 });

if (!args.includes('--no-build')) for (const { dir } of PACKAGES) run('pnpm', ['--filter', `./${dir}`, 'build']);

const versions = new Map(PACKAGES.map(({ name, dir }) => [name, workspacePackage(dir).version]));
const repositoryPattern = new RegExp(`github\\.com[:/]${REPOSITORY.replace('/', '\\/')}(?:\\.git)?$`);
const leaves = (value) => (typeof value === 'string' ? [value] : value && typeof value === 'object' ? Object.values(value).flatMap(leaves) : []);
const records = [];
const problems = [];

// 包里的相对引用（S1-YUE-024）：打包之后只剩 files 列出的文件，指向包外或没随包发布的文件就是坏的。
const isRelative = (target) => !/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(target);
const resolveIn = (from, target) => path.posix.normalize(path.posix.join(path.posix.dirname(from), target));
/** 说明文件里的相对链接（行内链接与图片、引用式定义、HTML 的 href / src），代码块与行内代码不算。 */
function markdownLinks(text) {
  const prose = text.replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1[^\n]*$/gm, '').replace(/`[^`\n]*`/g, '');
  const links = [...prose.matchAll(/\]\(\s*(?:<([^>]*)>|([^)\s]+))/g)].map((match) => match[1] ?? match[2]);
  links.push(...[...prose.matchAll(/^ {0,3}\[[^\]]+\]:\s*<?([^\s>]+)>?/gm)].map((match) => match[1]));
  links.push(...[...prose.matchAll(/\b(?:href|src)\s*=\s*["']([^"']+)["']/g)].map((match) => match[1]));
  return links.filter(isRelative).map((link) => link.replace(/[?#].*$/, '')).filter(Boolean);
}
/** 声明文件里的相对模块说明符与 /// <reference path>，以及 TypeScript 会去找的候选文件。 */
function declarationReferences(text) {
  const specifiers = [...text.matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*|^\s*import\s+)["']([^"']+)["']/gm)].map((match) => match[1]);
  const references = [...text.matchAll(/^\/\/\/\s*<reference\s+path\s*=\s*["']([^"']+)["']/gm)].map((match) => (match[1].startsWith('.') ? match[1] : `./${match[1]}`));
  return [...specifiers, ...references].filter((specifier) => specifier.startsWith('./') || specifier.startsWith('../'));
}
const declarationCandidates = (resolved) => {
  if (/\.d\.[cm]?ts$/.test(resolved) || resolved.endsWith('.json')) return [resolved];
  const extension = resolved.match(/\.([cm]?)[jt]sx?$/);
  if (extension) return [`${resolved.slice(0, -extension[0].length)}.d.${extension[1]}ts`];
  return [`${resolved}.d.ts`, `${resolved}/index.d.ts`];
};

for (const { name, dir } of PACKAGES) {
  const source = workspacePackage(dir);
  run('pnpm', ['--filter', `./${dir}`, 'pack', '--pack-destination', directory]);
  const archive = path.join(directory, tarballName(name, source.version));
  const manifest = JSON.parse(execFileSync('tar', ['-xOzf', archive, 'package/package.json'], { encoding: 'utf8' }));
  const files = tar(archive, '-tzf').trim().split('\n').map((file) => file.replace(/^package\//, '')).sort();
  const fail = (message) => problems.push(`${name}：${message}`);

  if (manifest.name !== name) fail(`包名是 ${manifest.name}`);
  if (manifest.version !== source.version) fail(`版本是 ${manifest.version}，工作区是 ${source.version}`);
  if (manifest.license !== 'MIT') fail(`license 是 ${manifest.license}`);
  if (!repositoryPattern.test(manifest.repository?.url ?? '')) fail(`repository.url 是 ${manifest.repository?.url}`);
  if (manifest.repository?.directory !== dir) fail(`repository.directory 是 ${manifest.repository?.directory}`);
  for (const field of ['homepage', 'bugs']) {
    const value = typeof manifest[field] === 'object' ? manifest[field]?.url : manifest[field];
    if (!value?.startsWith(`https://github.com/${REPOSITORY}`)) fail(`${field} 是 ${value}`);
  }
  for (const kind of ['dependencies', 'peerDependencies', 'optionalDependencies']) {
    for (const [dependency, spec] of Object.entries(manifest[kind] ?? {})) {
      if (/^(workspace|catalog|file|link):/.test(spec)) fail(`${kind}.${dependency} 还是 ${spec}`);
      if (versions.has(dependency) && !new RegExp(`^[\\^~]?${versions.get(dependency).replaceAll('.', '\\.')}$`).test(spec)) fail(`${kind}.${dependency} 是 ${spec}，工作区是 ${versions.get(dependency)}`);
    }
  }
  for (const target of [...leaves(manifest.exports), manifest.main, manifest.types].filter(Boolean)) {
    if (!files.includes(target.replace(/^\.\//, ''))) fail(`exports 指向的 ${target} 不在包里`);
  }
  for (const required of ['README.md', 'package.json', ...(REQUIRED_FILES[name] ?? [])]) if (!files.includes(required)) fail(`缺少 ${required}`);
  if (files.some((file) => /(?:^|\/)(?:test|tests|__tests__)\/|\.(?:test|spec)\.[cm]?[jt]sx?$/.test(file.replace(/\.d\.ts$/, '.ts')))) fail('测试文件进了包');
  if (files.some((file) => /yue/i.test(file))) fail('文件名里还有 yue');
  const read = (file) => execFileSync('tar', ['-xOzf', archive, `package/${file}`], { encoding: 'utf8', maxBuffer: 1 << 28 });
  for (const file of files.filter((entry) => entry.endsWith('.md'))) {
    const text = read(file);
    for (const link of markdownLinks(text)) {
      const target = resolveIn(file, decodeURI(link));
      if (target.startsWith('../')) fail(`${file} 的相对链接 ${link} 指向包外，打包之后是坏链，改成完整地址`);
      else if (!files.includes(target) && !files.some((entry) => entry.startsWith(`${target.replace(/\/$/, '')}/`))) fail(`${file} 的相对链接 ${link} 指向没有随包发布的文件，改成完整地址`);
    }
    // 说明里写到的本仓库包版本（安装命令、依赖写法）要与这次打包的版本一致。
    for (const [, dependency, version] of text.matchAll(/(@cavailab\/qian-[a-z-]+)@(\d+\.\d+\.\d+[^\s'"`)]*)/g)) {
      if (versions.has(dependency) && versions.get(dependency) !== version) fail(`${file} 写的是 ${dependency}@${version}，这次打包的是 ${versions.get(dependency)}`);
    }
  }
  for (const file of files.filter((entry) => /\.d\.[cm]?ts$/.test(entry))) {
    for (const specifier of declarationReferences(read(file))) {
      const resolved = resolveIn(file, specifier);
      if (!declarationCandidates(resolved).some((candidate) => files.includes(candidate))) fail(`声明文件 ${file} 引用的 ${specifier} 不在包里（使用方不跳过库检查时报 TS2307）`);
      else if (resolved.endsWith('.json')) fail(`声明文件 ${file} 引用了 JSON（${specifier}）：使用方没开 resolveJsonModule 时会报错，把类型写进声明文件`);
    }
  }
  if (name === '@cavailab/qian-core') {
    const catalog = JSON.parse(execFileSync('tar', ['-xOzf', archive, 'package/dist/qian-manifest.json'], { encoding: 'utf8' }));
    if (!catalog.length || catalog.some((item) => item.package !== name || item.version !== source.version)) fail('dist/qian-manifest.json 的 package / version 与包不符');
  }

  const bytes = readFileSync(archive);
  records.push({
    name, version: manifest.version, dir, archive, size: bytes.length,
    integrity: 'sha512-' + createHash('sha512').update(bytes).digest('base64'),
    license: manifest.license, repository: manifest.repository, homepage: manifest.homepage, bugs: manifest.bugs,
    dependencies: manifest.dependencies ?? {}, peerDependencies: manifest.peerDependencies ?? {}, files,
  });
}

writeFileSync(path.join(directory, 'packages.json'), JSON.stringify(records, null, 2) + '\n');
console.log('\n| 包 | 版本 | license | 文件数 | 大小 | 内部依赖 |\n|---|---|---|---|---|---|');
for (const record of records) {
  const internal = Object.entries(record.dependencies).filter(([dependency]) => versions.has(dependency)).map(([dependency, spec]) => `${dependency.replace('@cavailab/', '')}@${spec}`).join('、') || '—';
  console.log(`| ${record.name} | ${record.version} | ${record.license} | ${record.files.length} | ${(record.size / 1024).toFixed(1)} KiB | ${internal} |`);
}
if (problems.length) {
  console.error(`\n打包验证不通过：\n${problems.join('\n')}`);
  process.exit(1);
}
console.log(`\n10 个包打包验证通过；tarball 与 packages.json 在 ${directory}`);
