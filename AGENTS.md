# AGENTS.md：给编码代理的入口说明

这个仓库保存 **Qian** 前端框架（TypeScript、React），已于 2026-11-25 归档，只读。本次迁移按冻结版本 0.2.1 归档验收，业务预发保留原版外壳与现有数据。平台的 Web 和桌面端采用 DSH 客户端。[维护入口与迁移记录](docs/migration.md)

## 先弄清名字

平台的 .NET 包使用 `Kun.*` 命名。组件 ID 的 `qian.` 前缀与 `qian` 命令行由后端仓库维护。[Kun 仓库](https://github.com/CavaiLAB/kun)

代码里的名字：包名 `@cavailab/qian-<名>`、目录 `packages/qian/`、`apps/qian-playground`、`tests/gates/qian`，样式变量 `--qian-*`，测试标识的默认前缀 `qian-`，根脚本 `qian:*`。前端插件开发包与 TypeScript 运行时是 `@cavailab/qian-plugin-sdk`、`@cavailab/qian-runtime`，也以 `@cavailab/qian-` 开头，所以要指 8 个层包时逐个写名字或写 `packages/qian/*`，不要用 `@cavailab/qian-*` 通配（固定版本组与分层规则都是这样写的）。

`node scripts/rename/rename.mjs check` 对整个仓库做剩余检查，有归不了类的写法就失败，归类规则见 `scripts/rename/README.md`。

## 代码在哪里

| 路径 | 内容 |
|---|---|
| `packages/qian/*` | 8 个包：设计令牌、界面契约、基础组件、开发包、外壳组件、数据组件、表单、业务选择器；分层矩阵在 `packages/qian/boundaries.config.mjs` |
| `apps/qian-playground` | 组件演练场，也是可访问性、首屏性能与视觉回归的靶场 |
| `packages/qian-plugin-sdk`、`packages/qian-runtime` | 前端插件开发包、TypeScript 运行时 |
| `tests/gates/qian` | 分层边界、循环依赖、包形状等门禁的自测 |
| `tools/openapi-codegen` | 接口类型生成工具，根脚本 `openapi:generate` 调它 |
| `backend-copy/` | 后端冻结契约的副本与来源清单，**不在这里改**，见那里的 README |
| `scripts/import/` | F1 的导入脚本与一致性证明，现在不再导入 |
| `scripts/rename/` | F2 的更名脚本：纯改名、机械替换、剩余检查与锁文件比对，都可重跑 |
| `scripts/release/` | 10 个包的打包验证、发布与干净消费者验证，`release` 工作流调用 |

## 要改代码

查既有迁移的阶段与交付记录，见[迁移文档](docs/migration.md)第 3、9 至 12 节。

- 迁入本仓库的只有框架库：8 个包、组件演练场、前端插件开发包、TypeScript 运行时、接口类型生成工具与前端门禁。应用外壳、三个组件自带的界面、参考应用的界面、文档站、命令行留在后端仓库，不要搬过来。
- 框架库的改动一律在本仓库做，不再从后端仓库导入。仓库归档以后不接受改动；要再发版，先由仓库管理员取消归档。
- 新写的代码与文档只用上文列出的名字。
- 后端的冻结契约在本仓库只有副本（`backend-copy/`），不在这里改。要改去后端仓库改，再按 [副本的说明](backend-copy/README.md) 更新副本与来源清单。
- 10 个包的 0.2.0 和 0.2.1 均已发布。Qian 冻结在 0.2.1，不再发新版（2026-11-25 定）。已使用的发布流程与验收方法见[迁移文档](docs/migration.md)第 11 节。

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

也可以一项一项跑，与 CI 上 `qian` 工作流的检查一一对应：`pnpm qian:lint`、`qian:typecheck`、`qian:test`（unit，含真实浏览器用例）、`qian:boundaries`、`qian:circular`、`qian:publint`、`qian:a11y`、`qian:lighthouse`、`qian:visual`。a11y、lighthouse、视觉回归对构建后的演练场跑，先 `pnpm --filter qian-playground build`。CI 的 unit 一项另外跑这两条：

```bash
node scripts/backend-copy.mjs
pnpm --filter @cavailab/qian-contracts contracts:check
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

视觉基线在 `apps/qian-playground/visual/__snapshots__`，只在固定的 Playwright 镜像里比对。

打包验证（不发布）：10 个包各打一个 tarball，再在仓库外的空目录里只用这些 tarball 装起来、做类型检查与生产构建、实际渲染每个含 JSX 的包的组件，最后跑插件开发包的制品验收。CI 上是 `qian` 工作流 publint 那一项的最后一步：

```bash
node scripts/release/pack.mjs <输出目录>
```

```bash
node scripts/release/consumer.mjs archive <输出目录>
```

```bash
node packages/qian-plugin-sdk/scripts/verify-consumer.mjs archive <输出目录>
```

## 要改文档

1. 文档用中文，不写参考平台和对标项目的名字。
2. 分清「已定」「提议」「待定」。迁入的时点与范围、包名、许可与许可证的版权行、首发的版本号（0.2.0）、包的可见性（公开）、发布位置（GitHub Packages）是已定的，见 [迁移文档](docs/migration.md) 第 1 节。8 个层包统一定版本，运行时与前端插件开发包各自定版本。组件文档站按本仓库的核心包标签生成组件页。
3. 说现状的时候写清是「已有」（已经实现）还是「规划」。
4. 平台级的口径（名称、三个框架的分工、契约）在 [jiangxin](https://github.com/CavaiLAB/jiangxin) 里改，这里只引用。
5. 改动走分支和 PR，不直接推 `main`。建仓期间的初始文档除外，见平台总览的[协作约定](https://github.com/CavaiLAB/jiangxin/blob/main/docs/07-governance.md)第 2 节。
6. 包里的 README 与注释提到的需求、规格与 ADR 在后端仓库，链接指向后端仓库的固定提交。在本仓库写到后端平台时写「平台」或「Kun」，不要留下一个词两个意思的句子。
