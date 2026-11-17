# @cavailab/qian-form

## 0.2.1

### Patch Changes

- @cavailab/qian-contracts@0.2.1
  - @cavailab/qian-core@0.2.1
  - @cavailab/qian-sdk@0.2.1

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
- 30acf0c: SchemaForm 的数据 Schema 与 FormSchema / ListSchema / WidgetMeta 元数据 Schema 改为解释型校验，不在运行期生成代码（外壳 CSP 不放行 `'unsafe-eval'` 也能用），不再依赖 ajv / ajv-formats。只接受 SchemaForm 用到的 JSON Schema 2020-12 子集，子集内的判定、错误顺序与错误对象与此前的 Ajv 2020（allErrors、strict: false、ajv-formats full）逐条一致；子集外的关键字、格式与引用在渲染前由 `assertFormSchema` 拒绝（`form.error.unsupportedKeyword`），参数不合法拒绝（`form.error.schema`），此前它们会被 Ajv 照常校验或忽略，属于收窄。`validateValues` / `validateMetadata` 的错误类型改为本包导出的 `SchemaError`（与 Ajv `ErrorObject` 同形），声明文件不再引用 ajv。
  
  升级注意：8 个层包是固定版本组，这条 minor 把整组带到 0.2.0。插件开发包的宿主拿宿主传入的 `qianVersion`（平台外壳取 @cavailab/qian-shell 的版本）与远程清单的 `engines.qian` 做 SemVer 比对，`^0.1.0` 不包含 0.2.0，远程会被拒载。换到 0.2.0 时，远程清单的 `engines.qian` 与远程构建配置里共享依赖的 `requiredVersion`（包括同样升了 minor 的 `@cavailab/qian-plugin-sdk`）要一起放宽后重发。

### Patch Changes

- 7310263: 增加统一 SchemaForm、FormApi、基本字段联动、编辑与只读模式、规则目录和弹层/消息 API；发布 FormSchema、ListSchema 与控件元数据草案及生成类型，SDK 控件类型复用该契约。
- 6871f2a: 发布构建改用 automatic JSX runtime，生成显式运行时导入，修复安装真实制品后基础组件与表单因缺少全局 React 而无法渲染的问题。
- a161adf: SchemaForm 支持声明式密码输入与认证自动填充白名单，复用既有校验、提交和可访问性路径；密码只读时强制遮蔽。
- 7dd9917: 管理台样式刷新：新增画布令牌 `--qian-canvas`，浅色侧栏改为白底。core 新增 Steps 步骤条、MenuRadioGroup / MenuRadioItem 单选菜单与 `isIconName`。Badge 支持状态圆点，Alert 支持标题与语气图标，Result 改为大图标居中版式，Button 新增 link 变体，Tabs 新增 line 变体与计数，Sheet 新增页头、主体、页脚与宽度档，Descriptions 新增上下排布，Pagination 改为描边按钮，图标从 14 个增加到 50 个。DataTable 改为卡片容器并支持表头插槽，页长显示「N 条/页」。SchemaForm 的枚举可按语言包前缀显示选项文案，新增 `qian.segmented` 分段控件。抽屉表单的操作按钮移到固定页脚，抽屉里的子步骤表单用 `inlineActions` 把按钮留在表单内、不占页脚。SchemaForm 新增带标题的字段组（无字段节点带 `labelKey`）与 `fieldExtra` 附加提示，自动填充语义补 name / email / tel / organization / one-time-code。AppShell 的侧栏改为品牌、工作区卡片、分组导航（支持图标与角标）和底部账号卡，顶栏放侧栏开关、面包屑与工具；主题和语言改为图标单选菜单。原有公开属性与受控协议保持兼容。
- 466fad7: 按租户开通流程的原型补齐令牌与基础组件。
  
  tokens：画布改为冷灰（新增 slate 色阶与 650 档）；新增控件、次要、说明三档文字色，强边框，主色浅底 / 柔底 / 柔底文字 / 浅边框 / 强边框，状态色的边框 / 实色 / 深色文字三档，紫与青两种点缀色，品牌深色面三件套；组件层新增 `--qian-input-height`，输入类控件高度按场景整体调档；`--radius-xl` 为 12px；危险色、状态文字与状态底色按原型调整；正文行高改为固定 22px（`text-sm` 的行高写成 1.375rem，13px 的子元素继承同一行高），去掉 body 上强制的灰阶抗锯齿。
  
  core：Button 新增 `soft`、`destructive-outline` 变体与 `xs`、`xl` 尺寸，描边按钮改为强边框加控件文字，实心按钮的底色铺满透明边框（与同尺寸描边按钮外形一致，40px 按钮看上去就是 40px）；Badge 改为底色加边框加实色圆点，Tag 支持 `dot`；Alert 改用深一档文字并新增 `size="sm"`（表单内，文字取状态文字色），图标跟随文字色，md 带标题时上下 14px、标题与正文间距 2px；Result 去掉图标下方多出的间距与标题字距收紧，说明文字最宽 520px、用说明色；Avatar 新增 `tint`、`shape` 与按种子稳定取色的 `avatarTint`；Steps 新增 `tone="inverse"` 与 `size="lg"`；Tabs 的 line 变体新增 `countVariant="pill"`；Descriptions 新增 `grid`、`justified` 布局与 `span: 'full'`，并独立成模块（外壳子集只引 Descriptions 时不再带上 ScrollArea 与拖拽分栏）；MenuItem 新增 `variant="destructive"`；MenuSubTrigger 末尾加子菜单箭头；Input 的 `type="search"` 去掉浏览器自带的清除按钮；新增 globe、key、lock、message、network、shield、sliders、layoutGrid 图标，图标默认线宽 1.75；外壳子集 `./shell` 补上 Avatar、Breadcrumb、Descriptions 与 MenuSub / MenuSubTrigger。修复 Dialog / AlertDialog / Drawer / Popover / Sheet 的 Close 经 `render` 交给描边 Button 时边框被基础类盖成透明：Close 传了 `render` 时不再叠加基础按钮类，样式完全由 render 的元素决定（交给 Button 时用它自己的变体；交给其他元素时须自带样式）。
  
  data：DataTable 新增列 `align`、`toolbarEnd`、`columnToggle` 与 `density`，表头与分页栏按原型调整；表格内部滚动区改为 group，不再与外层出现两个同名 region 地标。TreeSelect 浮层给出固定宽度，树行不再换行（虚拟化行高固定，换行会盖住相邻行）。
  
  form：SchemaForm 新增 `size`、`layout`、`columnWidth`、`groupVariant="card"` 与 `fieldAdornment`（输入框内的后缀、输入框右侧的单位文字与附加按钮，后缀与单位关联到输入框）；`useConfirm` 新增 `tone: 'danger'` 与 `confirmLabel`；`useDrawer` 的 `description` 可传带格式的内容。
  
  shell：新增认证页布局 AuthLayout（品牌深色面加内容区，sign-in 与 form 两档）、PlainLayout、BrandMark、WorkspaceCard 与账号菜单里的语言子菜单 LocaleMenu；AppShell 的侧栏开关移到品牌行；PreferenceControls 新增 `locale` 与 `localeStyle`；PasswordLogin 改为 44px 控件，支持记住账号、忘记密码、其他登录方式与表单下方内容，不再依赖 SchemaForm；TenantSelection 改为工作空间卡片并支持 `applyHref`、`hideBack`，卡片按钮的可访问名称就是企业名，租户号与角色作为说明读出；Authentication 新增 `frame`、`loginProps` 与 `selectionProps`，不传 `frame` 时内容按原型列宽居中（登录 400px、选择工作空间 600px），不再铺满宿主容器；`matchMenuItem` 的根路径「/」只精确命中，不再作为所有路径的前缀。
  
  除 Close 传 `render` 时的样式来源（见上）与 Authentication 不传 `frame` 时的列宽外，原有公开属性保持兼容。
- a5aa0be: 统一基础组件的语义配方、焦点与弹层过渡；触发器由 Button 显式组合。数据表格使用独立查询区、列显隐浮层和分页，表单在同一页脚放置取消与确认。保留既有公开属性、标识与受控协议；弹层内容新增兼容的 closeLabel / showCloseButton，用宿主标签提供右上角关闭图标。
- 390542c: 支持真实 OpenAPI 的可空对象与数值联合类型；抽屉异步更新内容时保留原触发点，关闭后正确恢复焦点。
- Updated dependencies [286adf6]
- Updated dependencies [7310263]
- Updated dependencies [6871f2a]
- Updated dependencies [4fee304]
- Updated dependencies [31add9a]
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
  - @cavailab/qian-core@0.2.0
  - @cavailab/qian-contracts@0.2.0
  - @cavailab/qian-sdk@0.2.0
