# @cavailab/qian-biz

## 0.2.1

### Patch Changes

- be41903: 修复 0.2.0 一渲染组件就报错。0.2.0 的数据组件包与业务选择器包构建时用了经典 JSX 转换：发布的 `dist/index.js` 调用 `React.createElement`，模块里却没有导入 `React`，渲染这两个包的任何组件（如 `DataTable`、`Tree`、`OrganizeSelect`、`UserSelect`）都会报 `ReferenceError: React is not defined`。现在改用 automatic JSX runtime，从 `react/jsx-runtime` 导入，不再依赖全局的 `React`。组件的接口与行为没有变化。
  
  用到这两个包的项目请从 0.2.0 升到 0.2.1；8 个层包是同一个版本号，一起升。
- Updated dependencies [be41903]
  - @cavailab/qian-data@0.2.1
  - @cavailab/qian-core@0.2.1
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

### Patch Changes

- 286adf6: biz 交付基础版业务选择器：ApiSelect / useRemoteOptions、DictSelect、OrganizeSelect、UserSelect、RoleSelect、菜单与按钮授权树、IconPicker，全部经注入的 PlatformClient 取数、文案走 i18n key，取数契约由 OpenAPI 生成。data 的 Tree 增加 cascade 开关（关闭后节点独立勾选），TreeSelect / Cascader 触发器的可访问名称改为「标签 + 当前值」以满足 WCAG 2.5.3；core 导出已登记图标名 ICON_NAMES。
- Updated dependencies [286adf6]
- Updated dependencies [7310263]
- Updated dependencies [6871f2a]
- Updated dependencies [4fee304]
- Updated dependencies [7dd9917]
- Updated dependencies [2eab94c]
- Updated dependencies [7121e04]
- Updated dependencies [488d847]
- Updated dependencies [7aa70cc]
- Updated dependencies [466fad7]
- Updated dependencies [a5aa0be]
- Updated dependencies [90ac29a]
- Updated dependencies [7d98b6c]
- Updated dependencies [b2e1e2a]
- Updated dependencies [c7a5953]
- Updated dependencies [8dccae5]
- Updated dependencies [f12e059]
  - @cavailab/qian-data@0.2.0
  - @cavailab/qian-core@0.2.0
  - @cavailab/qian-sdk@0.2.0
