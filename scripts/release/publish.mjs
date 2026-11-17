#!/usr/bin/env node
// 把 pack.mjs 打好的 10 个 tarball 发到 GitHub Packages（S1-YUE-022）。只在发布工作流里跑，不从本机发布。
//
//   node scripts/release/publish.mjs <pack.mjs 的输出目录>
//
// 先整组核对再上传：包源上已有同一版本的，完整性摘要必须与这次的制品相同（相同就跳过，不同就整组停下、一个都不传）；
// 上传后逐个回读版本与摘要。包源与可见性取包里 publishConfig 的写法，这里不改；发完打印每个包在包源上的可见性，不做断言。
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { PACKAGES, REGISTRY, REPOSITORY, SCOPE, workspacePackage } from './packages.mjs';

const [output] = process.argv.slice(2);
assert(output, '用法：node scripts/release/publish.mjs <打包目录>');
const { GITHUB_ACTIONS, GITHUB_REPOSITORY, GITHUB_REF, GITHUB_RUN_ID, GITHUB_SHA, NODE_AUTH_TOKEN, GITHUB_API_URL = 'https://api.github.com' } = process.env;
assert.equal(GITHUB_ACTIONS, 'true', '只在 GitHub Actions 里发布');
assert.equal(GITHUB_REPOSITORY, REPOSITORY, `只在 ${REPOSITORY} 里发布`);
assert.equal(GITHUB_REF, 'refs/heads/main', '只发布 main');
assert.match(GITHUB_RUN_ID ?? '', /^[1-9]\d*$/, '需要可追溯的 Actions 运行号');
assert(NODE_AUTH_TOKEN, '缺少发布凭据 NODE_AUTH_TOKEN');

const directory = path.resolve(output);
const records = JSON.parse(readFileSync(path.join(directory, 'packages.json'), 'utf8'));
assert.deepEqual(records.map((record) => record.name), PACKAGES.map(({ name }) => name), 'packages.json 要是 pack.mjs 打出的完整 10 个包');
for (const record of records) {
  const current = workspacePackage(PACKAGES.find(({ name }) => name === record.name).dir);
  assert.equal(record.version, current.version, `${record.name} 的制品版本与工作区不同`);
  assert.equal(path.dirname(path.resolve(record.archive)), directory);
  assert.equal('sha512-' + createHash('sha512').update(readFileSync(record.archive)).digest('base64'), record.integrity, `${record.name} 的制品在打包之后被改过`);
}

async function registryVersion(name, version) {
  const response = await fetch(`${REGISTRY}/${encodeURIComponent(name)}`, { headers: { Authorization: `Bearer ${NODE_AUTH_TOKEN}` }, cache: 'no-store' });
  if (response.status === 404) return null;
  assert.equal(response.status, 200, `读不到 ${name} 在包源上的版本（HTTP ${response.status}）`);
  return (await response.json()).versions?.[version] ?? null;
}

// 1. 整组核对：已有的同版本必须是同一份制品。
const existing = new Map();
for (const record of records) {
  const found = await registryVersion(record.name, record.version);
  if (found) assert.equal(found.dist?.integrity, record.integrity, `${record.name}@${record.version} 已在包源上且制品不同，不覆盖，整组停下`);
  existing.set(record.name, Boolean(found));
}

// 2. 上传缺的，再回读。
const config = mkdtempSync(path.join(tmpdir(), 'qian-publish-'));
try {
  writeFileSync(path.join(config, 'user.npmrc'), `${SCOPE}:registry=${REGISTRY}\n//${new URL(REGISTRY).host}/:_authToken=\${NODE_AUTH_TOKEN}\n`, { mode: 0o600 });
  const env = { ...process.env, NPM_CONFIG_USERCONFIG: path.join(config, 'user.npmrc') };
  for (const record of records) {
    if (!existing.get(record.name)) execFileSync('npm', ['publish', record.archive, `--registry=${REGISTRY}`, '--ignore-scripts'], { env, stdio: 'inherit' });
    const published = await registryVersion(record.name, record.version);
    assert(published, `${record.name}@${record.version} 发布之后在包源上查不到`);
    assert.equal(published.dist?.integrity, record.integrity, `${record.name}@${record.version} 包源上的制品与这次的不同`);
  }
} finally {
  rmSync(config, { recursive: true, force: true });
}

// 3. 报告：版本、摘要、这次是否上传、包源上的可见性（F3 之前由产品负责人定，这里只记录）。
const [owner] = REPOSITORY.split('/');
for (const record of records) {
  const response = await fetch(`${GITHUB_API_URL}/orgs/${owner}/packages/npm/${encodeURIComponent(record.name.split('/')[1])}`, { headers: { Authorization: `Bearer ${NODE_AUTH_TOKEN}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' } });
  const visibility = response.status === 200 ? (await response.json()).visibility : `读不到（HTTP ${response.status}）`;
  console.log(JSON.stringify({ package: record.name, version: record.version, integrity: record.integrity, uploaded: !existing.get(record.name), visibility, revision: GITHUB_SHA, run: GITHUB_RUN_ID }));
}
