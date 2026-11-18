# @cavailab/qian-biz

业务选择器：ApiSelect / `useRemoteOptions`、DictSelect、OrganizeSelect、UserSelect、RoleSelect、菜单 / 按钮授权树（AuthorizationTree）、IconPicker。

- 分层与允许依赖：[qian 专题规格 §3.1](https://github.com/CavaiLAB/kun/blob/aafa0cc5ab48637a1c634867d6cddb2935837814/docs/prd/specs/yue.md#31-包结构与依赖方向)；依赖方向由 `packages/qian/boundaries.config.mjs` 与 CI 门禁强制（biz 只依赖 core、data、form、sdk 与底层包，本包实际用到 core、data、sdk）。
- 实现任务：S1-YUE-010（S1-DEC-024 / R109 自 S1-YUE-009 拆出）。组件文档与交互示例：文档站「组件 → qian 组件库 → 业务选择器」，源在 `docs/index.mdx`。

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

令牌放进环境变量 `NODE_AUTH_TOKEN`，再 `npm install @cavailab/qian-biz`。变更记录不随包发布，在[仓库里](https://github.com/CavaiLAB/qian/blob/main/packages/qian/biz/CHANGELOG.md)。

## 使用

```tsx
import { OrganizeSelect, UserSelect, RoleSelect, AuthorizationTree, createBizI18n } from '@cavailab/qian-biz';

const i18n = createBizI18n(); // 已有 PlatformI18n 实例时改用 addBizLanguagePacks(i18n)
<OrganizeSelect client={client} i18n={i18n} label="部门" value={orgId} onChange={setOrgId} />
<UserSelect client={client} i18n={i18n} label="成员" organizationId={orgId} valueKey="person" multiple value={people} onChange={setPeople} />
<RoleSelect client={client} i18n={i18n} label="角色" value={roleCode} onChange={setRoleCode} />
<AuthorizationTree client={client} i18n={i18n} label="角色权限" value={grants} onChange={setGrants} />
```

- **取数**：全部经宿主注入的 `PlatformClient`（`client` 属性）。路径与类型由 `contracts/biz.openapi.json` 生成到 `src/biz.generated.ts`，改契约后运行 `pnpm --filter @cavailab/qian-biz contracts:generate`，`pnpm qian:test` 会比对漂移。`/api/directory/**` 与身份组件 Identity Server 逐字段一致；`/api/authz/roles`、`/api/authz/permissions` 是 PRD 7.5 角色与权限点目录的草案，由 S1-AZ-005 接线时确认。
- **取值**：OrganizeSelect 给组织 id；UserSelect 默认给目录成员 id，`valueKey="person"` 给自然人 id（授权侧 user 主体的 subjectId）；RoleSelect 给角色 code；授权树给权限点全名数组。
- **文案**：组件不写死面向用户的文字，key 前缀 `biz.`，内置 zh-CN / zh-TW / en-US（`bizLanguagePacks`）。
- **树**：OrganizeSelect 单选复用 `@cavailab/qian-data` 的 TreeSelect，多选与授权树用同一 Tree 的复选（多选组织 `cascade={false}`），不另做一套树（规格 D3）。
- **可复用的数据口径**：`buildOrganizationTree`、`memberOption`、`roleLabel`、`groupPermissionCatalog`、`buildAuthorizationTree`、`linkAuthorization`、成员检索 `searchMembers` / 按 id 批量 `loadMembersByIds` 与各 `load*` 加载函数。

## 验证

- `pnpm exec vitest run --project biz-browser`：键盘路径、ARIA、axe（critical / serious = 0）；`acceptance.browser.test.tsx` 断言七个组件的请求全部经过注入客户端的中间件、没有任何直接网络调用，并用伪语言包检查界面上没有硬编码文案。
- `pnpm exec vitest run --project qian-ssr packages/qian/biz`：首帧 SSR 与源码静态约束（只有 `api.ts` 调用 `client.api()`，用到的 key 都已登记）。
- 靶场 `apps/qian-playground/biz.html` 与 `e2e/biz.spec.ts`：角色授予组合页全程键盘完成选部门、选人、选角色与授权树勾选；文档场景登记在 `docs/scenarios.json`，站点 E2E 为 `website/e2e/biz.spec.ts`。

## 已知限制与延期项

- UserSelect 由服务端检索（S1-IDP-010 的 `q`，按显示名、账号与拼音），每次只显示第一页 50 位，后面还有时提示继续输入，不做滚动加载；已选值的显示名按 `ids` / `person_ids` 批量回查（目录接口按 id 批量不分页，回查不带 offset / limit）。
- 角色与权限点目录的服务端尚未交付（S1-AZ-005）；真实目录数据的 E2E 见靶场的真实目录页（S1-IDP-010），角色授予与服务端生效的 E2E 在 S1-AZ-005。
- PosSelect / GroupSelect / UsersSelect、PopupSelect 族、RelationForm、InterfaceSelect 与授权树的列 / 字段 / 数据页签留给 S2。
