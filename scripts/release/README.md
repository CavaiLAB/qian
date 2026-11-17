# 发布脚本

10 个包（`packages/qian/*` 的 8 个、运行时、前端插件开发包）的打包验证、发布与干净消费者验证。由 F2（S1-YUE-022）写好；首发是 F3（S1-YUE-024）的事，要产品负责人点头之后在 Actions 里对 `main` 手动运行 [`release`](../../.github/workflows/release.yml) 工作流。**不从本机发布。**

| 文件 | 作用 |
|---|---|
| `packages.mjs` | 10 个包的清单（按依赖顺序）、本仓库与包源，以及后端仓库要从安装目录读的文件 |
| `pack.mjs` | 构建并逐个 `pnpm pack`，核对每个 tarball：名字、版本、`license` 是 MIT、`repository` / `homepage` / `bugs` 指向本仓库、`exports` 指向的文件都在包里、工作区依赖已换成真实版本、没有测试文件；输出 tarball 与 `packages.json` |
| `consumer.mjs` | 在仓库外的空目录里新建一个项目，只用这 10 个包的制品装起来（`archive` 用本地 tarball，`registry` 从 GitHub Packages 装），再做一次类型检查与生产构建 |
| `gates.mjs` | 发布前核对：要发布的提交在 `qian`、`runtime-ts`、`backend-copy` 三个工作流里的最近一次运行都是成功 |
| `publish.mjs` | 把 tarball 发到 GitHub Packages：先整组核对，包源上已有的同一版本必须是同一份制品（相同就跳过，不同就一个都不传）；上传后逐个回读 |

## 发布工作流做什么

1. **门禁已通过**：只在 `main` 上、只能手动触发。`gates.mjs` 核对这个提交的三个门禁工作流都成功过；某个工作流因为路径过滤没在这个提交上跑，就先在 Actions 里对 `main` 手动运行它（三个工作流都能手动触发）。
2. **打包并发布**：`pack.mjs` 打包验证，`publish.mjs` 发布。版本号取各包的 `package.json`，包源与可见性取 `publishConfig`，工作流不改它们。
3. **干净消费者验证**：`consumer.mjs registry` 从包源装已发布的版本，类型检查并构建。

## 在本机做打包验证（不发布）

先装依赖，再打包、跑消费者：

```bash
node scripts/release/pack.mjs <输出目录>
```

```bash
node scripts/release/consumer.mjs archive <输出目录>
```

`consumer.mjs` 的第三方依赖从公共 npm 源装，版本取工作区里装着的版本；内部包之间的依赖用 `overrides` 落到同一批 tarball 上，不去包源里找。验证失败时设环境变量 `QIAN_CONSUMER_KEEP=1` 可以保留消费者目录。

类型检查以 `skipLibCheck: true` 为准，这是使用方的常见设置。另外会连同各包与第三方的声明文件再检查一遍，只报告有错误的声明文件，不计入结论。
