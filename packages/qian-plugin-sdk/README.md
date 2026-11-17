# Qian 前端插件 SDK

逻辑名 `@qian/plugin-sdk`，GitHub Packages 上的发布名 `@cavailab/qian-plugin-sdk`（公开包）。目录模型与运行时语义见 [组件规格](https://github.com/idadawn/qian/blob/aafa0cc5ab48637a1c634867d6cddb2935837814/docs/prd/specs/component-model.md)，任务范围见 [S1-YUE-001](https://github.com/idadawn/qian/blob/aafa0cc5ab48637a1c634867d6cddb2935837814/pm/tasks/S1-YUE-001.md)。本包提供外壳 Definition 与运行时适配；qian 的组件层（`packages/qian/*`）保持可独立使用，不依赖本包。

## 安装与发布

包发在 GitHub Packages 上。它的 npm 包源装公开包也要带令牌（[GitHub 文档](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry#authenticating-to-github-packages)）：本机用有 `read:packages` 权限的个人访问令牌（classic）；GitHub Actions 里用工作流的 `GITHUB_TOKEN`，工作流要声明 `packages: read`。消费项目的 `.npmrc` 配置 `@cavailab:registry=https://npm.pkg.github.com`；认证行 `//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}` 只引用环境变量、不能提交令牌值，放在用户级配置里（`~/.npmrc`，或 `NPM_CONFIG_USERCONFIG` 指向的文件；GitHub Actions 里 `actions/setup-node` 填了 `registry-url` 就会生成这样一份），不放项目的 `.npmrc`：pnpm（10.34.2 起的 10、11.5.3 起的 11 与 12）不展开项目 `.npmrc` 认证行里的环境变量，写在那里会 401（[迁移说明](https://github.com/CavaiLAB/qian/blob/main/docs/migrating-from-yue.md)第 2 节）。逻辑导入名通过 npm alias 保留：

```bash
npm install '@qian/plugin-sdk@npm:@cavailab/qian-plugin-sdk@0.2.1'
```

依赖为实际发布的 `@cavailab/qian-runtime`、`@cavailab/qian-sdk`（传递 contracts 与 tokens）、官方 MF2 runtime 与 SemVer；Ajv 只在构建期使用（见下文「校验不在运行期生成代码」）。`pnpm pack` 会把 workspace 依赖写成固定版本范围，包内只交付 ESM、声明与文档；本地 pack 不代表包源上发布成功。正式发布与仓库外的干净消费者验证由本仓库的 `release` 工作流执行，见[发布脚本](https://github.com/CavaiLAB/qian/blob/main/scripts/release/README.md)。新名字从 0.2.0 起发布，旧名字 `@idadawn/qian-plugin-sdk` 不再出新版本。变更记录不随包发布，在[仓库里](https://github.com/CavaiLAB/qian/blob/main/packages/qian-plugin-sdk/CHANGELOG.md)。

### 制品验收

`scripts/verify-consumer.mjs` 在仓库外的空项目里经逻辑导入名 `@qian/plugin-sdk` 装上运行时、tokens、contracts、sdk 与本包的制品（`archive <打包目录>` 用 `scripts/release/pack.mjs` 打出的 tarball，`registry` 从包源装已发布的版本），实际跑一遍 `ShellHost` 的登记、按需加载、桥接调用与卸载，再按 NodeNext 解析做类型检查。CI 的 `qian` 工作流与 `release` 工作流都跑它，见[发布脚本](https://github.com/CavaiLAB/qian/blob/main/scripts/release/README.md)。

## 宿主与远程

宿主创建 `ShellHost`，提供身份上下文、挂载、权益、权限、同一个 `PlatformClient`、导航/通知处理器以及必需的 `audit` 适配器。`start()` 挂载真实 `qian.shell` 根条目，`registerRemote()` 只登记可信清单，不发网络请求。`catalog(slot)` 由静态贡献生成导航；`loadSlot(slot, id)` 仅为当前页面需要的贡献调用 MF2 `registerRemotes / loadRemote`；`preloadSlot` 复用相同授权与版本检查。宿主可消费服务端已裁剪目录，但每次调用仍校验当前权限与 scope。

```ts
import { ShellHost } from '@qian/plugin-sdk';
import { createFederationTransport } from '@qian/plugin-sdk/federation';

// shared 工厂由宿主提供实际 React、qian 和 SDK 实例；不创建第二套 React。
const federation = createFederationTransport('example_shell', shared);
const host = new ShellHost({ ...trustedHostAdapters, federation });
await host.start();
host.registerRemote(trustedRemoteRegistration);
const menu = host.catalog('qian.shell.nav/v1');
await host.loadSlot('qian.shell.nav/v1', menu[0]?.descriptor.id);
```

官方可运行接线见 [qian.shell](https://github.com/idadawn/qian/blob/aafa0cc5ab48637a1c634867d6cddb2935837814/apps/qian-shell/README.md)。`engines.qian` 在任何远程请求之前做 SemVer 检查；不满足时写结构化控制台事件，等待审计成功后抛 `ShellError`（`INPUT_INVALID`、`/engines/qian`）。审计失败向调用方传播，不能悄悄降级为只有控制台。错误细节沿冻结 ErrorDetail，错误目录由 `contracts/v0/error-codes.json` 派生并检查新鲜度。

远程 `mf-manifest.json`、`remoteEntry.js` 与 `@mf-types.zip / .d.ts` 由官方 Vite 插件生成。宿主采用 MF2 runtime 显式共享工厂；远程的 React、qian、SDK 全部 `import: false`，只能消费宿主 singleton。宿主完整根包按需加载，首次布局用现有 qian 的子路径；没有引入第二套 UI 引擎或裁剪后回落双份共享包。

## 插槽、作用域与桥接

`slotContracts` 导出六份带独立 `$id` 与 `/v1` 的输入 JSON Schema；`SlotOutputs` 定义各插槽输出，`listSlot()` 提供对应静态类型。`ui/manifest.json` 的 `pages[].nav` 转为导航贡献，其他表面通过 `contributions` 指定 `slot / id / title / description / permission / expose`；客户端动作另带 `parameters`。无效 Schema、未知字段、未声明 expose 与重复贡献拒绝登记。

**校验不在运行期生成代码（S1-YUE-012）**：外壳的 meta CSP 只放行同源脚本与按哈希列出的内联脚本，不放行 `'unsafe-eval'`：此前为 `@cavailab/qian-form` 运行期用 Ajv 编译表单 Schema 登记的这一例外已由 S1-YUE-014 撤销，SchemaForm 改为解释执行。SDK 与远程页面在外壳源里的运行时路径都不得用 `new Function` / `eval`。UI 清单与插槽贡献的校验器由 `scripts/ui-schema.mjs` 在构建期用 Ajv standalone 预编译成 `src/ui-validators.generated.ts`（`--check` 比对新鲜度）；客户端动作的 `parameters` 在登记时由 `compileParameters` 解释执行一个封闭的 JSON Schema 子集（`type`、`enum`、`const`、`properties`、`required`、`additionalProperties`、对象与数组的个数约束、`items`、`uniqueItems`、字符串长度（按码点）与 `pattern`、数值范围与 `multipleOf`，注释类关键字忽略），子集之外的关键字拒绝登记（`INPUT_INVALID`、`/parameters`），嵌套深度上限 32。`test/parameters.test.ts` 另有静态检查，确认这些模块里没有 Ajv 运行时导入与动态代码生成。

**远程作者注意（严格 CSP，S1-YUE-014）**：远程页面在外壳源里执行，受同一条 meta CSP 约束。下面三种写法会让 MF2 运行时走 `new Function` 分支，在外壳里直接失败：构建配置里设 `getPublicPath`（运行时用 `new Function` 求值 `mf-manifest.json` 的 `metaData.getPublicPath`）；`remoteEntry` 不是 `module` 类型（运行时按清单里的 `remoteEntry.type` 加载，而不是宿主登记时的类型，`system` 形态走 `new Function`）；定义 `FEDERATION_ALLOW_NEW_FUNCTION`（定义后 ESM 入口改用 `new Function` 包一层 `import()`）。页面内也不能编译 WASM（`script-src` 不含 `'wasm-unsafe-eval'`）。Worker 不受这条 meta CSP 约束（它的策略取自 Worker 脚本自己的响应，`worker-src` 只许同源），需要编译代码或 WASM 的工作放进 Worker。

每个加载的 expose 在真实 `PluginLoader` 中有自己的 Apply。贡献用 `ctx.provide(key, name, value)` 注册；相同槽位与名称的租户项遮蔽全局项。目录、读取、执行共用挂载/权益/权限过滤。`unloadRemote` 先撤销桥接访问，再逆序等待效果与注册释放；全局项随之重新可见。MF 已执行的 JavaScript 可能仍在浏览器模块缓存内，卸载承诺为逻辑贡献与生命周期撤销，不声称能清除 JavaScript 引擎代码缓存。

`window.__qian.bridge` 只公开调用入口，不公开注册身份的入口。宿主通过对象身份的 WeakMap 绑定真实远程 ID 与 scope，再将 `RemoteBridge` 交给对应远程。其中只读 `bridge.caller` 是受信任加载时生成的原对象句柄：远程可以调用 `window.__qian.bridge.getContext(bridge.caller)`，也可直接使用闭包形式的 `bridge.getContext()`；两条路径共享授权与撤销检查。自行填写同名 ID/scope、展开或 JSON 复制句柄都无效。每次调用重新检查注册仍有效、当前租户、挂载与权益，写操作额外验证能力声明与权限。卸载后保留的原句柄也失效，不提供公开 `open` 或 Dispatcher。

- `getContext()` 返回克隆且深冻结的 tenant、membership、app、locale、theme，不含令牌。
- `navigate()` 只接受清单白名单路由；导航资源引用沿现有 `Qian.Capabilities` 格式 `qian:<tenant>:<plugin>:page:<百分号编码路由>`，校验租户和插件后解析为同一路由。
- `notify()` 校验声明、等级和消息长度，消息作为文本处理。
- `invoke()` 复用 qian `PlatformClient`、请求拦截器和刷新队列；写类默认创建 UUID 幂等键并同时写入请求正文与 Idempotency-Key 头；也可从正文或选项传入同一键重试，两个来源冲突时拒绝请求。切换租户后的旧结果被拒绝，首次异步取令牌和刷新期间均不得改写旧租户请求。
- `registerClientAction()` 只能登记已声明的动作、参数 Schema 与权限，运行前再校验参数和权限；`exportClientActions()` 导出名称、描述、Schema、权限 JSON，卸载撤销旧执行引用。

## 模型体验

六类插槽与客户端动作的 JSON 目录可静态索引。过滤后的动作与不存在的动作统一 `NOT_FOUND`；Agent 不因此获得额外权限，也不从前端读取服务端工具或令牌。公开能力执行仍由服务端做最终鉴权、Schema 与幂等检查。

## 验证与边界

运行 `pnpm --filter @cavailab/qian-plugin-sdk test` 验证真实运行时遮蔽/卸载、深冻结、伪造身份、作用域与权限撤销、版本审计、网络等待时切租户、动作 Schema 和幂等请求；运行 `pnpm --filter qian-shell e2e` 验证真实 MF 制品、同实例 React/SDK/组件、预加载与类型归档、租户未挂载零请求和实际 PostgreSQL 审计链。

MF2 只加载可信官方 UI，不能隔离同一页面中的恶意 JavaScript。S3 的 Worker/iframe 沙箱独立推进。真实认证与会话刷新已由 YUE-012 接进外壳（`apps/qian-shell`），权益服务接线归 ENT-002，静态制品的镜像与部署归 DEP-008；这里交付明确的宿主注入端口、可部署静态目录及真实审计参考适配验收。
