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
//
// 领先于来源的副本（S1-YUE-022）：清单里带 lead 的文件，副本 = 来源按 lead.replace 逐条替换的结果，lead.sourceSha256 记来源在来源提交的摘要。
// 不带参数时，把副本按 replace 反向换回去，摘要要等于 lead.sourceSha256；--source 时，来源的摘要要等于 lead.sourceSha256，
// 且来源按 replace 正向替换（每条命中次数等于 count）之后与副本逐字节相同。两头都对得上才算通过。
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
    if (file.lead !== undefined) checkLead(file);
  }
  return manifest;
}

function checkLead({ path: file, lead }) {
  const bad = (message) => fail(`${file} 的 lead ${message}`);
  if (!lead || typeof lead !== 'object') bad('要是对象');
  if (typeof lead.sourceSha256 !== 'string' || !/^[0-9a-f]{64}$/.test(lead.sourceSha256)) bad('缺少来源摘要 sourceSha256（64 位十六进制）');
  if (typeof lead.reason !== 'string' || lead.reason === '') bad('缺少领先的原因 reason');
  if (typeof lead.resolvedBy !== 'string' || !/^S\d+-[A-Z]+-\d+$/.test(lead.resolvedBy)) bad('缺少由哪个任务消除 resolvedBy（任务号）');
  if (!Array.isArray(lead.replace) || lead.replace.length === 0) bad('缺少替换清单 replace');
  for (const item of lead.replace) {
    if (typeof item.from !== 'string' || item.from === '' || typeof item.to !== 'string' || item.from === item.to) bad('的 replace 每条要有不同的 from 与 to');
    if (!Number.isInteger(item.count) || item.count < 1) bad('的 replace 每条要有正整数 count');
  }
}

/** 按 lead.replace 把来源换成副本（forward）或把副本换回来源（reverse）；每条命中次数必须等于 count。 */
function applyLead(buffer, lead, direction) {
  let text = buffer.toString('utf8');
  const problems = [];
  const steps = direction === 'forward' ? lead.replace : [...lead.replace].reverse();
  for (const { from, to, count } of steps) {
    const [find, put] = direction === 'forward' ? [from, to] : [to, from];
    const hits = text.split(find).length - 1;
    if (hits !== count) problems.push(`${JSON.stringify(find)} 命中 ${hits} 次，登记的是 ${count} 次`);
    text = text.split(find).join(put);
  }
  return { content: Buffer.from(text, 'utf8'), problems };
}

const digest = (buffer) => createHash('sha256').update(buffer).digest('hex');
const sha256 = (file) => digest(readFileSync(file));

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
    else if (file.lead) {
      const { content, problems: hits } = applyLead(readFileSync(copy), file.lead, 'reverse');
      problems.push(...hits.map((hit) => `领先登记对不上：backend-copy/${file.path} 反向替换时 ${hit}`));
      if (!hits.length && digest(content) !== file.lead.sourceSha256) problems.push(`领先登记对不上：backend-copy/${file.path} 换回去之后的摘要不等于登记的来源摘要`);
    }
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
    else if (file.lead) {
      if (sha256(origin) !== file.lead.sourceSha256) {
        problems.push(`来源有了没登记的变化：${prefix}${file.path} 的摘要不等于领先登记里的来源摘要`);
        continue;
      }
      const { content, problems: hits } = applyLead(readFileSync(origin), file.lead, 'forward');
      problems.push(...hits.map((hit) => `领先登记对不上：${prefix}${file.path} 正向替换时 ${hit}`));
      if (!hits.length && !content.equals(readFileSync(copy))) problems.push(`副本与来源的差异不止登记的那几处：backend-copy/${file.path}`);
    } else if (!readFileSync(origin).equals(readFileSync(copy))) problems.push(`与来源不一致：backend-copy/${file.path} ≠ ${prefix}${file.path}`);
  }
  return problems;
}

function update(manifest, source, repository, prefix) {
  const directory = path.resolve(source);
  const head = gitHead(directory);
  const dirty = execFileSync('git', ['-C', directory, 'status', '--porcelain', '--', ...manifest.files.map((file) => prefix + file.path)], { encoding: 'utf8' }).trim();
  if (dirty) fail(`检出里这些来源文件有没提交的改动，副本只能取自提交过的内容：\n${dirty}`);
  const changed = [];
  const resolved = [];
  for (const file of manifest.files) {
    const origin = path.join(directory, prefix + file.path);
    if (!existsSync(origin)) fail(`来源里没有：${prefix}${file.path}`);
    const copy = path.join(copyDir, file.path);
    mkdirSync(path.dirname(copy), { recursive: true });
    if (file.lead) {
      // 领先的文件：来源还没改，就在新来源上重新做一遍登记的替换；来源已经改成了副本的样子，领先消除；别的情况停下来人工看。
      const source = readFileSync(origin);
      const forward = applyLead(source, file.lead, 'forward');
      const already = file.lead.replace.every(({ from, to }) => !source.toString('utf8').includes(from) && source.toString('utf8').includes(to));
      if (!forward.problems.length) {
        writeFileSync(copy, forward.content);
        file.lead.sourceSha256 = digest(source);
      } else if (already) {
        copyFileSync(origin, copy);
        resolved.push(`${file.path}（${file.lead.resolvedBy}）`);
        delete file.lead;
      } else fail(`${prefix}${file.path} 在领先改动的位置变了，登记的替换套不上，人工处理：\n${forward.problems.map((problem) => `  ${problem}`).join('\n')}`);
    } else copyFileSync(origin, copy);
    const next = sha256(copy);
    if (next !== file.sha256) changed.push(file.path);
    file.sha256 = next;
  }
  const before = { ...manifest.source };
  manifest.source = { repository, pathPrefix: prefix, commit: head };
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`来源：${before.repository}@${before.commit.slice(0, 10)}（前缀 ${JSON.stringify(before.pathPrefix)}）→ ${repository}@${head.slice(0, 10)}（前缀 ${JSON.stringify(prefix)}）`);
  console.log(changed.length ? `内容有变的副本（${changed.length}）：\n${changed.map((file) => `  backend-copy/${file}`).join('\n')}` : '副本内容没有变化');
  if (resolved.length) console.log(`来源已经追上、领先登记去掉了：\n${resolved.map((file) => `  backend-copy/${file}`).join('\n')}`);
  const leading = manifest.files.filter((file) => file.lead).map((file) => file.path);
  if (leading.length) console.log(`仍然领先于来源（在新来源上重做了登记的替换）：\n${leading.map((file) => `  backend-copy/${file}`).join('\n')}`);
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
  const leading = manifest.files.filter((file) => file.lead).length;
  const leadNote = leading ? `；其中 ${leading} 个领先于来源，差异恰好是登记的替换` : '';
  console.log(options.source
    ? `后端契约副本：${manifest.files.length} 个文件的摘要与清单一致，与来源检出（${where}，前缀 ${JSON.stringify(prefix)}）逐个对上${leadNote}`
    : `后端契约副本：${manifest.files.length} 个文件的摘要与清单一致（来源 ${where}）${leadNote}`);
}
