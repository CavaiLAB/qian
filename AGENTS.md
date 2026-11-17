# AGENTS.md：给编码代理的入口说明

这个仓库是 **Qian** 的新家：匠心智能体平台的前端框架（TypeScript、React）。**框架库已连同提交历史从 `idadawn/qian` 导入（F1），名字仍是 yue；下一步在 F2 里一次更名为 qian。** 怎么迁、迁到哪一步，见 [迁移与更名](docs/migration.md)。

## 先弄清名字

「Qian」换了所指。2026-11-17 之前它指基于 Kun 的平台层（`idadawn/qian` 仓库里的后端、`Qian.*` 包）；现在它只作前端框架的名字，也就是原来的 yue。原来叫 Qian 的后端并入 Kun。组件 id 前缀 `qian.`、`qian` 命令行这些保留下来的字面，不表示前端框架。完整的对照见平台总览仓库的[名称对照](https://github.com/CavaiLAB/jiangxin/blob/main/docs/glossary.md)。

F2 合入之前，代码里的名字都是导入时的样子：包名 `@idadawn/yue-*`、目录 `packages/yue/`、`apps/yue-playground`、`tests/gates/yue`，样式变量 `--yue-*`，根脚本 `yue:*`。前端插件开发包与 TypeScript 运行时的包名是 `@idadawn/qian-plugin-sdk`、`@idadawn/qian-runtime`。

## 代码在哪里

| 路径 | 内容 |
|---|---|
| `packages/yue/*` | 8 个包：设计令牌、界面契约、基础组件、开发包、外壳组件、数据组件、表单、业务选择器；分层矩阵在 `packages/yue/boundaries.config.mjs` |
| `apps/yue-playground` | 组件演练场，也是可访问性、首屏性能与视觉回归的靶场 |
| `packages/qian-plugin-sdk`、`packages/qian-runtime` | 前端插件开发包、TypeScript 运行时 |
| `tests/gates/yue` | 分层边界、循环依赖、包形状等门禁的自测 |
| `tools/openapi-codegen` | 接口类型生成工具，根脚本 `openapi:generate` 调它 |
| `backend-copy/` | 后端冻结契约的副本与来源清单，**不在这里改**，见那里的 README |
| `scripts/import/` | F1 的导入脚本与一致性证明，F2 合入之前补齐原仓库的改动也用它 |

## 要改代码

迁移分五个阶段，按 [迁移与更名](docs/migration.md) 第 3 节一个接一个做。动手之前先看它，弄清现在在哪个阶段。

- 迁入本仓库的只有框架库：8 个包、组件演练场、前端插件开发包、TypeScript 运行时、接口类型生成工具与前端门禁。应用外壳、三个组件自带的界面、参考应用的界面、文档站、命令行留在后端仓库，不要搬过来。
- 更名（F2）合入之前，框架库的功能改动不在本仓库直接做：原仓库里这些路径从源提交 `aafa0cc5ab` 起冻结，确有改动要进，先在原仓库合入，再按 [导入脚本](scripts/import/README.md) 的「增量补齐」补过来。F2 合入之后一律在本仓库改。
- 更名（F2）合入之前，名字仍是 yue。不要零散地先改名，更名只在 F2 那一个 PR 里做。
- 后端的冻结契约在本仓库只有副本（`backend-copy/`），不在这里改。要改去后端仓库改，再按 [副本的说明](backend-copy/README.md) 更新副本与来源清单。
- 包不从本机发布，只经发布工作流发布。发布之前要产品负责人点头。F1 删掉了两个旧名字的发布工作流，新的由 F2 写，在那之前本仓库不发布任何包。

## 在本机跑门禁

要 Node（`^22.12.0` 或 `>=24`）与 pnpm 12.9.1（根 `package.json` 的 `packageManager`），视觉回归还要 Docker。先装依赖与 Playwright 的 Chromium：

```bash
pnpm install
pnpm --filter yue-playground exec playwright install chromium
```

一把跑完八项门禁、视觉回归与构建：

```bash
pnpm yue:gates
```

也可以一项一项跑，与 CI 上 `yue` 工作流的检查一一对应：`pnpm yue:lint`、`yue:typecheck`、`yue:test`（unit，含真实浏览器用例）、`yue:boundaries`、`yue:circular`、`yue:publint`、`yue:a11y`、`yue:lighthouse`、`yue:visual`。a11y、lighthouse、视觉回归对构建后的演练场跑，先 `pnpm --filter yue-playground build`。CI 的 unit 一项另外跑这三条：

```bash
node scripts/backend-copy.mjs
pnpm --filter @idadawn/yue-contracts contracts:check
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

视觉基线在 `apps/yue-playground/visual/__snapshots__`，只在固定的 Playwright 镜像里比对。F1 不重拍基线；页头带旧名字的那部分在 F2 里重拍。

## 要改文档

1. 文档用中文，不写参考平台和对标项目的名字。
2. 分清「已定」「提议」「待定」。更名、迁入的时点与范围、包名里的 `yue-` 换成 `qian-`、许可是已定的；首发的版本号、包的可见性与发布位置、文档站组件页由谁出是待定的，见 [迁移与更名](docs/migration.md) 第 8 节。
3. 说现状的时候写清是「已有」（在原仓库里已经实现）还是「规划」。
4. 平台级的口径（名称、三个框架的分工、契约）在 [jiangxin](https://github.com/CavaiLAB/jiangxin) 里改，这里只引用。
5. 改动走分支和 PR，不直接推 `main`。建仓期间的初始文档除外，见平台总览的[协作约定](https://github.com/CavaiLAB/jiangxin/blob/main/docs/07-governance.md)第 2 节。
6. 导入的包里的 README 与注释写于原仓库，提到的需求、规格与 ADR 在后端仓库；其中的链接已改成指向源提交的完整地址。
