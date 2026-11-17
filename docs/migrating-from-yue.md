# 从 yue 迁移到 qian

> 给框架的使用方。前端框架在 F2（S1-YUE-022）里由 yue 更名为 qian：只改名字，组件的接口与行为不变，版本号也没有动。F3 以新名字首发：10 个包统一 0.2.0，公开发布在 GitHub Packages（安装见第 2 节）。10 个包已于 2026-11-17 发布。0.2.0 的数据组件包与业务选择器包一渲染就报错，2026-11-18 以 0.2.1 返修，10 个包一起升，请直接用 0.2.1。更名的规则与经过见[迁移与更名](migration.md)第 5 节与第 10 节。

## 1 谁要改

| 你在做的事 | 要改的 |
|---|---|
| 安装、导入这些包 | 包名、`.npmrc` 的作用域、导入路径（第 2 节） |
| 覆盖样式变量、写测试选择器 | `--qian-*`、`data-qian-density`、测试标识的默认前缀（第 3 节） |
| 用到导出的类型与选项 | `QianProps`、`ShellHost` 的 `qianVersion` 等（第 4 节） |
| 依赖浏览器里存下的主题与偏好 | 存储键换了，旧值不迁移（第 5 节） |
| 写插件的界面清单、做外壳宿主 | `engines.qian`，要和后端一起换（第 6 节） |

## 2 包名与安装

| 旧 | 新 |
|---|---|
| `@idadawn/yue-<名>`（biz、contracts、core、data、form、sdk、shell、tokens） | `@cavailab/qian-<名>` |
| `@idadawn/qian-runtime` | `@cavailab/qian-runtime` |
| `@idadawn/qian-plugin-sdk` | `@cavailab/qian-plugin-sdk` |
| `.npmrc`：`@idadawn:registry=https://npm.pkg.github.com` | `@cavailab:registry=https://npm.pkg.github.com`。认证那一行的写法不变，但要放在用户级配置里，不放项目的 `.npmrc`（见下面「从 GitHub Packages 安装」） |
| 本机打包的文件名 `idadawn-yue-<名>-<版本>.tgz` | `cavailab-qian-<名>-<版本>.tgz` |
| 后端设计文档里的包简称 `@yue/<名>`；`@yue` 指这一组包 | `@cavailab/qian-<名>`；`packages/qian/*` 的 8 个包 |

- 作用域换成 `@cavailab`，是因为包发在 GitHub Packages 上，它要求包的作用域与仓库所有者同名。名字的其余部分照旧：`yue-` 换成 `qian-`，不换词。
- 逻辑导入名 `@qian/runtime`、`@qian/plugin-sdk` 不变，只改 npm 别名指向的包：`"@qian/runtime": "npm:@cavailab/qian-runtime@<版本>"`、`"@qian/plugin-sdk": "npm:@cavailab/qian-plugin-sdk@<版本>"`。
- 子路径不变，跟着包名换前缀即可，例如 `@cavailab/qian-tokens/theme.css`、`@cavailab/qian-core/manifest.json`、`@cavailab/qian-shell/router`。
- Tailwind 的工具类由使用方扫描组件源码生成。`@source` 指向安装目录的，路径里的包目录跟着换成 `@cavailab/qian-*`。
- 微前端的共享依赖按包名登记：宿主与远程的 `shared` 键与 `requiredVersion` 要一起换成新名字，否则两边各带一份。
- 各包导出的 `PACKAGE_NAME` 常量，值是新包名。
- 版本：F2 不改版本号；F3 以新名字首发，10 个包都是 0.2.0。2026-11-18 发 0.2.1：返修 data、biz 一渲染就报 `React is not defined`，10 个包一起升到 0.2.1（原因见[迁移与更名](migration.md)第 11.7 节），请用 0.2.1。8 个层包固定同一个版本号；运行时与插件开发包也以 `@cavailab/qian-` 开头，但不在固定组里，各自定版本（以后要不要把 10 个包锁成同一版本还没定）。0.2.0 对旧名字的最后一个版本是 minor，0.x 期间 minor 可能有破坏性变更，插件清单里 `engines.qian` 写 `^0.1.0` 的要放宽（第 6 节）。
- 变更记录在各包目录的 `CHANGELOG.md`（例如[基础组件包的](https://github.com/CavaiLAB/qian/blob/main/packages/qian/core/CHANGELOG.md)），不随包发布：各包的 `files` 不含它，打包也不会自动带上。
- 旧名字已经发布过的版本（tokens、contracts、sdk、运行时、插件开发包）不再出新版本。F5 删除旧名字的 3 个私有包，旧名字的运行时与插件开发包标弃用，见[迁移与更名](migration.md)第 3 节。

### 从 GitHub Packages 安装

包是公开的，但 GitHub Packages 的 npm 包源装公开包也要带令牌（GitHub 文档：[Authenticating to GitHub Packages](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry#authenticating-to-github-packages)，那里写明发布、安装、删除 private、internal 与 public 的包都需要访问令牌）。不带令牌装不上是预期的，不是没发布。

| 在哪里装 | 用什么令牌 |
|---|---|
| 本机 | 有 `read:packages` 权限的个人访问令牌（classic）。同一页写明这个包源只支持 classic 令牌 |
| GitHub Actions | 工作流自带的 `GITHUB_TOKEN`，工作流要声明 `permissions: packages: read`。公开的包任何仓库的工作流都能下载（[GitHub 文档](https://docs.github.com/en/packages/managing-github-packages-using-github-actions-workflows/publishing-and-installing-a-package-with-github-actions#default-permissions-and-access-settings-for-packages-modified-through-workflows)），不用另配访问权限 |

项目根目录的 `.npmrc`（和 `package.json` 放在一起）只写作用域那一行，可以提交：

```ini
@cavailab:registry=https://npm.pkg.github.com
```

认证那一行放进用户级配置：`~/.npmrc`，或者环境变量 `NPM_CONFIG_USERCONFIG` 指向的文件。它只引用环境变量，不写令牌值：

```ini
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

令牌放进环境变量 `NODE_AUTH_TOKEN` 再安装，例如 `pnpm add @cavailab/qian-core` 或 `npm install @cavailab/qian-core`。作用域要小写（同一页「Publishing a package」：包名与作用域只能用小写字母）。

认证行不要写进项目的 `.npmrc`。10.34.2 起的 pnpm 10、11.5.3 起的 pnpm 11 以及 pnpm 12（安全公告 [GHSA-3qhv-2rgh-x77r](https://github.com/pnpm/pnpm/security/advisories/GHSA-3qhv-2rgh-x77r)）不展开项目 `.npmrc` 认证设置里的环境变量：它忽略这一行、给出警告，装包得到 401；`~/.npmrc` 与 `NPM_CONFIG_USERCONFIG` 指向的文件里的照常展开（[pnpm 文档](https://pnpm.io/npmrc)「Environment variables in auth settings」）。npm 仍会展开项目 `.npmrc` 里的变量，所以同一份配置用 npm 能装、换成 pnpm 就装不上。2026-11-18 用 0.2.0 核对过：认证行写在项目 `.npmrc` 里，pnpm 12.9.1 与 11.5.3 都是 401，npm 11.20.0 与修复之前的 pnpm 11.2.2 能装；放进 `~/.npmrc` 或 `NPM_CONFIG_USERCONFIG` 指向的文件，pnpm 12.9.1 能装。

GitHub Actions 里用 `actions/setup-node` 并填 `registry-url: https://npm.pkg.github.com`：它把同样的认证行写进 `RUNNER_TEMP` 下的一份 `.npmrc`，再把 `NPM_CONFIG_USERCONFIG` 指向它，pnpm 与 npm 都会读。装包的步骤把 `NODE_AUTH_TOKEN` 设为 `${{ secrets.GITHUB_TOKEN }}`。本仓库的发布工作流与消费者验证也是把认证行写进 `NPM_CONFIG_USERCONFIG` 指向的文件再装的。

0.2.0 各包附带的说明还写着把认证行放进项目的 `.npmrc`，以这里为准；0.2.1 起包里的说明已经更正。

## 3 样式变量与可寻址属性

| 项 | 旧 | 新 |
|---|---|---|
| 样式变量 | `--yue-*` | `--qian-*`，名字的其余部分不变，例如 `--yue-primary` → `--qian-primary`；设计令牌包一共 329 个 |
| 表格密度 | `data-yue-density` | `data-qian-density` |
| 测试标识的默认值 | `yue-<组件>-<部件>` | `qian-<组件>-<部件>` |

- 自己的样式覆盖里引用了 `--yue-*` 的，换成 `--qian-*`。只是改名，取值与引用层级都没变。
- 测试里按默认测试标识找元素的，前缀 `yue-` 换成 `qian-`。已经用 `testId` 覆盖成自己的标识的，不受影响。`data-slot` 的取值不变。
- 组件没有带框架名字的类名。

## 4 导出的标识符

| 项 | 旧 | 新 |
|---|---|---|
| 组件属性的公共类型（`@cavailab/qian-core`） | `YueProps<P>` | `QianProps<P>` |
| `ShellHost` 的宿主版本选项（`@qian/plugin-sdk`） | `yueVersion`；不合法时的错误指针 `/yueVersion` | `qianVersion`；`/qianVersion` |
| 远程要求的版本不满足时的拒绝 | 错误指针 `/engines/yue`；审计事件的 `reason: 'engines.yue'` | `/engines/qian`；`reason: 'engines.qian'` |
| 基础组件包的机器清单文件 | `dist/yue-manifest.json` | `dist/qian-manifest.json`。包的导出路径 `@cavailab/qian-core/manifest.json` 不变，条目里的 `package` 是新包名 |
| 各包的 `PACKAGE_NAME` | `'@idadawn/yue-<名>'` | `'@cavailab/qian-<名>'` |

按审计事件的 `reason` 过滤远程拒绝的，过滤条件跟着改。

## 5 浏览器本地存储

| 用途 | 旧键 | 新键 |
|---|---|---|
| 主题偏好：`@cavailab/qian-tokens` 的主题控制器与首帧脚本，`storageKey` 的默认值 | `yue-theme` | `qian-theme` |
| 外壳偏好：`@cavailab/qian-shell` 的 `initPreferences` | `yue.preferences.<namespace>` | `qian.preferences.<namespace>` |

已定：键换名，不迁移旧值（合并蓝图 D23.18）。升级之后用户第一次打开，主题与外壳偏好回到默认值（外壳偏好回到部署缺省），重新设置一次就按新键保存；旧键留在浏览器里，不再读取。给主题控制器显式传了 `storageKey` 的，不受影响。

## 6 插件清单的版本键

插件界面清单里声明前端版本要求的键由 `engines.yue` 换成 `engines.qian`。取值照旧是 8 个层包的版本范围，宿主拿它和 `qianVersion` 比对。新名字的首个版本是 0.2.0，而 0.x 的 `^0.1.0` 不包含 0.2.0：换到新包的宿主报的是 0.2.0，清单还写 `^0.1.0` 的远程会被拒载，要放宽到 `^0.2.0`（或覆盖两者的范围）后重发；微前端共享依赖的 `requiredVersion` 同理。

这个键要清单、宿主与后端一起换：

- 新的插件开发包登记远程时只认 `engines.qian`。清单 Schema 要求有这个键、不许别的键，只写 `engines.yue` 的旧清单在 `registerRemote` 时就以 `INPUT_INVALID` 被拒。
- 界面清单 Schema 的唯一来源在后端仓库。后端的 Schema、一致性用例与命令行在 F4 之前只认 `engines.yue`。
- 所以 F4 之前，已部署的远程照旧写 `engines.yue`、配旧名字的插件开发包；F4 在后端仓库把 Schema、一致性用例、各界面清单与外壳一次换完。本仓库的 Schema 副本在 F2 先换成新键，登记为「领先于来源」，见[后端契约的副本](../backend-copy/README.md)。

## 7 不变的

- 下面这些运行期字面不表示前端框架，照旧：组件 id 前缀 `qian.`、`.qian-plugin/`、`x-qian-*`、`https://qian.dev/…`（包括组件清单 Schema 的 `$id`）、`qian` 命令行、`@qian/*` 导入名。
- 组件的接口与行为、`data-slot` 的取值。版本号在 F2 没有动，F3 首发时到 0.2.0（第 2 节）。
- 带旧名字的任务编号 `S1-YUE-*` 与提交历史。

## 8 改完怎么查

在自己的代码里不分大小写搜一遍 `yue`：样式、测试选择器、导入、`.npmrc`、界面清单里都不应再有（界面清单要等 F4，见第 6 节）；剩下的应该只是历史记录与任务编号。
