---
"@cavailab/qian-form": minor
---

SchemaForm 的数据 Schema 与 FormSchema / ListSchema / WidgetMeta 元数据 Schema 改为解释型校验，不在运行期生成代码（外壳 CSP 不放行 `'unsafe-eval'` 也能用），不再依赖 ajv / ajv-formats。只接受 SchemaForm 用到的 JSON Schema 2020-12 子集，子集内的判定、错误顺序与错误对象与此前的 Ajv 2020（allErrors、strict: false、ajv-formats full）逐条一致；子集外的关键字、格式与引用在渲染前由 `assertFormSchema` 拒绝（`form.error.unsupportedKeyword`），参数不合法拒绝（`form.error.schema`），此前它们会被 Ajv 照常校验或忽略，属于收窄。`validateValues` / `validateMetadata` 的错误类型改为本包导出的 `SchemaError`（与 Ajv `ErrorObject` 同形），声明文件不再引用 ajv。

升级注意：8 个层包是固定版本组，这条 minor 把整组带到 0.2.0。插件开发包的宿主拿宿主传入的 `qianVersion`（平台外壳取 @cavailab/qian-shell 的版本）与远程清单的 `engines.qian` 做 SemVer 比对，`^0.1.0` 不包含 0.2.0，远程会被拒载。换到 0.2.0 时，远程清单的 `engines.qian` 与远程构建配置里共享依赖的 `requiredVersion`（包括同样升了 minor 的 `@cavailab/qian-plugin-sdk`）要一起放宽后重发。
