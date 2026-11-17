# 从 yue 迁移到 qian

> 给框架的使用方。前端框架在 F2（S1-YUE-022）里由 yue 更名为 qian：只改名字，组件的接口与行为不变，版本号也没有动。新名字的包还没有发布，首发是 F3 的事，首发的版本号待定；在那之前可以先按这份说明把自己的代码准备好。更名的规则与经过见[迁移与更名](migration.md)第 5 节与第 10 节。

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
| `.npmrc`：`@idadawn:registry=https://npm.pkg.github.com` | `@cavailab:registry=https://npm.pkg.github.com`，认证那一行不变 |
| 本机打包的文件名 `idadawn-yue-<名>-<版本>.tgz` | `cavailab-qian-<名>-<版本>.tgz` |
| 后端设计文档里的包简称 `@yue/<名>`；`@yue` 指这一组包 | `@cavailab/qian-<名>`；`packages/qian/*` 的 8 个包 |

- 作用域换成 `@cavailab`，是因为包发在 GitHub Packages 上，它要求包的作用域与仓库所有者同名。名字的其余部分照旧：`yue-` 换成 `qian-`，不换词。
- 逻辑导入名 `@qian/runtime`、`@qian/plugin-sdk` 不变，只改 npm 别名指向的包：`"@qian/runtime": "npm:@cavailab/qian-runtime@<版本>"`、`"@qian/plugin-sdk": "npm:@cavailab/qian-plugin-sdk@<版本>"`。
- 子路径不变，跟着包名换前缀即可，例如 `@cavailab/qian-tokens/theme.css`、`@cavailab/qian-core/manifest.json`、`@cavailab/qian-shell/router`。
- Tailwind 的工具类由使用方扫描组件源码生成。`@source` 指向安装目录的，路径里的包目录跟着换成 `@cavailab/qian-*`。
- 微前端的共享依赖按包名登记：宿主与远程的 `shared` 键与 `requiredVersion` 要一起换成新名字，否则两边各带一份。
- 各包导出的 `PACKAGE_NAME` 常量，值是新包名。
- 版本：F2 不改版本号（8 个层包 0.1.0，运行时 0.1.1，插件开发包 0.1.0）。8 个层包固定同一个版本号；运行时与插件开发包也以 `@cavailab/qian-` 开头，但不在固定组里，各自定版本。
- 旧名字已经发布过的版本（tokens、contracts、sdk、运行时、插件开发包）不再出新版本。F5 删除旧名字的 3 个私有包，旧名字的运行时与插件开发包标弃用，见[迁移与更名](migration.md)第 3 节。

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

插件界面清单里声明前端版本要求的键由 `engines.yue` 换成 `engines.qian`。取值照旧是 8 个层包的版本范围，宿主拿它和 `qianVersion` 比对。

这个键要清单、宿主与后端一起换：

- 新的插件开发包登记远程时只认 `engines.qian`。清单 Schema 要求有这个键、不许别的键，只写 `engines.yue` 的旧清单在 `registerRemote` 时就以 `INPUT_INVALID` 被拒。
- 界面清单 Schema 的唯一来源在后端仓库。后端的 Schema、一致性用例与命令行在 F4 之前只认 `engines.yue`。
- 所以 F4 之前，已部署的远程照旧写 `engines.yue`、配旧名字的插件开发包；F4 在后端仓库把 Schema、一致性用例、各界面清单与外壳一次换完。本仓库的 Schema 副本在 F2 先换成新键，登记为「领先于来源」，见[后端契约的副本](../backend-copy/README.md)。

## 7 不变的

- 下面这些运行期字面不表示前端框架，照旧：组件 id 前缀 `qian.`、`.qian-plugin/`、`x-qian-*`、`https://qian.dev/…`（包括组件清单 Schema 的 `$id`）、`qian` 命令行、`@qian/*` 导入名。
- 组件的接口与行为、`data-slot` 的取值、版本号。
- 带旧名字的任务编号 `S1-YUE-*` 与提交历史。

## 8 改完怎么查

在自己的代码里不分大小写搜一遍 `yue`：样式、测试选择器、导入、`.npmrc`、界面清单里都不应再有（界面清单要等 F4，见第 6 节）；剩下的应该只是历史记录与任务编号。
