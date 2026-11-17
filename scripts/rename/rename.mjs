#!/usr/bin/env node
// 前端框架由 yue 更名为 qian（F2，任务 S1-YUE-022）的可重跑脚本。规则见 docs/migration.md 第 5 节，用法见同目录 README.md。
//
//   node scripts/rename/rename.mjs inventory          列出已跟踪文件的路径与内容里全部 yue（不分大小写），按规则归类计数
//   node scripts/rename/rename.mjs move               目录与文件改名（git mv），内容一个字节不改
//   node scripts/rename/rename.mjs replace            按映射表做机械替换，只改文件内容
//   node scripts/rename/rename.mjs check              列出替换之后剩下的 yue，按「不改的」分类计数；有归不了类的就失败
//   node scripts/rename/rename.mjs verify <提交>       在临时工作区里对 <提交> 的父提交重跑 move 或 replace，核对得到的树与 <提交> 逐字节相同
//
// 只用 Node 自带的模块与 git，不依赖 node_modules，所以在干净的检出里也能跑。
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT = path.relative(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'), fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// 一、目录与文件改名（move）。显式列出，按顺序执行；源不存在就失败。
// ---------------------------------------------------------------------------
export const MOVES = [
  ['packages/yue', 'packages/qian'],
  ['apps/yue-playground', 'apps/qian-playground'],
  ['tests/gates/yue', 'tests/gates/qian'],
  ['scripts/yue-visual.mjs', 'scripts/qian-visual.mjs'],
  ['.github/workflows/yue.yml', '.github/workflows/qian.yml'],
  ['.changeset/yue-console-refresh.md', '.changeset/qian-console-refresh.md'],
  ['.changeset/yue-form-interpreted-validation.md', '.changeset/qian-form-interpreted-validation.md'],
  ['.changeset/yue-signup-prototype-rework.md', '.changeset/qian-signup-prototype-rework.md'],
  ['.changeset/yue-signup-prototype.md', '.changeset/qian-signup-prototype.md'],
  ['.changeset/yue-visual-components.md', '.changeset/qian-visual-components.md'],
  ['.changeset/yue-visual-tokens.md', '.changeset/qian-visual-tokens.md'],
];

// ---------------------------------------------------------------------------
// 二、内容替换（replace）。
// ---------------------------------------------------------------------------

// 不处理的文件（按路径前缀或全路径）。理由写在每一项后面；check 按同样的分类统计剩下的 yue。
export const SKIP = [
  { prefix: 'scripts/import/', keep: 'import-scripts', why: 'F1 的导入脚本描述源仓库的路径，整目录不改' },
  { prefix: 'scripts/rename/', keep: 'rename-script', why: '本脚本与说明，映射表里本来就是旧名字' },
  { prefix: 'backend-copy/', except: ['backend-copy/README.md'], keep: 'backend-copy', why: '后端契约的副本，按来源存放；engines 键的领先改动另做手工提交' },
  { path: 'pnpm-lock.yaml', keep: 'lockfile', why: '锁文件用 pnpm install 重新生成，不做文本替换' },
  { path: 'AGENTS.md', keep: 'root-docs', why: '根文档写的是迁移的来龙去脉，另做手工改写' },
  { path: 'README.md', keep: 'root-docs', why: '同上' },
  { path: 'CLAUDE.md', keep: 'root-docs', why: '同上' },
  { prefix: 'docs/', keep: 'root-docs', why: '同上；docs/migration.md 与给使用方的迁移说明里新旧名字要并列' },
  { path: 'packages/qian-plugin-sdk/src/ui-schema.generated.ts', keep: 'contract-derived', why: '由契约副本 schemas/v2/ui.schema.json 生成，随副本的领先改动重新生成' },
  { path: 'packages/qian-plugin-sdk/src/ui-validators.generated.ts', keep: 'contract-derived', why: '同上' },
];

const BINARY_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.woff', '.woff2', '.ttf', '.otf', '.zip', '.tgz', '.gz', '.pdf']);

// 保护区：先把这些片段整段挪开，替换完再放回，所以它们里面的 yue 一个字不动。
export const PROTECT = [
  { id: 'task-id', why: '任务号 S1-YUE-* 与简写 YUE-012：带旧名字的任务编号不改', re: /(?<![A-Za-z0-9])(?:S1-YUE-(?:\d+(?:\/\d+)*|\*)?|YUE-\d+)/g },
  { id: 'pinned-url', why: '指向 idadawn/qian 固定提交的完整地址：路径是源仓库在那个提交的路径', re: /https:\/\/github\.com\/idadawn\/qian\/(?:blob|tree|commit)\/[0-9a-f]{40}[^\s)\]>"'`）】，。；、]*/g },
  { id: 'backend-path', why: '后端仓库里的文件与文档站路由（纯文字引用）：文件在后端，名字没变', re: /docs\/prd\/specs\/yue\.md|docs\/adr\/ADR-013-frontend-yue\.md|\/design\/prd\/specs\/yue(?![\w-])|\/components\/yue\//g },
  { id: 'qian-dev-url', why: 'https://qian.dev/… 是保留下来的运行期字面（组件清单 Schema 的 $id），不改', re: /https:\/\/qian\.dev\/yue\/[\w./-]*/g },
  { id: 'backend-script', why: '后端仓库的根脚本 yue:docs、yue:auth（文档站与外壳认证的门禁留在后端，F1 已从本仓库去掉），名字随后端', re: /(?<![\w-])yue:(?:docs|auth|mf)(?![\w-])/g },
];

// 映射表：按顺序逐条应用在整段文本上，每条都按词法边界匹配（前后不能紧挨着标识符字符）。
// 前面的规则先把特定写法换掉，最后一条兜底处理其余的小写 yue。
export const RULES = [
  { id: 'scope-yue', what: '8 个包的包名 @idadawn/yue-<名> → @cavailab/qian-<名>（含子路径、通配与模板串）', re: /@idadawn\/yue-/g, to: '@cavailab/qian-' },
  { id: 'scope-yue-escaped', what: '正则字面量里转义过的包名 @idadawn\\/yue- → @cavailab\\/qian-', re: /@idadawn\\\/yue-/g, to: '@cavailab\\/qian-' },
  { id: 'scope', what: '其余 @idadawn 作用域：运行时、插件开发包与测试里的假包名 → @cavailab', re: /@idadawn\//g, to: '@cavailab/' },
  { id: 'scope-escaped', what: '正则字面量里转义过的作用域 @idadawn\\/ → @cavailab\\/', re: /@idadawn\\\//g, to: '@cavailab\\/' },
  { id: 'scope-registry', what: '.npmrc 里作用域的包源配置 @idadawn:registry → @cavailab:registry', re: /@idadawn:registry/g, to: '@cavailab:registry' },
  { id: 'tarball', what: 'pnpm pack 产出的文件名 idadawn-yue-* / idadawn-qian-* → cavailab-qian-*', re: /(?<![\w-])idadawn-(?:yue|qian)-/g, to: 'cavailab-qian-' },
  { id: 'design-shorthand', what: '设计文档里的包简称 @yue/<名> → 全名 @cavailab/qian-<名>（@qian/* 是后端包的命名空间，不能用）', re: /@yue\//g, to: '@cavailab/qian-' },
  { id: 'design-shorthand-family', what: '简称 @yue（指这一组包）→ @cavailab/qian-*', re: /@yue(?![\w/-])/g, to: '@cavailab/qian-*' },
  { id: 'bare-package', what: '正文里的裸包简称 yue-<名> → 全名 @cavailab/qian-<名>（qian-shell 是后端应用外壳的包名）', re: /(?<![\w@/.'"-])yue-(biz|contracts|core|data|form|sdk|shell|tokens)(?![\w-])/g, to: '@cavailab/qian-$1' },
  { id: 'css-var', what: '样式变量 --yue-* → --qian-*', re: /(?<![\w-])--yue-/g, to: '--qian-' },
  { id: 'data-attr', what: '可寻址属性 data-yue-* → data-qian-*', re: /(?<![\w-])data-yue-/g, to: 'data-qian-' },
  { id: 'pascal', what: '导出的类型 Yue* → Qian*（YueProps）', re: /(?<![A-Za-z0-9_$])Yue(?![a-z])/g, to: 'Qian' },
  { id: 'camel', what: '驼峰标识符 yue* → qian*（yueVersion、yueBoundariesConfig）', re: /(?<![A-Za-z0-9_$])yue(?=[A-Z])/g, to: 'qian' },
  { id: 'upper', what: '大写常量与构建期常量 YUE → QIAN（YUE_PACKAGES、YUE_DIR、__YUE_VERSION__，以及页面上的大写字样）', re: /(?<![A-Za-z0-9])YUE(?![A-Za-z0-9-])/g, to: 'QIAN' },
  { id: 'word', what: '其余小写的 yue：目录与文件路径、私有包名、测试标识与插件名等前缀、存储键、清单版本键 engines.yue、根脚本 yue:*、工作流名与正文', re: /(?<![A-Za-z0-9_$])yue(?![A-Za-z0-9_$])/g, to: 'qian' },
];

// check 用：替换之后仍然允许带旧名字的文档（新旧对照、更名记录、导入记录）。
export const HISTORY_DOCS = ['docs/migration.md', 'docs/migrating-from-yue.md', 'AGENTS.md', 'README.md', 'docs/architecture.md'];

// ---------------------------------------------------------------------------

const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const git = (args, options = {}) => execFileSync('git', args, { cwd: options.cwd ?? root, encoding: options.encoding ?? 'utf8', maxBuffer: 1 << 30, stdio: options.stdio ?? ['ignore', 'pipe', 'inherit'] });

function trackedFiles(cwd = root) {
  return git(['ls-files', '-z'], { cwd }).split('\0').filter(Boolean);
}

function skipOf(file) {
  for (const rule of SKIP) {
    const hit = rule.path ? file === rule.path : file.startsWith(rule.prefix);
    if (hit && !(rule.except ?? []).includes(file)) return rule;
  }
  return null;
}

function readText(file, cwd = root) {
  const buffer = readFileSync(path.join(cwd, file));
  if (BINARY_EXTENSIONS.has(path.extname(file).toLowerCase()) || buffer.subarray(0, 8000).includes(0)) return null;
  const text = buffer.toString('utf8');
  if (!Buffer.from(text, 'utf8').equals(buffer)) throw new Error(`${file}：不是合法的 UTF-8，停下来人工看`);
  if (PRIVATE.test(text)) throw new Error(`${file}：含有占位用的私用区字符，停下来人工看`);
  return text;
}

// 占位符是私用区的两个字符包住片段的序号。源码里只写码位，免得脚本文件自己含有这两个字符。
const OPEN = String.fromCodePoint(0xe000);
const CLOSE = String.fromCodePoint(0xe001);
const PLACEHOLDER = () => new RegExp(`${OPEN}(\\d+)${CLOSE}`, 'g');
const PRIVATE = new RegExp(`[${OPEN}${CLOSE}]`);

/**
 * 把保护区换成占位符；返回替换后的文本与原片段（按出现顺序）。
 * 保护区可以嵌套：任务号先换成占位符，固定提交的地址再把带着这个占位符的整段换掉（地址里带着任务号）。
 */
function mask(text) {
  const spans = [];
  for (const { id, re } of PROTECT) {
    text = text.replace(re, (match) => {
      spans.push({ id, match });
      return `${OPEN}${spans.length - 1}${CLOSE}`;
    });
  }
  return { text, spans };
}

/** 放回原片段。外层片段里还带着里层的占位符，所以一层层放，直到一个占位符也不剩。 */
function unmask(text, spans) {
  while (PLACEHOLDER().test(text)) text = text.replace(PLACEHOLDER(), (_, i) => spans[Number(i)].match);
  return text;
}

/** 对一段文本应用映射表。stats 记每条规则命中的次数与命中的写法。 */
export function applyRules(original, stats) {
  const { text: masked, spans } = mask(original);
  let text = masked;
  for (const rule of RULES) {
    if (stats) {
      for (const m of text.matchAll(rule.re)) {
        const entry = (stats[rule.id] ??= { count: 0, yue: 0, forms: new Map() });
        entry.count += 1;
        entry.yue += countYue(m[0]);
        const form = tokenAround(text, m.index, m[0].length);
        entry.forms.set(form, (entry.forms.get(form) ?? 0) + 1);
      }
    }
    text = text.replace(rule.re, rule.to);
  }
  const result = unmask(text, spans);
  if (PRIVATE.test(result)) throw new Error('占位符没有放回，停下来人工看');
  if (stats) {
    // 嵌套的里层片段算在包住它的外层名下，不重复计数（与 check 的归类一致）。
    const nested = new Set();
    for (const { match } of spans) for (const [, i] of match.matchAll(PLACEHOLDER())) nested.add(Number(i));
    spans.forEach(({ id, match }, index) => {
      if (nested.has(index)) return;
      const whole = unmask(match, spans);
      const n = countYue(whole);
      if (!n) return;
      const entry = (stats[`keep:${id}`] ??= { count: 0, yue: 0, forms: new Map() });
      entry.count += 1;
      entry.yue += n;
      entry.forms.set(whole, (entry.forms.get(whole) ?? 0) + 1);
    });
  }
  return result;
}

/** 命中处连同前后的标识符字符，用来在盘点里看清是哪一种写法。 */
function tokenAround(text, offset, length) {
  let start = offset;
  let end = offset + length;
  while (start > 0 && /[\w$@./:-]/.test(text[start - 1])) start -= 1;
  while (end < text.length && /[\w$./:-]/.test(text[end])) end += 1;
  return text.slice(start, end).replace(/[.:]+$/, '').replace(PLACEHOLDER(), '…');
}

const countYue = (text) => (text.match(/yue/gi) ?? []).length;

function report(stats, title) {
  console.log(`\n${title}`);
  const rows = [];
  for (const rule of RULES) if (stats[rule.id]) rows.push([rule.id, stats[rule.id], rule.what]);
  for (const p of PROTECT) if (stats[`keep:${p.id}`]) rows.push([`keep:${p.id}`, stats[`keep:${p.id}`], p.why]);
  console.log(`  ${'规则'.padEnd(22)} ${'命中'.padStart(3)} ${'含yue'.padStart(4)}`);
  for (const [id, { count, yue, forms }, what] of rows) {
    console.log(`  ${id.padEnd(24)} ${String(count).padStart(5)} ${String(yue).padStart(5)}  ${what}`);
    if (forms && process.env.RENAME_VERBOSE) for (const [form, n] of [...forms].sort((a, b) => b[1] - a[1])) console.log(`      ${String(n).padStart(4)}  ${form}`);
  }
}

// ---------------------------------------------------------------------------
// 子命令
// ---------------------------------------------------------------------------

function inventory() {
  const files = trackedFiles();
  const paths = files.filter((f) => /yue/i.test(f));
  console.log(`已跟踪文件 ${files.length} 个；路径里带 yue 的 ${paths.length} 个：`);
  for (const [from, to] of MOVES) {
    const n = paths.filter((f) => f === from || f.startsWith(`${from}/`)).length;
    console.log(`  ${String(n).padStart(4)}  ${from} → ${to}`);
  }
  const unmoved = paths.filter((f) => !MOVES.some(([from]) => f === from || f.startsWith(`${from}/`)));
  if (unmoved.length) console.log(`  没有改名规则的路径：\n${unmoved.map((f) => `    ${f}`).join('\n')}`);

  const stats = {};
  const skipped = new Map();
  let binary = 0;
  let total = 0;
  let textFiles = 0;
  for (const file of files) {
    const text = readText(file);
    if (text === null) {
      const n = countYue(readFileSync(path.join(root, file)).toString('latin1'));
      if (n) binary += n;
      continue;
    }
    const n = countYue(text);
    if (!n) continue;
    total += n;
    textFiles += 1;
    const skip = skipOf(file);
    if (skip) {
      const entry = skipped.get(skip.keep) ?? { count: 0, files: new Set(), why: skip.why };
      entry.count += n;
      entry.files.add(file);
      skipped.set(skip.keep, entry);
      continue;
    }
    applyRules(text, stats);
  }
  console.log(`\n内容：文本文件 ${textFiles} 个里共 ${total} 处 yue（不分大小写）；二进制文件里 ${binary} 处（压缩数据里碰巧出现的字节，不是名字）。`);
  report(stats, '替换范围内，按规则归类（keep: 是保护区，不改）：');
  console.log('\n不进替换范围的文件：');
  for (const [keep, { count, files: set, why }] of skipped) console.log(`  ${keep.padEnd(24)} ${String(count).padStart(5)}  ${set.size} 个文件；${why}`);
}

function move() {
  for (const [from, to] of MOVES) {
    if (!existsSync(path.join(root, from))) throw new Error(`move：${from} 不存在`);
    if (existsSync(path.join(root, to))) throw new Error(`move：${to} 已经存在`);
    git(['mv', from, to]);
    console.log(`${from} → ${to}`);
  }
  const left = trackedFiles().filter((f) => /yue/i.test(f));
  if (left.length) throw new Error(`move 之后路径里还有 yue：\n${left.join('\n')}`);
}

function replace() {
  const stats = {};
  let changed = 0;
  for (const file of trackedFiles()) {
    if (skipOf(file)) continue;
    const text = readText(file);
    if (text === null || !/yue|idadawn/i.test(text)) continue;
    const next = applyRules(text, stats);
    if (next !== text) {
      writeFileSync(path.join(root, file), next);
      changed += 1;
    }
  }
  report(stats, `改了 ${changed} 个文件：`);
}

function check() {
  const counts = new Map();
  const unclassified = [];
  const add = (key, file) => {
    const entry = counts.get(key) ?? { count: 0, files: new Set() };
    entry.count += 1;
    entry.files.add(file);
    counts.set(key, entry);
  };
  for (const file of trackedFiles()) {
    if (/yue/i.test(file)) unclassified.push(`${file}（路径）`);
    const text = readText(file);
    if (text === null) {
      const n = countYue(readFileSync(path.join(root, file)).toString('latin1'));
      for (let i = 0; i < n; i += 1) add('binary', file);
      continue;
    }
    if (!/yue/i.test(text)) continue;
    // 先认保护区，再认文件。
    const covered = [];
    for (const { id, re } of PROTECT) for (const m of text.matchAll(re)) covered.push([m.index, m.index + m[0].length, id]);
    covered.sort((a, b) => (b[1] - b[0]) - (a[1] - a[0])); // 嵌套时算在最外层名下，与 replace 的计数一致
    const skip = skipOf(file);
    for (const m of text.matchAll(/yue/gi)) {
      const hit = covered.find(([start, end]) => m.index >= start && m.index < end);
      if (hit) add(hit[2], file);
      else if (skip && skip.keep !== 'root-docs' && skip.keep !== 'lockfile') add(skip.keep, file);
      else if (file === 'pnpm-lock.yaml' && /[A-Za-z0-9+/]{30,}/.test(tokenAround(text, m.index, 3))) add('lockfile-hash', file);
      else if (HISTORY_DOCS.includes(file)) add('history-docs', file);
      else {
        const line = text.slice(0, m.index).split('\n').length;
        unclassified.push(`${file}:${line}: ${tokenAround(text, m.index, 3)}`);
      }
    }
  }
  const why = Object.fromEntries([
    ...PROTECT.map((p) => [p.id, p.why]),
    ...SKIP.map((s) => [s.keep, s.why]),
    ['binary', '二进制文件（视觉基线 PNG）压缩数据里碰巧出现的字节，不是名字'],
    ['lockfile-hash', '锁文件里完整性摘要碰巧含有这三个字母，不是名字'],
    ['history-docs', '迁移计划、迁移说明与入口文档里的新旧名字对照与更名记录'],
  ]);
  let total = 0;
  for (const [key, { count, files }] of [...counts].sort((a, b) => b[1].count - a[1].count)) {
    total += count;
    console.log(`  ${key.padEnd(24)} ${String(count).padStart(5)}  ${files.size} 个文件；${why[key] ?? ''}`);
    if (process.env.RENAME_VERBOSE) for (const f of files) console.log(`        ${f}`);
  }
  console.log(`  ${'合计'.padEnd(22)} ${String(total).padStart(5)}`);
  if (unclassified.length) {
    console.error(`\n归不了类的 ${unclassified.length} 处：\n${unclassified.join('\n')}`);
    process.exitCode = 1;
  }
}

function verify(target) {
  if (!target) throw new Error('verify 要一个提交');
  const commit = git(['rev-parse', '--verify', `${target}^{commit}`]).trim();
  const parent = git(['rev-parse', '--verify', `${commit}^`]).trim();
  const directory = mkdtempSync(path.join(tmpdir(), 'qian-rename-verify-'));
  const work = path.join(directory, 'tree');
  try {
    git(['worktree', 'add', '--detach', '--quiet', work, parent]);
    const parentTracked = trackedFiles(work);
    const mode = parentTracked.includes('packages/yue/core/package.json') ? 'move' : 'replace';
    if (!parentTracked.includes(SCRIPT)) throw new Error(`父提交 ${parent.slice(0, 10)} 里没有 ${SCRIPT}`);
    execFileSync(process.execPath, [path.join(work, SCRIPT), mode], { cwd: work, stdio: ['ignore', 'ignore', 'inherit'] });
    git(['add', '-A'], { cwd: work });
    const rebuilt = git(['write-tree'], { cwd: work }).trim();
    const expected = git(['rev-parse', `${commit}^{tree}`]).trim();
    console.log(`父提交 ${parent.slice(0, 10)} 上重跑 ${mode}：得到的树 ${rebuilt}，${commit.slice(0, 10)} 的树 ${expected}`);
    if (rebuilt !== expected) {
      console.error(git(['diff', '--stat', expected, rebuilt], { cwd: work }));
      throw new Error('不一致');
    }
    console.log('逐字节相同。');
  } finally {
    try { git(['worktree', 'remove', '--force', work]); } catch { /* 已经不在 */ }
    rmSync(directory, { recursive: true, force: true });
  }
}

const [command, argument] = process.argv.slice(2);
const commands = { inventory, move, replace, check, verify: () => verify(argument) };
if (!commands[command]) {
  console.error('用法：node scripts/rename/rename.mjs inventory|move|replace|check|verify <提交>');
  process.exit(2);
}
commands[command]();
