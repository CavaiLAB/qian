# @cavailab/qian-biz

## 0.2.0

### Minor Changes

- 7121e04: 以新名字首次发布。前端框架更名为 qian：包名改为 `@cavailab/qian-<名>`，许可改为 MIT；样式变量与可寻址属性的前缀、测试标识的默认前缀、导出的公共类型名、浏览器里主题与外壳偏好的存储键（旧值不迁移）、插件界面清单的前端版本键一并换名，组件的接口与行为不变。新旧名字的逐项对照与使用方要改什么，见[迁移说明](https://github.com/CavaiLAB/qian/blob/main/docs/migrating-from-yue.md)。

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
