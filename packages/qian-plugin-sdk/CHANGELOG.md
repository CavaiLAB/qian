# @cavailab/qian-plugin-sdk

## 0.2.0

### Minor Changes

- 7121e04: 以新名字首次发布。前端框架更名为 qian：包名改为 `@cavailab/qian-<名>`，许可改为 MIT；样式变量与可寻址属性的前缀、测试标识的默认前缀、导出的公共类型名、浏览器里主题与外壳偏好的存储键（旧值不迁移）、插件界面清单的前端版本键一并换名，组件的接口与行为不变。新旧名字的逐项对照与使用方要改什么，见[迁移说明](https://github.com/CavaiLAB/qian/blob/main/docs/migrating-from-yue.md)。
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
