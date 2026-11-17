#!/usr/bin/env node
// 发布前核对（S1-YUE-022）：要发布的这个提交在本仓库的门禁工作流里已经通过。只在发布工作流里跑。
//
// 每个工作流取这个提交上最近一次跑完的运行，结论必须是 success。路径过滤让某个工作流没在这个提交上跑过时，
// 先在 Actions 里对 main 手动运行它（三个工作流都能手动触发），再重跑发布。
import assert from 'node:assert/strict';
import { REPOSITORY } from './packages.mjs';

const REQUIRED_WORKFLOWS = Object.freeze([
  { file: '.github/workflows/qian.yml', what: '八项门禁与视觉回归' },
  { file: '.github/workflows/runtime-ts.yml', what: 'TS 运行时与运行时一致性用例' },
  { file: '.github/workflows/backend-copy.yml', what: '契约副本与后端比对' },
]);

const { GITHUB_REPOSITORY, GITHUB_REF, GITHUB_SHA, GITHUB_TOKEN, GITHUB_API_URL = 'https://api.github.com' } = process.env;
assert.equal(GITHUB_REPOSITORY, REPOSITORY, `只在 ${REPOSITORY} 里发布`);
assert.equal(GITHUB_REF, 'refs/heads/main', '只发布 main');
assert.match(GITHUB_SHA ?? '', /^[0-9a-f]{40}$/, '缺少 GITHUB_SHA');
assert(GITHUB_TOKEN, '缺少 GITHUB_TOKEN（要 actions: read）');

async function runsOf(file) {
  const runs = [];
  for (let page = 1; ; page += 1) {
    const url = `${GITHUB_API_URL}/repos/${REPOSITORY}/actions/workflows/${encodeURIComponent(file.split('/').at(-1))}/runs?head_sha=${GITHUB_SHA}&status=completed&per_page=100&page=${page}`;
    const response = await fetch(url, { headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' } });
    if (response.status === 404) return runs; // 默认分支上还没有这个工作流
    assert.equal(response.status, 200, `读不到 ${file} 的运行记录（HTTP ${response.status}）`);
    const { workflow_runs: batch } = await response.json();
    runs.push(...batch);
    if (batch.length < 100) return runs;
  }
}

const problems = [];
for (const { file, what } of REQUIRED_WORKFLOWS) {
  const runs = (await runsOf(file)).filter((run) => run.head_sha === GITHUB_SHA && run.head_branch === 'main' && ['push', 'workflow_dispatch'].includes(run.event));
  const latest = runs.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))[0];
  if (!latest) problems.push(`${file}（${what}）没有在 ${GITHUB_SHA.slice(0, 10)} 上跑完的运行：在 Actions 里对 main 手动运行它`);
  else if (latest.conclusion !== 'success') problems.push(`${file}（${what}）最近一次运行 ${latest.html_url} 的结论是 ${latest.conclusion}`);
  else console.log(`${file}（${what}）：${latest.html_url} 通过`);
}
if (problems.length) {
  console.error(`这个提交的门禁没有全部通过，不发布：\n${problems.map((problem) => `  ${problem}`).join('\n')}`);
  process.exit(1);
}
console.log(`${GITHUB_SHA.slice(0, 10)} 的门禁全部通过。`);
