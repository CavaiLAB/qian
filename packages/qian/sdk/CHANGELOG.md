# @cavailab/qian-sdk

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

- 7310263: 增加统一 SchemaForm、FormApi、基本字段联动、编辑与只读模式、规则目录和弹层/消息 API；发布 FormSchema、ListSchema 与控件元数据草案及生成类型，SDK 控件类型复用该契约。
- 7d98b6c: 为 MF2 外壳提供保留现有根 API 的按需子路径，并在首次异步取令牌时阻止跨租户重写请求。
- b2e1e2a: PlatformClient 新增 HttpOnly Cookie 会话宿主 `sessionProvider`：并发 401 合并成一次会话刷新，刷新结论之后才到达的 401 沿用结论。新增 `onSessionRefreshed` 通知，在重放之前同步发出；宿主收到 `onSessionExpired` 之后不得再从它发起新一轮。宿主回调同步抛错只异步上报，不影响等待中的请求与过期通知。@cavailab/qian-shell 新增外壳的通用部件：`createBrowserRouter` / `matchMenuItem` 路由、`InboxPopover` 站内信弹窗与 `PasswordChange` 改密页。平台专有的接线（运行时配置、网关 BFF 会话客户端、bootstrap、能力导航、认证页族适配）不在本包。
- f12e059: 交付类型化 PlatformClient、并发刷新队列、ErrorDetail 字段错误、无损大整数、八类注册表与可替换网络层的 mock；新增三语言 i18n 和由 JSON Schema 生成的 SSE 事件类型。
- Updated dependencies [c843008]
- Updated dependencies [7310263]
- Updated dependencies [31add9a]
- Updated dependencies [7dd9917]
- Updated dependencies [2eab94c]
- Updated dependencies [7121e04]
- Updated dependencies [7aa70cc]
- Updated dependencies [466fad7]
- Updated dependencies [a5aa0be]
- Updated dependencies [90ac29a]
- Updated dependencies [8dccae5]
- Updated dependencies [f12e059]
  - @cavailab/qian-tokens@0.2.0
  - @cavailab/qian-contracts@0.2.0
