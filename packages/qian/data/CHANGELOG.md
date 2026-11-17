# @cavailab/qian-data

## 0.2.1

### Patch Changes

- be41903: 修复 0.2.0 一渲染组件就报错。0.2.0 的数据组件包与业务选择器包构建时用了经典 JSX 转换：发布的 `dist/index.js` 调用 `React.createElement`，模块里却没有导入 `React`，渲染这两个包的任何组件（如 `DataTable`、`Tree`、`OrganizeSelect`、`UserSelect`）都会报 `ReferenceError: React is not defined`。现在改用 automatic JSX runtime，从 `react/jsx-runtime` 导入，不再依赖全局的 `React`。组件的接口与行为没有变化。
  
  用到这两个包的项目请从 0.2.0 升到 0.2.1；8 个层包是同一个版本号，一起升。
- eb493d3: 包内说明的安装一段改为：项目的 `.npmrc` 只写作用域那一行，认证行放进用户级配置（`~/.npmrc`，或 `NPM_CONFIG_USERCONFIG` 指向的文件）。pnpm 10.34.2 起的 10、11.5.3 起的 11 与 12 不展开项目 `.npmrc` 认证行里的环境变量，照 0.2.0 说明里的写法用 pnpm 装包会得到 401。
- Updated dependencies [eb493d3]
  - @cavailab/qian-contracts@0.2.1
  - @cavailab/qian-sdk@0.2.1
  - @cavailab/qian-core@0.2.1

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

- 286adf6: biz 交付基础版业务选择器：ApiSelect / useRemoteOptions、DictSelect、OrganizeSelect、UserSelect、RoleSelect、菜单与按钮授权树、IconPicker，全部经注入的 PlatformClient 取数、文案走 i18n key，取数契约由 OpenAPI 生成。data 的 Tree 增加 cascade 开关（关闭后节点独立勾选），TreeSelect / Cascader 触发器的可访问名称改为「标签 + 当前值」以满足 WCAG 2.5.3；core 导出已登记图标名 ICON_NAMES。
- 7dd9917: 管理台样式刷新：新增画布令牌 `--qian-canvas`，浅色侧栏改为白底。core 新增 Steps 步骤条、MenuRadioGroup / MenuRadioItem 单选菜单与 `isIconName`。Badge 支持状态圆点，Alert 支持标题与语气图标，Result 改为大图标居中版式，Button 新增 link 变体，Tabs 新增 line 变体与计数，Sheet 新增页头、主体、页脚与宽度档，Descriptions 新增上下排布，Pagination 改为描边按钮，图标从 14 个增加到 50 个。DataTable 改为卡片容器并支持表头插槽，页长显示「N 条/页」。SchemaForm 的枚举可按语言包前缀显示选项文案，新增 `qian.segmented` 分段控件。抽屉表单的操作按钮移到固定页脚，抽屉里的子步骤表单用 `inlineActions` 把按钮留在表单内、不占页脚。SchemaForm 新增带标题的字段组（无字段节点带 `labelKey`）与 `fieldExtra` 附加提示，自动填充语义补 name / email / tel / organization / one-time-code。AppShell 的侧栏改为品牌、工作区卡片、分组导航（支持图标与角标）和底部账号卡，顶栏放侧栏开关、面包屑与工具；主题和语言改为图标单选菜单。原有公开属性与受控协议保持兼容。
- 466fad7: 按租户开通流程的原型补齐令牌与基础组件。
  
  tokens：画布改为冷灰（新增 slate 色阶与 650 档）；新增控件、次要、说明三档文字色，强边框，主色浅底 / 柔底 / 柔底文字 / 浅边框 / 强边框，状态色的边框 / 实色 / 深色文字三档，紫与青两种点缀色，品牌深色面三件套；组件层新增 `--qian-input-height`，输入类控件高度按场景整体调档；`--radius-xl` 为 12px；危险色、状态文字与状态底色按原型调整；正文行高改为固定 22px（`text-sm` 的行高写成 1.375rem，13px 的子元素继承同一行高），去掉 body 上强制的灰阶抗锯齿。
  
  core：Button 新增 `soft`、`destructive-outline` 变体与 `xs`、`xl` 尺寸，描边按钮改为强边框加控件文字，实心按钮的底色铺满透明边框（与同尺寸描边按钮外形一致，40px 按钮看上去就是 40px）；Badge 改为底色加边框加实色圆点，Tag 支持 `dot`；Alert 改用深一档文字并新增 `size="sm"`（表单内，文字取状态文字色），图标跟随文字色，md 带标题时上下 14px、标题与正文间距 2px；Result 去掉图标下方多出的间距与标题字距收紧，说明文字最宽 520px、用说明色；Avatar 新增 `tint`、`shape` 与按种子稳定取色的 `avatarTint`；Steps 新增 `tone="inverse"` 与 `size="lg"`；Tabs 的 line 变体新增 `countVariant="pill"`；Descriptions 新增 `grid`、`justified` 布局与 `span: 'full'`，并独立成模块（外壳子集只引 Descriptions 时不再带上 ScrollArea 与拖拽分栏）；MenuItem 新增 `variant="destructive"`；MenuSubTrigger 末尾加子菜单箭头；Input 的 `type="search"` 去掉浏览器自带的清除按钮；新增 globe、key、lock、message、network、shield、sliders、layoutGrid 图标，图标默认线宽 1.75；外壳子集 `./shell` 补上 Avatar、Breadcrumb、Descriptions 与 MenuSub / MenuSubTrigger。修复 Dialog / AlertDialog / Drawer / Popover / Sheet 的 Close 经 `render` 交给描边 Button 时边框被基础类盖成透明：Close 传了 `render` 时不再叠加基础按钮类，样式完全由 render 的元素决定（交给 Button 时用它自己的变体；交给其他元素时须自带样式）。
  
  data：DataTable 新增列 `align`、`toolbarEnd`、`columnToggle` 与 `density`，表头与分页栏按原型调整；表格内部滚动区改为 group，不再与外层出现两个同名 region 地标。TreeSelect 浮层给出固定宽度，树行不再换行（虚拟化行高固定，换行会盖住相邻行）。
  
  form：SchemaForm 新增 `size`、`layout`、`columnWidth`、`groupVariant="card"` 与 `fieldAdornment`（输入框内的后缀、输入框右侧的单位文字与附加按钮，后缀与单位关联到输入框）；`useConfirm` 新增 `tone: 'danger'` 与 `confirmLabel`；`useDrawer` 的 `description` 可传带格式的内容。
  
  shell：新增认证页布局 AuthLayout（品牌深色面加内容区，sign-in 与 form 两档）、PlainLayout、BrandMark、WorkspaceCard 与账号菜单里的语言子菜单 LocaleMenu；AppShell 的侧栏开关移到品牌行；PreferenceControls 新增 `locale` 与 `localeStyle`；PasswordLogin 改为 44px 控件，支持记住账号、忘记密码、其他登录方式与表单下方内容，不再依赖 SchemaForm；TenantSelection 改为工作空间卡片并支持 `applyHref`、`hideBack`，卡片按钮的可访问名称就是企业名，租户号与角色作为说明读出；Authentication 新增 `frame`、`loginProps` 与 `selectionProps`，不传 `frame` 时内容按原型列宽居中（登录 400px、选择工作空间 600px），不再铺满宿主容器；`matchMenuItem` 的根路径「/」只精确命中，不再作为所有路径的前缀。
  
  除 Close 传 `render` 时的样式来源（见上）与 Authentication 不传 `frame` 时的列宽外，原有公开属性保持兼容。
- a5aa0be: 统一基础组件的语义配方、焦点与弹层过渡；触发器由 Button 显式组合。数据表格使用独立查询区、列显隐浮层和分页，表单在同一页脚放置取消与确认。保留既有公开属性、标识与受控协议；弹层内容新增兼容的 closeLabel / showCloseButton，用宿主标签提供右上角关闭图标。
- 90ac29a: 按文字、控件边界与装饰线分类验证对比度，校正透明色的 sRGB 合成；统一 neutral 语义色、品牌主色、系统字体和 Tailwind v4 主题映射，接通组件尺寸与圆角令牌。输入边界保持 3:1，文字配对保持 4.5:1。
- 8dccae5: 交付 TanStack Table 9 服务端表格、虚拟化树与选择器、日期时间范围、分片上传和图片预览；列元数据与上传接口的类型分别由 Schema 与 OpenAPI 生成。
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
