# @cavailab/qian-contracts

## 0.2.0

### Minor Changes

- 7121e04: 以新名字首次发布。前端框架更名为 qian：包名改为 `@cavailab/qian-<名>`，许可改为 MIT；样式变量与可寻址属性的前缀、测试标识的默认前缀、导出的公共类型名、浏览器里主题与外壳偏好的存储键（旧值不迁移）、插件界面清单的前端版本键一并换名，组件的接口与行为不变。新旧名字的逐项对照与使用方要改什么，见[迁移说明](https://github.com/CavaiLAB/qian/blob/main/docs/migrating-from-yue.md)。

### Patch Changes

- 7310263: 增加统一 SchemaForm、FormApi、基本字段联动、编辑与只读模式、规则目录和弹层/消息 API；发布 FormSchema、ListSchema 与控件元数据草案及生成类型，SDK 控件类型复用该契约。
- 31add9a: 同步通用契约 v0 的冻结标记，随包发布的 ErrorDetail Schema 改为 frozen，字段与约束不变。
- 2eab94c: 交付基础组件、统一令牌与可寻址部件，新增机器可读组件清单及由 Schema 生成的类型。组件支持服务端渲染、键盘操作与明暗主题，通过无障碍验收。
- 8dccae5: 交付 TanStack Table 9 服务端表格、虚拟化树与选择器、日期时间范围、分片上传和图片预览；列元数据与上传接口的类型分别由 Schema 与 OpenAPI 生成。
- f12e059: 交付类型化 PlatformClient、并发刷新队列、ErrorDetail 字段错误、无损大整数、八类注册表与可替换网络层的 mock；新增三语言 i18n 和由 JSON Schema 生成的 SSE 事件类型。
