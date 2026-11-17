#!/usr/bin/env node
// 后端契约副本的检查（S1-YUE-023）。副本在 backend-copy/，来源清单是 backend-copy/manifest.json，说明见 backend-copy/README.md。
//
//   node scripts/backend-copy.mjs                   核对每个副本的 SHA-256 与清单一致，副本目录里没有清单之外的文件
//   node scripts/backend-copy.mjs --source <检出>    另外与一份后端仓库的检出逐个文件比对；检出必须停在清单记的提交上
//   node scripts/backend-copy.mjs --update <检出>    后端改了契约之后用：从检出复制副本，按检出的提交与文件重写清单
//   node scripts/backend-copy.mjs --print-source     按 GitHub Actions 输出的格式打印来源仓库、提交、路径前缀与要检出的路径
//
// --repository <所有者/仓库>、--path-prefix <前缀> 覆盖清单里的 source.repository、source.pathPrefix：
// 比对与打印时只在这一次生效；和 --update 一起用时写回清单（后端换了仓库或目录结构时用）。
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const copyDir = path.join(root, 'backend-copy');
const manifestPath = path.join(copyDir, 'manifest.json');
const ownFiles = new Set(['README.md', 'manifest.json']);

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    const value = () => {
      const next = argv[++index];
      if (next === undefined) fail(`${arg} 后面要跟一个值`);
      return next;
    };
    if (arg === '--source') options.source = value();
    else if (arg === '--update') options.update = value();
    else if (arg === '--repository') options.repository = value();
    else if (arg === '--path-prefix') options.pathPrefix = value();
    else if (arg === '--print-source') options.printSource = true;
    else if (arg === '-h' || arg === '--help') {
      process.stdout.write(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 10).map((line) => line.replace(/^\/\/ ?/, '')).join('\n') + '\n');
      process.exit(0);
    } else fail(`未知参数：${arg}（--help 看用法）`);
  }
  if ([options.source, options.update, options.printSource].filter(Boolean).length > 1) fail('--source、--update、--print-source 只能选一个');
  return options;
}

function checkRepository(repository) {
  if (typeof repository !== 'string' || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) fail(`来源仓库要写成「所有者/仓库」：${JSON.stringify(repository)}`);
  return repository;
}

function checkPrefix(prefix) {
  if (typeof prefix !== 'string') fail('路径前缀要是字符串，没有前缀写空串');
  if (prefix === '') return prefix;
  if (prefix.startsWith('/') || !prefix.endsWith('/') || prefix.split('/').includes('..') || prefix.includes('\\')) fail(`路径前缀要是以 / 结尾的相对目录，例如 "qian/"：${JSON.stringify(prefix)}`);
  return prefix;
}

function readManifest() {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const { source, files } = manifest;
  if (!source || typeof source !== 'object') fail('清单缺少 source');
  checkRepository(source.repository);
  checkPrefix(source.pathPrefix);
  if (typeof source.commit !== 'string' || !/^[0-9a-f]{40}$/.test(source.commit)) fail('source.commit 要写全长的提交哈希');
  if (!Array.isArray(files) || files.length === 0) fail('清单缺少 files');
  const seen = new Set();
  for (const file of files) {
    const valid = typeof file.path === 'string' && file.path !== '' && !file.path.startsWith('/') && !file.path.split('/').includes('..') && !file.path.includes('\\');
    if (!valid || ownFiles.has(file.path)) fail(`清单里的路径不合规：${JSON.stringify(file.path)}`);
    if (seen.has(file.path)) fail(`清单里的路径重复：${file.path}`);
    seen.add(file.path);
    if (typeof file.sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(file.sha256)) fail(`${file.path} 的 sha256 不是 64 位十六进制`);
  }
  return manifest;
}

const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex');

function listCopyDir(directory = copyDir, prefix = '') {
  const result = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const relative = prefix + entry.name;
    if (entry.isDirectory()) result.push(...listCopyDir(path.join(directory, entry.name), `${relative}/`));
    else result.push(relative);
  }
  return result;
}

function gitHead(directory) {
  try {
    return execFileSync('git', ['-C', directory, 'rev-parse', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    fail(`${directory} 不是 Git 检出，没法确认它停在哪个提交上`);
  }
}

function verifyDigests(manifest) {
  const problems = [];
  for (const file of manifest.files) {
    const copy = path.join(copyDir, file.path);
    if (!existsSync(copy)) problems.push(`缺少副本：backend-copy/${file.path}`);
    else if (sha256(copy) !== file.sha256) problems.push(`摘要不符：backend-copy/${file.path}（副本被改过，或清单没有跟着更新）`);
  }
  const listed = new Set(manifest.files.map((file) => file.path));
  for (const relative of listCopyDir()) if (!listed.has(relative) && !ownFiles.has(relative)) problems.push(`清单之外的文件：backend-copy/${relative}`);
  return problems;
}

function compareWithSource(manifest, source, prefix) {
  const directory = path.resolve(source);
  const head = gitHead(directory);
  if (head !== manifest.source.commit) return [`检出停在 ${head}，清单记的来源提交是 ${manifest.source.commit}`];
  const problems = [];
  for (const file of manifest.files) {
    const origin = path.join(directory, prefix + file.path);
    const copy = path.join(copyDir, file.path);
    if (!existsSync(origin)) problems.push(`来源里没有：${prefix}${file.path}`);
    else if (!existsSync(copy)) continue; // 摘要核对已经报了缺少副本
    else if (!readFileSync(origin).equals(readFileSync(copy))) problems.push(`与来源不一致：backend-copy/${file.path} ≠ ${prefix}${file.path}`);
  }
  return problems;
}

function update(manifest, source, repository, prefix) {
  const directory = path.resolve(source);
  const head = gitHead(directory);
  const dirty = execFileSync('git', ['-C', directory, 'status', '--porcelain', '--', ...manifest.files.map((file) => prefix + file.path)], { encoding: 'utf8' }).trim();
  if (dirty) fail(`检出里这些来源文件有没提交的改动，副本只能取自提交过的内容：\n${dirty}`);
  const changed = [];
  for (const file of manifest.files) {
    const origin = path.join(directory, prefix + file.path);
    if (!existsSync(origin)) fail(`来源里没有：${prefix}${file.path}`);
    const copy = path.join(copyDir, file.path);
    mkdirSync(path.dirname(copy), { recursive: true });
    copyFileSync(origin, copy);
    const digest = sha256(copy);
    if (digest !== file.sha256) changed.push(file.path);
    file.sha256 = digest;
  }
  const before = { ...manifest.source };
  manifest.source = { repository, pathPrefix: prefix, commit: head };
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`来源：${before.repository}@${before.commit.slice(0, 10)}（前缀 ${JSON.stringify(before.pathPrefix)}）→ ${repository}@${head.slice(0, 10)}（前缀 ${JSON.stringify(prefix)}）`);
  console.log(changed.length ? `内容有变的副本（${changed.length}）：\n${changed.map((file) => `  backend-copy/${file}`).join('\n')}` : '副本内容没有变化');
}

const options = parseArgs(process.argv.slice(2));
const manifest = readManifest();
const repository = options.repository === undefined ? manifest.source.repository : checkRepository(options.repository);
const prefix = options.pathPrefix === undefined ? manifest.source.pathPrefix : checkPrefix(options.pathPrefix);

if (options.printSource) {
  const delimiter = `PATHS_${createHash('sha256').update(manifest.source.commit).digest('hex').slice(0, 12)}`;
  console.log(`repository=${repository}`);
  console.log(`commit=${manifest.source.commit}`);
  console.log(`path-prefix=${prefix}`);
  console.log(`paths<<${delimiter}\n${manifest.files.map((file) => prefix + file.path).join('\n')}\n${delimiter}`);
} else if (options.update) {
  update(manifest, options.update, repository, prefix);
} else {
  const problems = verifyDigests(manifest);
  if (options.source) problems.push(...compareWithSource(manifest, options.source, prefix));
  const where = `${repository}@${manifest.source.commit.slice(0, 10)}`;
  if (problems.length) fail(`后端契约副本检查失败（来源 ${where}）：\n${problems.map((problem) => `  ${problem}`).join('\n')}`);
  console.log(options.source
    ? `后端契约副本：${manifest.files.length} 个文件的摘要与清单一致，与来源检出（${where}，前缀 ${JSON.stringify(prefix)}）逐个相同`
    : `后端契约副本：${manifest.files.length} 个文件的摘要与清单一致（来源 ${where}）`);
}
