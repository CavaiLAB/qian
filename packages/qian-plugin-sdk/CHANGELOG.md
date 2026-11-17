# @cavailab/qian-plugin-sdk

## 0.2.1

### Patch Changes

- be41903: 随 8 个层包的 0.2.1 一起发布。依赖的 `@cavailab/qian-sdk`、`@cavailab/qian-runtime` 写成 `^0.2.1`，包内说明的安装命令改为 0.2.1；代码与类型与 0.2.0 相同，用 0.2.0 的项目不需要特意升级。
- eb493d3: 包内说明的安装一段改为：项目的 `.npmrc` 只写作用域那一行，认证行放进用户级配置（`~/.npmrc`，或 `NPM_CONFIG_USERCONFIG` 指向的文件）。pnpm 10.34.2 起的 10、11.5.3 起的 11 与 12 不展开项目 `.npmrc` 认证行里的环境变量，照 0.2.0 说明里的写法用 pnpm 装包会得到 401。
- Updated dependencies [be41903]
- Updated dependencies [eb493d3]
  - @cavailab/qian-runtime@0.2.1
  - @cavailab/qian-sdk@0.2.1

## 0.2.0

### Minor Changes

- 7121e04: 以新名字首次发布。新旧名字的逐项对照与使用方要改什么，见[迁移说明](https://github.com/CavaiLAB/qian/blob/main/docs/migrating-from-yue.md)。
  
  - 包名：8 个层包（tokens、contracts、sdk、core、form、data、shell、biz）由 `@idadawn/yue-<名>` 改为 `@cavailab/qian-<名>`；`@cavailab/qian-runtime` 与 `@cavailab/qian-plugin-sdk` 原来就叫 qian，只把作用域由 `@idadawn` 改为 `@cavailab`。
  - 许可：10 个包都由 Apache-2.0 改为 MIT。
  - 随框架更名由 yue 改为 qian 的名字如下，每项只涉及写明的包：
    - CSS 变量前缀 `--yue-` 改为 `--qian-`：`@cavailab/qian-tokens` 定义的设计令牌，以及 `@cavailab/qian-core`、`@cavailab/qian-form`、`@cavailab/qian-data`、`@cavailab/qian-shell` 样式里用到的变量；`@cavailab/qian-contracts` 的组件清单 Schema 里，`tokens` 只接受 `--qian-` 开头的变量名。
    - 密度属性 `data-yue-density` 改为 `data-qian-density`（加在外层元素上切换表格行高）：`@cavailab/qian-tokens` 的样式与 `@cavailab/qian-data` 的表格。
    - 组件 `data-testid` 默认值的前缀 `yue-` 改为 `qian-`（例如 `qian-accordion`）：`@cavailab/qian-core`、`@cavailab/qian-form`、`@cavailab/qian-data`、`@cavailab/qian-shell`、`@cavailab/qian-biz`；`data-slot` 不变。
    - 导出的类型 `YueProps` 改为 `QianProps`：`@cavailab/qian-core`。
    - 机器清单文件 `dist/yue-manifest.json` 改为 `dist/qian-manifest.json`，子路径导出 `./manifest.json` 不变：`@cavailab/qian-core`。
    - 浏览器存储键（旧键里存的值不迁移，读不到时用默认值）：`@cavailab/qian-tokens` 主题偏好的默认键 `yue-theme` 改为 `qian-theme`；`@cavailab/qian-shell` 外壳偏好的键 `yue.preferences.<命名空间>` 改为 `qian.preferences.<命名空间>`。
    - 插件界面清单的前端版本键 `engines.yue` 改为 `engines.qian`，`ShellHost` 的选项 `yueVersion` 改为 `qianVersion`：`@cavailab/qian-plugin-sdk`。
  - 除了上面这些名字，更名没有改别的接口与行为。
- c7a5953: @cavailab/qian-shell 增加外壳首屏用的子路径导出 `./router`、`./menu`、`./inbox` 与按需加载的 `./session-dialog`（`SessionExpiredDialog` 仍从根入口导出）；`initPreferences` 新增 `defaults`：部署缺省（如运行时配置给的语言）低于已保存的偏好，且不写进偏好存储；偏好存储改为只记用户改过的键（`update` 增量合并，`reset` 写空对象），此前每次更新都写整份快照。@cavailab/qian-core 的外壳子集 `./shell` 补上 `Badge` 与 `Popover` / `PopoverTrigger` / `PopoverContent` / `PopoverTitle`，站内信弹窗不再把完整组件目录拉进首屏。
  
  @cavailab/qian-plugin-sdk 的 UI 清单与插槽贡献校验改为构建期预编译（由 UI 清单的 JSON Schema 经 Ajv standalone 生成）：浏览器运行时不再携带 Ajv 编译器、不在运行期生成代码，`ajv` 改为开发依赖。客户端动作的参数 Schema 改由可解释子集校验（类型、枚举 / 常量、对象、数组、字符串与数值约束及说明关键字）；`$ref`、组合、条件、`format` 等子集外关键字拒绝登记（`INPUT_INVALID`，指针 `/parameters`），此前按完整 2020-12 编译放行。

### Patch Changes

- Updated dependencies [7310263]
- Updated dependencies [7121e04]
- Updated dependencies [7d98b6c]
- Updated dependencies [b2e1e2a]
- Updated dependencies [f12e059]
  - @cavailab/qian-sdk@0.2.0
  - @cavailab/qian-runtime@0.2.0
