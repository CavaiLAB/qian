# @cavailab/qian-shell

AppShell 单一侧栏布局、菜单 → 路由、偏好、认证页族组件与契约、会话过期对话框、站内信与兜底页。本包只放通用 UI；对接平台的接线（运行时配置、网关 BFF 会话、bootstrap、能力导航、身份服务 AuthProvider）在后端仓库的私有包 [`@qian/shell-kit`](https://github.com/idadawn/qian/blob/aafa0cc5ab48637a1c634867d6cddb2935837814/packages/qian-shell-kit/README.md)，MF2 宿主与插槽在 [前端插件 SDK](https://github.com/CavaiLAB/qian/blob/main/packages/qian-plugin-sdk/README.md)。

- 分层与允许依赖：[qian 专题规格 §3.1](https://github.com/idadawn/qian/blob/aafa0cc5ab48637a1c634867d6cddb2935837814/docs/prd/specs/yue.md#31-包结构与依赖方向)；依赖方向由 `packages/qian/boundaries.config.mjs` 与 CI 门禁强制。
- 实现任务：S1-YUE-006；库 API、共用示例与认证边界见 [组件文档源](https://github.com/CavaiLAB/qian/blob/main/packages/qian/shell/docs/index.mdx)。

## 安装

包发在 GitHub Packages 上。它的 npm 包源装公开包也要带令牌（[GitHub 文档](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry#authenticating-to-github-packages)）：本机用有 `read:packages` 权限的个人访问令牌（classic）；GitHub Actions 里用工作流的 `GITHUB_TOKEN`，工作流要声明 `packages: read`。项目的 `.npmrc` 写作用域那一行；认证行只引用环境变量、不写令牌值，放在用户级配置里（`~/.npmrc`，或 `NPM_CONFIG_USERCONFIG` 指向的文件；GitHub Actions 里 `actions/setup-node` 填了 `registry-url` 就会生成这样一份），不放项目的 `.npmrc`：pnpm（10.34.2 起的 10、11.5.3 起的 11 与 12）不展开项目 `.npmrc` 认证行里的环境变量，写在那里会 401（[迁移说明](https://github.com/CavaiLAB/qian/blob/main/docs/migrating-from-yue.md)第 2 节）。

```ini
# 项目的 .npmrc
@cavailab:registry=https://npm.pkg.github.com
```

```ini
# ~/.npmrc，或 NPM_CONFIG_USERCONFIG 指向的文件
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

令牌放进环境变量 `NODE_AUTH_TOKEN`，再 `npm install @cavailab/qian-shell`。变更记录不随包发布，在[仓库里](https://github.com/CavaiLAB/qian/blob/main/packages/qian/shell/CHANGELOG.md)。

## 使用与职责

从包入口导入 AppShell、Page/PageHeader/ColPage/LeftTree、菜单注册表、Preferences 与认证页族。先用 SDK createI18n 建实例并调用 installShellLanguagePacks，再用 PreferencesProvider 注入 initPreferences 的结果。主题应用复用 tokens 的首帧脚本与 initializeTheme；不在库内复制主题或路由引擎。

AuthProvider 由宿主注入，认证页族不持有令牌。登录表单使用 form SchemaForm，租户切换成功后由宿主更新 session 与 SDK 的 getTenantId；SDK onSessionExpired 驱动 SessionExpiredDialog。Preferences 只允许非敏感字段，菜单解析校验外链协议与令牌参数。认证结果新增 `change-password`（初始密码或运营重置后强制改密，PasswordChange 表单按需加载），provider 没有实现 `changePassword` 时按失败处理。

### 外壳部件（S1-YUE-002 / S1-YUE-012）

- `createBrowserRouter` / `useRoutePath` / `matchMenuItem`（子路径 `./router`）：最小历史路由，pushState 加 popstate，按 pathname 精确匹配、再最长前缀；菜单驱动，不做嵌套路由与数据加载（PRD 7.15.1）。
- `menuTypeRegistry` / `safeNavigationUrl`（子路径 `./menu`）：菜单类型注册表与 URL 安全边界（拒绝危险协议与带令牌参数的地址）。
- `SessionExpiredDialog`（子路径 `./session-dialog`）：会话结束只弹一次、Esc 关不掉，确认后整页重新登录。
- `InboxPopover`（子路径 `./inbox`）：顶栏站内信弹窗，消息源由宿主注入（S1 没有站内信接口）。
- `initPreferences({ namespace, overrides, defaults })`：`defaults` 是部署缺省（例如运行时配置的语言），低于用户已保存的偏好，也不写进存储：存储只记用户自己改过的键（`update` 增量合并），`reset` 写空对象。

### 管理台布局（S1-YUE-017）

- AppShell 侧栏自上而下是品牌（`logo` 缺省为主色方块）、`workspace` 卡片（例如租户切换，侧栏收起时隐藏）、导航和账号卡（`userName` / `userDescription`，「用户菜单」里放 `userMenu` 与退出登录）。顶栏放侧栏开关、`breadcrumb` 与 `toolbar`；主区使用 `--qian-canvas` 画布底色。
- `ShellMenuItem` 新增 `icon`（qian 图标名，未登记的名称回落为缺省图标）、`group`（相邻同组项共用一个分组标题）和 `badge`（只展示，收起时变成圆点并保留读屏文字）。
- PreferenceControls 改为主题、语言两个图标按钮，展开为单选菜单（`menuitemradio`，选中即关闭）；语言以各自本名列出。

子路径让外壳首屏只拉需要的部分（首屏 JS 预算 250 KiB gzip）。平台的可部署外壳是后端仓库的 [apps/qian-shell](https://github.com/idadawn/qian/blob/aafa0cc5ab48637a1c634867d6cddb2935837814/apps/qian-shell/README.md)，认证页族是 [packages/qian-identity-ui](https://github.com/idadawn/qian/blob/aafa0cc5ab48637a1c634867d6cddb2935837814/packages/qian-identity-ui/README.md)；真实流程验收是后端仓库的 `pnpm yue:auth`，对 [tools/Qian.Dev.Shell](https://github.com/idadawn/qian/blob/aafa0cc5ab48637a1c634867d6cddb2935837814/tools/Qian.Dev.Shell/README.md) 拉起的真实 qian.identity、平台表面宿主与网关 BFF 运行。

## 模型体验

menuTypeRegistry.toJSON 可导出菜单类型元数据，注册返回可撤销的释放函数；控件暴露稳定 data-slot/data-testid。示例与验收状态登记在 docs/scenarios.json，Rspress 与靶场消费同一份 React 源码。靶场 `/shell.html` 默认展示已登录的布局，`?component=Authentication&state=MultiTenant` 可测试二次选择。请求走 SDK mock，不访问真实身份服务。

## 验证

组件级 browser/SSR 与注册表/Preferences 单测位于 src，页面交互位于 apps/qian-playground/e2e/shell.spec.ts，文档场景位于 website/e2e/shell.spec.ts。运行仓库 pnpm qian:gates；生成目录、dist、测试结果不提交。

发布形状使用 automatic JSX 与保留模块的 ESM，保持密码表单的动态 import 边界。仓库安装依赖并构建后运行 `node packages/qian/shell/scripts/verify-package.mjs`：脚本实际打包六个依赖包、在临时目录离线安装 tarball、构建独立消费者并用 Chromium 验证已登录首屏不加载密码表单、进入认证页才加载且无运行时错误。它不使用源码 alias 或 React 全局兜底；报告与消费者保留在脚本输出的临时目录。首次运行需已安装 Playwright Chromium。

## 已知限制与延期项

- 真实 OIDC code + PKCE、多租户选择、`prompt=select_account` 切换与 Cookie 会话由 S1-YUE-002 经网关 BFF 接线（浏览器零令牌，不再有 selection_token 进前端）；S1-YUE-012 把这些平台专有接线移到 `@qian/shell-kit`，与 S1-YUE-001 的 MF2 宿主一起融合进 `apps/qian-shell`。新名字从 0.2.0 起发布。
- 验证码登录与忘记密码为 P1，Captcha 为 P2，七种布局与偏好抽屉为后续范围。
