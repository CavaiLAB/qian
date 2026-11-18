# 发布脚本

10 个包（`packages/qian/*` 的 8 个、运行时、前端插件开发包）的打包验证、发布与干净消费者验证。由 F2（S1-YUE-022）写好，F3（S1-YUE-024）为首发补齐；要产品负责人点头之后在 Actions 里对 `main` 手动运行 [`release`](../../.github/workflows/release.yml) 工作流。**不从本机发布。** 发布当天照着做的步骤见[迁移文档](../../docs/migration.md)第 11.3 节。

| 文件 | 作用 |
|---|---|
| `packages.mjs` | 10 个包的清单（按依赖顺序）、本仓库与包源，以及后端仓库要从安装目录读的文件 |
| `pack.mjs` | 构建并逐个 `pnpm pack`，核对每个 tarball：名字、版本、`license` 是 MIT、`repository` / `homepage` / `bugs` 指向本仓库、`exports` 指向的文件都在包里、工作区依赖已换成真实版本、没有测试文件；包里说明文件的相对链接都指向随包发布的文件、说明里写的本仓库包版本与这次打包的版本一致、声明文件的相对引用都在包里且不引用 JSON、JS 里没有引用了却没有绑定的 `React`（经典 JSX 转换的产物，判定在 `free-react.mjs`）；输出 tarball 与 `packages.json`，最后打印每个包的完整性摘要 |
| `consumer.mjs` | 在仓库外的空目录里新建一个项目，只用这 10 个包的制品装起来（`archive` 用本地 tarball，`registry` 从 GitHub Packages 装），再做一次类型检查与生产构建；最后不经打包器，用 Node 直接加载装好的制品，以 `react-dom/server` 把每个含 JSX 的包至少渲染一个组件并核对输出 |
| `gates.mjs` | 发布前核对：要发布的提交在 `qian`、`runtime-ts`、`backend-copy` 三个工作流里的最近一次运行都是成功 |
| `publish.mjs` | 把 tarball 发到 GitHub Packages：先整组核对，包源上已有的同一版本必须是同一份制品（相同就跳过，不同就一个都不传）；上传后逐个回读（包源刚收下的版本最多等 75 秒）；最后报告每个包的摘要与可见性，不是 public 的在运行摘要里给出警告 |

运行时与插件开发包各有一个只验自己的制品验收，也在发布工作流里跑：`packages/qian-runtime/scripts/verify-consumer.mjs`（经逻辑导入名 `@qian/runtime` 装上、实际装载与卸载一次、NodeNext 下的类型检查）与 `packages/qian-plugin-sdk/scripts/verify-consumer.mjs`（经 `@qian/plugin-sdk` 装上运行时、tokens、contracts、sdk 与插件开发包，跑一遍 `ShellHost` 的登记、加载、桥接与卸载）。它们原来各自的发布脚本在 F3 删掉了。

## 发布工作流做什么

1. **门禁已通过**：只在 `main` 上、只能手动触发。`gates.mjs` 核对这个提交的三个门禁工作流都成功过；某个工作流因为路径过滤没在这个提交上跑，就先在 Actions 里对 `main` 手动运行它（三个工作流都能手动触发）。`workflow_dispatch` 总是跑 `main` 当时的最新提交，所以从触发门禁到运行 `release` 之间不要往 `main` 合入别的改动。
2. **打包并发布**：`pack.mjs` 打包验证；上传之前先用这批 tarball 跑 `consumer.mjs archive` 与上面两个制品验收（`archive` / `file:`），都过了才由 `publish.mjs` 发布。版本号取各包的 `package.json`，包源与可见性取 `publishConfig`，工作流不改它们。这批 tarball 与 `packages.json` 作为 `qian-packages` 留存在这次运行里。
3. **干净消费者验证**：`consumer.mjs registry` 从包源装已发布的版本，类型检查、构建并渲染组件；再从包源跑一遍两个制品验收。

发到一半失败，对同一提交重跑整个工作流即可：同一提交两次打包得到逐字节相同的 tarball（F3 实测，见[迁移文档](../../docs/migration.md)第 11.1 节），已经上传的包按摘要相同跳过，只传剩下的。摘要不同说明制品真的变了，`publish.mjs` 一个都不传；已发布的版本不覆盖，要改就出新版本。

## 在本机做打包验证（不发布）

先装依赖，再打包、跑消费者：

```bash
node scripts/release/pack.mjs <输出目录>
```

```bash
node scripts/release/consumer.mjs archive <输出目录>
```

```bash
node packages/qian-plugin-sdk/scripts/verify-consumer.mjs archive <输出目录>
```

CI 的 `qian` 工作流在 publint 那一项里对每个 PR 跑这三条，打包问题不会留到发布时才发现。

`consumer.mjs` 的第三方依赖从公共 npm 源装，版本取工作区里装着的版本；内部包之间的依赖用 `overrides` 落到同一批 tarball 上，不去包源里找。验证失败时设环境变量 `QIAN_CONSUMER_KEEP=1` 可以保留消费者目录。

类型检查以 `skipLibCheck: true` 为准，这是使用方的常见设置。另外会连同各包与第三方的声明文件再检查一遍（`skipLibCheck: false`）：本仓库 10 个包的声明文件有错误就不通过，第三方的只报告、不计入结论（现在报的是 `@module-federation` 的两处）。

出版本时（`pnpm changeset version` 之后），运行时与插件开发包说明里的安装命令写的是固定版本，要跟着改；`pack.mjs` 会核对。
