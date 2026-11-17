# @cavailab/qian-sdk

## 0.2.0

### Minor Changes

- 7121e04: 以新名字首次发布。前端框架更名为 qian：包名改为 `@cavailab/qian-<名>`，许可改为 MIT；样式变量与可寻址属性的前缀、测试标识的默认前缀、导出的公共类型名、浏览器里主题与外壳偏好的存储键（旧值不迁移）、插件界面清单的前端版本键一并换名，组件的接口与行为不变。新旧名字的逐项对照与使用方要改什么，见[迁移说明](https://github.com/CavaiLAB/qian/blob/main/docs/migrating-from-yue.md)。

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
