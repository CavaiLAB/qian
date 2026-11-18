# Qian TypeScript 运行时

依据 [组件模型 §5](https://github.com/CavaiLAB/kun/blob/aafa0cc5ab48637a1c634867d6cddb2935837814/docs/prd/specs/component-model.md#5-运行时模型) 与 [S1-RT-003](https://github.com/CavaiLAB/kun/blob/aafa0cc5ab48637a1c634867d6cddb2935837814/pm/tasks/S1-RT-003.md)。物理包名是 `@cavailab/qian-runtime`（GitHub Packages 要求作用域与仓库所有者同名），发布在 GitHub Packages，包是公开的。消费者通过 npm alias 保留公共逻辑导入名 `@qian/runtime`。

## 安装

包发在 GitHub Packages 上。它的 npm 包源装公开包也要带令牌（[GitHub 文档](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry#authenticating-to-github-packages)）：本机用有 `read:packages` 权限的个人访问令牌（classic）；GitHub Actions 里用工作流的 `GITHUB_TOKEN`，工作流要声明 `packages: read`。消费项目的 `.npmrc` 写作用域那一行；认证行只引用环境变量、不写令牌值，放在用户级配置里（`~/.npmrc`，或 `NPM_CONFIG_USERCONFIG` 指向的文件；GitHub Actions 里 `actions/setup-node` 填了 `registry-url` 就会生成这样一份），不放项目的 `.npmrc`：pnpm（10.34.2 起的 10、11.5.3 起的 11 与 12）不展开项目 `.npmrc` 认证行里的环境变量，写在那里会 401（[迁移说明](https://github.com/CavaiLAB/qian/blob/main/docs/migrating-from-yue.md)第 2 节）。

```ini
# 项目的 .npmrc
@cavailab:registry=https://npm.pkg.github.com
```

```ini
# ~/.npmrc，或 NPM_CONFIG_USERCONFIG 指向的文件
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

令牌放进环境变量 `NODE_AUTH_TOKEN` 后安装固定版本：

```bash
npm install '@qian/runtime@npm:@cavailab/qian-runtime@0.2.1'
```

`package.json` 的依赖值为 `"@qian/runtime": "npm:@cavailab/qian-runtime@0.2.1"`，下文逻辑导入名保持一致。变更记录不随包发布，在[仓库里](https://github.com/CavaiLAB/qian/blob/main/packages/qian-runtime/CHANGELOG.md)。源码工作区内部构建按目录筛选包；发版只经本仓库的 `release` 工作流（在 main 上手动触发）：先核对门禁，打包后先在仓库外的干净项目里用这批制品装一遍、跑一遍，再按清单版本发布，发完从包源安装并构建，见[发布脚本](https://github.com/CavaiLAB/qian/blob/main/scripts/release/README.md)。

`scripts/verify-consumer.mjs` 是本包自己的制品验收：在仓库外的空项目里经逻辑导入名 `@qian/runtime` 装上制品（`file:<tarball>` 或 `npm:@cavailab/qian-runtime@<版本>`），实际装载、派发、卸载一次，核对许可证文件随包，再按 NodeNext 解析做类型检查。CI 的 `runtime-ts` 工作流对每次改动的打包结果跑它，`release` 工作流在上传前对 tarball、发布后对包源各跑一次。

## 装配与使用

本目录包含上下文、作用域服务、事件、效果栈与装载器。可用于所有 TS profile，主要承载 qian 外壳插件树；这是运行时底座，不新增业务 seam，也不依赖平台三件套。`qian add` 的安装编排由后续 CLI 任务消费本包，当前不执行包安装或远程代码装载。

```ts
import { PluginLoader } from '@qian/runtime';
const runtime = new PluginLoader();
await runtime.mount([{
  entry: { id: 'example', plugin: 'com.example.demo', version: '1.0.0', scope: 'global', layer: 0, config: {} },
  provides: ['message'],
  plugin: { name: 'com.example.demo', apply(ctx) { ctx.provide('message', 'hello'); } }
}]);
console.log(runtime.getContext('example').inject('message'));
await runtime.dispose();
```

`provide`、`on`、`restrict` 返回幂等 disposer，并自动进入本次 Apply 的效果栈；第三方资源用 `effect`。`provide` 返回的 `RegistrationHandle` 另有 `replace(value)`：同步地在原注册位替换值，读取方只看到旧值或新值，scope、顺序与独占性不变；依赖该键的条目与撤销后再登记一样重新 apply；已撤销或上下文已卸载时抛错。`scoped` 视图共享当前 Apply 的生命周期，scope 之间没有隐含继承。服务名与 Context 方法重名时使用显式 `inject`。必需依赖由 plugin.inject 与 definition.provides 共同建立，缺失/环路在任何 Apply 前拒绝；optionalInject 不阻止 Apply。配置输入克隆并冻结，宿主不得依赖插件修改原配置。

`mount`、`unmount`、`dispose` 串行执行；动态撤销使依赖者立即不可见，`whenIdle` 等待级联释放与恢复。级联清理等待某个撤销期间，别的调用方再撤销、替换或改 restriction 时，装载器同样先逆序撤销所有回到 Pending 的旧上下文，再重新 apply。依赖若在某个条目的 apply 尚未结束时被撤销或替换，这次 apply 无论成败都作废：逆序撤销后回到 Pending，键再就绪时重新 apply，不记为 Failed；apply 自己的注册或 restriction 改变了所注入键的可见性时仍为 Failed。`reload` 用新配置重新挂载，未提供运行时代码替换。`dumpConfig` 返回当前条目快照，卸载条目不残留。

## 固定依赖与语义差异

内部固定 vendor `@cordisjs/core` 3.18.1（MIT），来源 commit、npm integrity 与文件 SHA-256 见 `src/vendor/provenance.json`，构建先核对副本完整性。原许可证随包保留。仅使用其核心，不引入上游 CLI、包加载器、遥测或运行时下载。

上游承担插件 fork/生命周期、作用域资源与服务值存储。Qian 适配层明确处理以下差异：

| 约定 | 适配策略 |
|---|---|
| 异步逆序释放 | 每次 Apply 在上游 fork 挂一个组合 disposer，内部按 LIFO 逐项 await；失败仍继续释放 |
| 原子发布 | Apply 中的注册只对本次上下文可见，成功并满足 provides 后才对其它条目发布 |
| 两层扁平 scope | 服务按显式 scope 选本地项或 global；restriction 只过滤 global，多条取交集 |
| 五种分发 | Qian 按自己的快照、priority 和 scope 调度；emit 隔离异常，parallel 等全部完成后聚合，serial 首错中断 |
| bail 的空值 | 只有 null/undefined 继续；false、0、空字符串都是有效首值 |
| 诊断 | 从冻结错误码目录派生 ErrorDetail；未提供与被过滤统一 NOT_FOUND |

## 模型体验

Definition 定义服务键与事件。`list`、代理属性与显式执行使用同一可见性规则；具名过滤项与不存在项错误体相同。`getPendingDependencies`、`getState`、`getFailure` 面向宿主诊断，不能作为业务接口泄露不可见原因。可配置 `onError` 与 `onPending` 接收隔离的诊断；不默认打印业务异常。

## 验证

```bash
pnpm --filter ./packages/qian-runtime build
pnpm --filter ./packages/qian-runtime test
pnpm --filter ./packages/qian-runtime check:api
pnpm --filter ./packages/qian-runtime test:types
pnpm --filter ./packages/qian-runtime test:browser
```

`test` 跑 9 项边界/错误验证。与 .NET 运行时共用的一致性用例（TCK）留在后端仓库：TS harness 复用后端的 `tck/runtime/harness-ts.mjs` 与 `assembly-ts.mjs`，直接读取 26 个 YAML 场景与 T15–T17 的 3 个装配场景，不复制语言独立输入；从真实 minimal profile 起步，并调用真实 profile 装配器（后端命令行的 `profiles.js`）后挂载运行时。合计 38 项测试。

在本仓库跑 TCK 要一份后端仓库的检出，停在 `backend-copy/manifest.json` 记的来源提交上；清单记的仓库、提交与路径前缀可以用 `node scripts/backend-copy.mjs --print-source` 打出来。现在后端仓库是 `CavaiLAB/kun`，清单的路径前缀是它的过渡目录 `_import/qian/`。在检出里构建命令行，要在前缀那一层目录（现在是 `_import/qian/`）执行，不是检出的根目录：

```bash
pnpm install --frozen-lockfile --filter 'qian...'
pnpm --filter @qian/surfaces build && pnpm --filter qian build
```

再回到本仓库，用环境变量 `QIAN_TCK_BACKEND_DIR` 指向检出里的同一层目录。没设这个变量时 `test` 把 TCK 记为跳过，`test:tck` 直接报错：

```bash
QIAN_TCK_BACKEND_DIR=<后端检出>/_import/qian pnpm --filter ./packages/qian-runtime test:tck
```

CI 的 `runtime-ts` 工作流按同样的办法跑这一项。T19 自动热重载、T23 完整 platform 以及产品提示词链路的剩余验收见 S1-QA-002；不在测试里伪造这些产品功能。

## 已知限制与延期项

- 从 GitHub Packages 安装要带令牌，公开包也一样（见「安装」）；使用逻辑导入名的消费者必须声明上述 npm alias。
- 只负责宿主内运行时，不实现市场下载、配置 Schema 校验、持久化或远程 Provider 健康探测；由装配器在 mount 前完成。
- 生命周期内不要等待同一装载器的 mount/unmount/whenIdle，避免自等待。
- 调用方须配合取消信号；无法强制终止忽略取消的插件代码。
