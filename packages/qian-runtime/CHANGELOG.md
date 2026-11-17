# @cavailab/qian-runtime

## 0.2.1

### Patch Changes

- be41903: 随 8 个层包的 0.2.1 一起发布。与 0.2.0 相比只改了包内说明（`README.md`），代码与类型相同，用 0.2.0 的项目不需要特意升级。

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
