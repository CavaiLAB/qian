import { ESLint } from 'eslint';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// 分层边界门禁自测（S1-YUE-003 验收第 1 条）：用根 eslint.boundaries.config.mjs 对虚拟文件路径 lint，
// 文件不必真的存在——元素分类只看路径，import 说明符解析不到的按说明符匹配。
const ROOT = path.resolve(__dirname, '../../..');
const eslint = new ESLint({ cwd: ROOT, overrideConfigFile: path.join(ROOT, 'eslint.boundaries.config.mjs') });

async function lint(file: string, code: string) {
  const [result] = await eslint.lintText(code, { filePath: path.join(ROOT, file) });
  return (result?.messages ?? []).map((m) => `${m.ruleId}: ${m.message}`);
}

describe('qian 分层边界（docs/prd/specs/yue.md §3.1）', () => {
  it('前端插件开发包只消费qian底层，qian不能反向依赖插件开发包，应用可以消费它', async () => {
    expect(await lint('packages/qian-plugin-sdk/src/__ok__.ts', "export { PlatformClient } from '@cavailab/qian-sdk';\n")).toEqual([]);
    expect(await lint('packages/qian-plugin-sdk/src/__violation__.ts', "export { Button } from '@cavailab/qian-core';\n")).toHaveLength(1);
    expect(await lint('packages/qian/sdk/src/__violation__.ts', "export { ShellHost } from '@cavailab/qian-plugin-sdk';\n")).toHaveLength(1);
    expect(await lint('packages/qian/sdk/src/__violation__.ts', "export { ShellHost } from '@qian/plugin-sdk';\n")).toHaveLength(1);
    expect(await lint('apps/qian-playground/src/__ok__.ts', "export { ShellHost } from '@cavailab/qian-plugin-sdk';\n")).toEqual([]);
  });
  // 外壳、认证页族与参考远程可以引 @qian/shell-kit 的那几条用例随这些包留在后端仓库（S1-YUE-023）。
  it('平台专有的外壳接线（@qian/shell-kit）在 qian 之上：qian 包与插件开发包不得反向引用', async () => {
    expect(await lint('packages/qian/shell/src/__violation__.ts', "export { loadAppConfig } from '@qian/shell-kit';\n")).toHaveLength(1);
    expect(await lint('packages/qian/shell/src/__violation__.ts', "export { createIdentityAuthProvider } from '@qian/shell-kit/identity';\n")).toHaveLength(1);
    expect(await lint('packages/qian-plugin-sdk/src/__violation__.ts', "export { loadAppConfig } from '@qian/shell-kit';\n")).toHaveLength(1);
  });
  it('@cavailab/qian-biz 引用 @cavailab/qian-designer 之类的向上依赖被拒绝', async () => {
    const messages = await lint('packages/qian/biz/src/__violation__.ts', "import { Designer } from '@cavailab/qian-designer';\nexport const x = Designer;\n");
    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatch(/^boundaries\/dependencies: /);
    expect(messages[0]).toContain('@cavailab/qian-designer');
  });

  it('已建的包之间按矩阵：core 引 data 被拒绝，biz 引 core / data / form / sdk / tokens 放行', async () => {
    expect(await lint('packages/qian/core/src/__violation__.ts', "export { Tree } from '@cavailab/qian-data';\n")).toEqual([expect.stringMatching(/^boundaries\/dependencies: qian 分层违规：不得依赖 @cavailab\/qian-data/)]);
    expect(
      await lint(
        'packages/qian/biz/src/__ok__.ts',
        "import { cn } from '@cavailab/qian-core';\nimport { Tree } from '@cavailab/qian-data';\nimport { PACKAGE_NAME as form } from '@cavailab/qian-form';\nimport { PACKAGE_NAME as sdk } from '@cavailab/qian-sdk';\nimport { PACKAGE_NAME as tokens } from '@cavailab/qian-tokens';\nexport const all = [cn, Tree, form, sdk, tokens];\n",
      ),
    ).toEqual([]);
  });

  it('同层互不依赖：data 引 form 被拒绝；shell 引 form 是登记过的唯一例外', async () => {
    expect(await lint('packages/qian/data/src/__violation__.ts', "export { PACKAGE_NAME } from '@cavailab/qian-form';\n")).toHaveLength(1);
    expect(await lint('packages/qian/shell/src/__ok__.ts', "export { PACKAGE_NAME } from '@cavailab/qian-form';\n")).toEqual([]);
  });

  it('横切包只能依赖 tokens / contracts；最底层什么 @cavailab/qian-* 包都不能引', async () => {
    expect(await lint('packages/qian/sdk/src/__ok__.ts', "export { PACKAGE_NAME } from '@cavailab/qian-contracts';\n")).toEqual([]);
    expect(await lint('packages/qian/sdk/src/__violation__.ts', "export { cn } from '@cavailab/qian-core';\n")).toHaveLength(1);
    expect(await lint('packages/qian/tokens/src/__violation__.ts', "export { PACKAGE_NAME } from '@cavailab/qian-contracts';\n")).toHaveLength(1);
  });

  it('第三方库与包内相对引用放行；应用面可以引任何 qian 包；没登记的包名什么都不许引', async () => {
    expect(await lint('packages/qian/core/src/components/__ok__.tsx', "import { clsx } from 'clsx';\nimport { cn } from '../lib/cn';\nexport const x = [clsx, cn];\n")).toEqual([]);
    expect(await lint('apps/qian-playground/src/__ok__.tsx', "import { Tree } from '@cavailab/qian-data';\nimport { cn } from '@cavailab/qian-core';\nexport const x = [Tree, cn];\n")).toEqual([]);
    expect(await lint('packages/qian/unregistered/src/__violation__.ts', "export { PACKAGE_NAME } from '@cavailab/qian-tokens';\n")).toHaveLength(1);
  });
});
