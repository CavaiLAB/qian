# AGENTS.md：给编码代理的入口说明

这个仓库是 **Qian** 的新家：匠心智能体平台的前端框架（TypeScript、React）。**框架库已连同提交历史从 `idadawn/qian` 导入（F1），并在 F2 里一次更名为 qian。** 怎么迁、迁到哪一步，见 [迁移与更名](docs/migration.md)。

## 先弄清名字

「Qian」换了所指。2026-11-17 之前它指基于 Kun 的平台层（`idadawn/qian` 仓库里的后端、`Qian.*` 包）；现在它只作前端框架的名字，也就是原来的 yue。原来叫 Qian 的后端并入 Kun。组件 id 前缀 `qian.`、`qian` 命令行这些保留下来的字面，不表示前端框架。完整的对照见平台总览仓库的[名称对照](https://github.com/CavaiLAB/jiangxin/blob/main/docs/glossary.md)。

现在代码里的名字：包名 `@cavailab/qian-<名>`、目录 `packages/qian/`、`apps/qian-playground`、`tests/gates/qian`，样式变量 `--qian-*`，测试标识的默认前缀 `qian-`，根脚本 `qian:*`。前端插件开发包与 TypeScript 运行时是 `@cavailab/qian-plugin-sdk`、`@cavailab/qian-runtime`，也以 `@cavailab/qian-` 开头，所以要指 8 个层包时逐个写名字或写 `packages/qian/*`，不要用 `@cavailab/qian-*` 通配（固定版本组与分层规则都是这样写的）。新旧名字的对照见[迁移说明](docs/migrating-from-yue.md)。

旧名字只留在这几类地方：任务号 `S1-YUE-*` 与提交历史，指向原仓库固定提交的地址，后端仓库里的文件、文档站路由与根脚本（如 `yue:docs`），契约副本与它的领先登记，导入脚本，以及迁移文档里的新旧对照。`node scripts/rename/rename.mjs check` 把剩下的每一处归类，有归不了类的就失败。

## 代码在哪里

| 路径 | 内容 |
|---|---|
| `packages/qian/*` | 8 个包：设计令牌、界面契约、基础组件、开发包、外壳组件、数据组件、表单、业务选择器；分层矩阵在 `packages/qian/boundaries.config.mjs` |
| `apps/qian-playground` | 组件演练场，也是可访问性、首屏性能与视觉回归的靶场 |
| `packages/qian-plugin-sdk`、`packages/qian-runtime` | 前端插件开发包、TypeScript 运行时 |
| `tests/gates/qian` | 分层边界、循环依赖、包形状等门禁的自测 |
| `tools/openapi-codegen` | 接口类型生成工具，根脚本 `openapi:generate` 调它 |
| `backend-copy/` | 后端冻结契约的副本与来源清单，**不在这里改**，见那里的 README |
| `scripts/import/` | F1 的导入脚本与一致性证明。F2 合入之后不再从原仓库导入 |
| `scripts/rename/` | F2 的更名脚本：纯改名、机械替换、剩余检查与锁文件比对，都可重跑 |
| `scripts/release/` | 10 个包的打包验证、发布与干净消费者验证，`release` 工作流调用 |

## 要改代码

迁移分五个阶段，按 [迁移与更名](docs/migration.md) 第 3 节一个接一个做。动手之前先看它，弄清现在在哪个阶段。

- 迁入本仓库的只有框架库：8 个包、组件演练场、前端插件开发包、TypeScript 运行时、接口类型生成工具与前端门禁。应用外壳、三个组件自带的界面、参考应用的界面、文档站、命令行留在后端仓库，不要搬过来。
- 框架库的改动一律在本仓库做。原仓库里这些路径从源提交 `aafa0cc5ab` 起冻结，F2 合入之后不再从那边导入。
- 新写的代码与文档只用新名字。
- 后端的冻结契约在本仓库只有副本（`backend-copy/`），不在这里改。要改去后端仓库改，再按 [副本的说明](backend-copy/README.md) 更新副本与来源清单。
- 包不从本机发布，只经 `release` 工作流发布：只能在 `main` 上手动触发，见 [发布脚本](scripts/release/README.md)。发布之前要产品负责人点头；首发是 F3 的事。

## 在本机跑门禁

要 Node（`^22.12.0` 或 `>=24`）与 pnpm 12.9.1（根 `package.json` 的 `packageManager`），视觉回归还要 Docker。先装依赖与 Playwright 的 Chromium：

```bash
pnpm install
pnpm --filter qian-playground exec playwright install chromium
```

一把跑完八项门禁、视觉回归与构建：

```bash
pnpm qian:gates
```

也可以一项一项跑，与 CI 上 `qian` 工作流的检查一一对应：`pnpm qian:lint`、`qian:typecheck`、`qian:test`（unit，含真实浏览器用例）、`qian:boundaries`、`qian:circular`、`qian:publint`、`qian:a11y`、`qian:lighthouse`、`qian:visual`。a11y、lighthouse、视觉回归对构建后的演练场跑，先 `pnpm --filter qian-playground build`。CI 的 unit 一项另外跑这三条：

```bash
node scripts/backend-copy.mjs
pnpm --filter @cavailab/qian-contracts contracts:check
node --test packages/qian-plugin-sdk/scripts/private-publication.test.mjs
```

TypeScript 运行时（CI 上是 `runtime-ts` 工作流）：

```bash
pnpm --filter ./packages/qian-runtime build
pnpm --filter ./packages/qian-runtime check:api
pnpm --filter ./packages/qian-runtime test:types
pnpm --filter ./packages/qian-runtime test
pnpm --filter ./packages/qian-runtime test:browser
```

与 .NET 运行时共用的一致性用例留在后端仓库，`test` 里记为跳过；要在本机跑，按 [运行时的 README](packages/qian-runtime/README.md)「验证」一节准备一份后端检出，再用 `test:tck`。

视觉基线在 `apps/qian-playground/visual/__snapshots__`，只在固定的 Playwright 镜像里比对。F2 重拍了组件目录页头带旧名字的 148 张，经过见 [迁移与更名](docs/migration.md) 第 10 节。

打包验证（不发布）：10 个包各打一个 tarball，再在仓库外的空目录里只用这些 tarball 装起来、做类型检查与生产构建：

```bash
node scripts/release/pack.mjs <输出目录>
```

```bash
node scripts/release/consumer.mjs archive <输出目录>
```

## 要改文档

1. 文档用中文，不写参考平台和对标项目的名字。
2. 分清「已定」「提议」「待定」。更名、迁入的时点与范围、包名里的 `yue-` 换成 `qian-`、许可与许可证的版权行是已定的；首发的版本号、包的可见性与发布位置、文档站组件页由谁出是待定的，见 [迁移与更名](docs/migration.md) 第 8 节。
3. 说现状的时候写清是「已有」（在原仓库里已经实现）还是「规划」。
4. 平台级的口径（名称、三个框架的分工、契约）在 [jiangxin](https://github.com/CavaiLAB/jiangxin) 里改，这里只引用。
5. 改动走分支和 PR，不直接推 `main`。建仓期间的初始文档除外，见平台总览的[协作约定](https://github.com/CavaiLAB/jiangxin/blob/main/docs/07-governance.md)第 2 节。
6. 导入的包里的 README 与注释写于原仓库，提到的需求、规格与 ADR 在后端仓库；其中的链接已改成指向源提交的完整地址。那些后端文档写于更名之前，用的是旧名字，「Qian」在那里指平台。在本仓库写到后端平台时写「平台」或「Kun」，不要留下一个词两个意思的句子。
