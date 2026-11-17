# @cavailab/qian-shell

## 0.2.1

### Patch Changes

- eb493d3: 包内说明的安装一段改为：项目的 `.npmrc` 只写作用域那一行，认证行放进用户级配置（`~/.npmrc`，或 `NPM_CONFIG_USERCONFIG` 指向的文件）。pnpm 10.34.2 起的 10、11.5.3 起的 11 与 12 不展开项目 `.npmrc` 认证行里的环境变量，照 0.2.0 说明里的写法用 pnpm 装包会得到 401。
- Updated dependencies [eb493d3]
  - @cavailab/qian-sdk@0.2.1
  - @cavailab/qian-core@0.2.1
  - @cavailab/qian-form@0.2.1

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

- 7dd9917: 管理台样式刷新：新增画布令牌 `--qian-canvas`，浅色侧栏改为白底。core 新增 Steps 步骤条、MenuRadioGroup / MenuRadioItem 单选菜单与 `isIconName`。Badge 支持状态圆点，Alert 支持标题与语气图标，Result 改为大图标居中版式，Button 新增 link 变体，Tabs 新增 line 变体与计数，Sheet 新增页头、主体、页脚与宽度档，Descriptions 新增上下排布，Pagination 改为描边按钮，图标从 14 个增加到 50 个。DataTable 改为卡片容器并支持表头插槽，页长显示「N 条/页」。SchemaForm 的枚举可按语言包前缀显示选项文案，新增 `qian.segmented` 分段控件。抽屉表单的操作按钮移到固定页脚，抽屉里的子步骤表单用 `inlineActions` 把按钮留在表单内、不占页脚。SchemaForm 新增带标题的字段组（无字段节点带 `labelKey`）与 `fieldExtra` 附加提示，自动填充语义补 name / email / tel / organization / one-time-code。AppShell 的侧栏改为品牌、工作区卡片、分组导航（支持图标与角标）和底部账号卡，顶栏放侧栏开关、面包屑与工具；主题和语言改为图标单选菜单。原有公开属性与受控协议保持兼容。
- 710ce91: 实现单侧栏外壳、页面族、可扩展菜单、非敏感 Preferences、注入式认证页族与租户切换、错误和离线兜底。
- 7aa70cc: 按租户开通流程的原型继续调整令牌与组件。
  
  tokens：新增状态图标档 `--qian-{ok,warn,error,info,neutral}-icon`（Tailwind 类 `text-*-icon`），用于结果页、检查列表等处的状态图标字形：warn 取 amber-600，比圆点用的实色深一档，大图标在浅底上更清楚；其余语气与实色相同。`-solid` 改为只用于圆点与进度填充。
  
  core：Result 的状态图标改用图标档，「审核中」等 warn 图标与原型一致。
  
  shell：AuthLayout 的 sign-in 侧栏标题改为上下自动外边距居中，不传 `footer` 时不再沉到底部压住装饰条；新增部件 `auth-layout-headline` 与 `auth-layout-decoration`。BrandMark 带 `data-slot="brand-mark"` 与默认 testId `qian-brand-mark`，可传 `testId` 覆盖。外壳顶栏含底边为 56px（此前 57px）。PasswordLogin「其他登录方式」分隔线到入口 24px，多个入口之间 12px。
- 466fad7: 按租户开通流程的原型补齐令牌与基础组件。
  
  tokens：画布改为冷灰（新增 slate 色阶与 650 档）；新增控件、次要、说明三档文字色，强边框，主色浅底 / 柔底 / 柔底文字 / 浅边框 / 强边框，状态色的边框 / 实色 / 深色文字三档，紫与青两种点缀色，品牌深色面三件套；组件层新增 `--qian-input-height`，输入类控件高度按场景整体调档；`--radius-xl` 为 12px；危险色、状态文字与状态底色按原型调整；正文行高改为固定 22px（`text-sm` 的行高写成 1.375rem，13px 的子元素继承同一行高），去掉 body 上强制的灰阶抗锯齿。
  
  core：Button 新增 `soft`、`destructive-outline` 变体与 `xs`、`xl` 尺寸，描边按钮改为强边框加控件文字，实心按钮的底色铺满透明边框（与同尺寸描边按钮外形一致，40px 按钮看上去就是 40px）；Badge 改为底色加边框加实色圆点，Tag 支持 `dot`；Alert 改用深一档文字并新增 `size="sm"`（表单内，文字取状态文字色），图标跟随文字色，md 带标题时上下 14px、标题与正文间距 2px；Result 去掉图标下方多出的间距与标题字距收紧，说明文字最宽 520px、用说明色；Avatar 新增 `tint`、`shape` 与按种子稳定取色的 `avatarTint`；Steps 新增 `tone="inverse"` 与 `size="lg"`；Tabs 的 line 变体新增 `countVariant="pill"`；Descriptions 新增 `grid`、`justified` 布局与 `span: 'full'`，并独立成模块（外壳子集只引 Descriptions 时不再带上 ScrollArea 与拖拽分栏）；MenuItem 新增 `variant="destructive"`；MenuSubTrigger 末尾加子菜单箭头；Input 的 `type="search"` 去掉浏览器自带的清除按钮；新增 globe、key、lock、message、network、shield、sliders、layoutGrid 图标，图标默认线宽 1.75；外壳子集 `./shell` 补上 Avatar、Breadcrumb、Descriptions 与 MenuSub / MenuSubTrigger。修复 Dialog / AlertDialog / Drawer / Popover / Sheet 的 Close 经 `render` 交给描边 Button 时边框被基础类盖成透明：Close 传了 `render` 时不再叠加基础按钮类，样式完全由 render 的元素决定（交给 Button 时用它自己的变体；交给其他元素时须自带样式）。
  
  data：DataTable 新增列 `align`、`toolbarEnd`、`columnToggle` 与 `density`，表头与分页栏按原型调整；表格内部滚动区改为 group，不再与外层出现两个同名 region 地标。TreeSelect 浮层给出固定宽度，树行不再换行（虚拟化行高固定，换行会盖住相邻行）。
  
  form：SchemaForm 新增 `size`、`layout`、`columnWidth`、`groupVariant="card"` 与 `fieldAdornment`（输入框内的后缀、输入框右侧的单位文字与附加按钮，后缀与单位关联到输入框）；`useConfirm` 新增 `tone: 'danger'` 与 `confirmLabel`；`useDrawer` 的 `description` 可传带格式的内容。
  
  shell：新增认证页布局 AuthLayout（品牌深色面加内容区，sign-in 与 form 两档）、PlainLayout、BrandMark、WorkspaceCard 与账号菜单里的语言子菜单 LocaleMenu；AppShell 的侧栏开关移到品牌行；PreferenceControls 新增 `locale` 与 `localeStyle`；PasswordLogin 改为 44px 控件，支持记住账号、忘记密码、其他登录方式与表单下方内容，不再依赖 SchemaForm；TenantSelection 改为工作空间卡片并支持 `applyHref`、`hideBack`，卡片按钮的可访问名称就是企业名，租户号与角色作为说明读出；Authentication 新增 `frame`、`loginProps` 与 `selectionProps`，不传 `frame` 时内容按原型列宽居中（登录 400px、选择工作空间 600px），不再铺满宿主容器；`matchMenuItem` 的根路径「/」只精确命中，不再作为所有路径的前缀。
  
  除 Close 传 `render` 时的样式来源（见上）与 Authentication 不传 `frame` 时的列宽外，原有公开属性保持兼容。
- 7d98b6c: 为 MF2 外壳提供保留现有根 API 的按需子路径，并在首次异步取令牌时阻止跨租户重写请求。
- b2e1e2a: PlatformClient 新增 HttpOnly Cookie 会话宿主 `sessionProvider`：并发 401 合并成一次会话刷新，刷新结论之后才到达的 401 沿用结论。新增 `onSessionRefreshed` 通知，在重放之前同步发出；宿主收到 `onSessionExpired` 之后不得再从它发起新一轮。宿主回调同步抛错只异步上报，不影响等待中的请求与过期通知。@cavailab/qian-shell 新增外壳的通用部件：`createBrowserRouter` / `matchMenuItem` 路由、`InboxPopover` 站内信弹窗与 `PasswordChange` 改密页。平台专有的接线（运行时配置、网关 BFF 会话客户端、bootstrap、能力导航、认证页族适配）不在本包。
- c7a5953: @cavailab/qian-shell 增加外壳首屏用的子路径导出 `./router`、`./menu`、`./inbox` 与按需加载的 `./session-dialog`（`SessionExpiredDialog` 仍从根入口导出）；`initPreferences` 新增 `defaults`：部署缺省（如运行时配置给的语言）低于已保存的偏好，且不写进偏好存储；偏好存储改为只记用户改过的键（`update` 增量合并，`reset` 写空对象），此前每次更新都写整份快照。@cavailab/qian-core 的外壳子集 `./shell` 补上 `Badge` 与 `Popover` / `PopoverTrigger` / `PopoverContent` / `PopoverTitle`，站内信弹窗不再把完整组件目录拉进首屏。
  
  @cavailab/qian-plugin-sdk 的 UI 清单与插槽贡献校验改为构建期预编译（由 UI 清单的 JSON Schema 经 Ajv standalone 生成）：浏览器运行时不再携带 Ajv 编译器、不在运行期生成代码，`ajv` 改为开发依赖。客户端动作的参数 Schema 改由可解释子集校验（类型、枚举 / 常量、对象、数组、字符串与数值约束及说明关键字）；`$ref`、组合、条件、`format` 等子集外关键字拒绝登记（`INPUT_INVALID`，指针 `/parameters`），此前按完整 2020-12 编译放行。
- Updated dependencies [286adf6]
- Updated dependencies [7310263]
- Updated dependencies [6871f2a]
- Updated dependencies [a161adf]
- Updated dependencies [4fee304]
- Updated dependencies [7dd9917]
- Updated dependencies [2eab94c]
- Updated dependencies [7121e04]
- Updated dependencies [30acf0c]
- Updated dependencies [488d847]
- Updated dependencies [7aa70cc]
- Updated dependencies [466fad7]
- Updated dependencies [a5aa0be]
- Updated dependencies [90ac29a]
- Updated dependencies [7d98b6c]
- Updated dependencies [b2e1e2a]
- Updated dependencies [c7a5953]
- Updated dependencies [390542c]
- Updated dependencies [f12e059]
  - @cavailab/qian-core@0.2.0
  - @cavailab/qian-form@0.2.0
  - @cavailab/qian-sdk@0.2.0
