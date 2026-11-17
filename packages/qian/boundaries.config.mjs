// qian 六层分层的依赖矩阵与 ESLint 边界规则（docs/prd/specs/yue.md §3.1；ADR-013 D13.2）。
// 唯一真相源：改分层先改这里，再改规格表；tests/gates/qian 的自测与 package.json 的依赖校验都读这个文件。
import boundaries from 'eslint-plugin-boundaries';
import tseslint from 'typescript-eslint';

/** 最底层横切包：任何包都可以依赖（它们自己不依赖任何 @cavailab/qian-* 包）。 */
export const BOTTOM_LAYERS = ['tokens', 'contracts'];

/** 每个包允许直接依赖的 @cavailab/qian-* 包（不含 BOTTOM_LAYERS，会自动补上）。键即 packages/qian/<目录> 与 @cavailab/qian-<目录>。 */
const DIRECT = {
  tokens: [],
  contracts: [],
  core: [],
  sdk: [],
  shell: ['core', 'sdk', 'form'], // shell → form 的登录表单依赖是同层唯一例外（规格 §3.1，经 ADR 记录）
  data: ['core', 'sdk'],
  form: ['core', 'sdk'],
  charts: ['core'],
  'code-editor': ['core'],
  biz: ['core', 'data', 'form', 'sdk'],
  widgets: ['core', 'data', 'form', 'biz', 'sdk'],
  runtime: ['widgets', 'biz', 'shell', 'data', 'form', 'charts', 'code-editor', 'core', 'sdk'],
  designer: ['runtime', 'widgets', 'biz', 'shell', 'data', 'form', 'charts', 'code-editor', 'core', 'sdk'],
  'designer-form': ['designer', 'runtime', 'widgets', 'biz', 'shell', 'data', 'form', 'charts', 'code-editor', 'core', 'sdk'],
  'designer-list': ['designer', 'runtime', 'widgets', 'biz', 'shell', 'data', 'form', 'charts', 'code-editor', 'core', 'sdk'],
  'designer-flow': ['designer', 'runtime', 'widgets', 'biz', 'shell', 'data', 'form', 'charts', 'code-editor', 'core', 'sdk'],
  'designer-portal': ['designer', 'runtime', 'widgets', 'biz', 'shell', 'data', 'form', 'charts', 'code-editor', 'core', 'sdk'],
  mobile: ['runtime', 'widgets', 'biz', 'shell', 'data', 'form', 'charts', 'code-editor', 'core', 'sdk'],
  agent: ['core', 'sdk'],
};

/** 全部已知的 @cavailab/qian-* 包名（目录名）。 */
export const QIAN_PACKAGES = Object.keys(DIRECT);

/** 层包的包名前缀。 */
export const LAYER_SCOPE = '@cavailab/qian-';

/** 也以 LAYER_SCOPE 开头、但不是层包的两个包。更名之前它们的名字不在层包的前缀之内，按前缀判断层包时要把它们除开。 */
export const NON_LAYER_PACKAGES = ['@cavailab/qian-runtime', '@cavailab/qian-plugin-sdk'];

/** 按包名判断是不是层包（已建、规划中、没登记的都算）：前缀之内、除开上面两个，与更名之前按旧前缀判断的集合相同。 */
export function isLayerPackageName(name) {
  return name.startsWith(LAYER_SCOPE) && !NON_LAYER_PACKAGES.includes(name);
}

/** 某包允许依赖的 @cavailab/qian-* 包目录名（含最底层横切包，不含自己）。未知包名 → 空数组（什么都不许依赖，先来这里登记）。 */
export function allowedDependencies(pkg) {
  const direct = DIRECT[pkg];
  if (!direct) return [];
  if (BOTTOM_LAYERS.includes(pkg)) return []; // tokens / contracts 不依赖任何 @cavailab/qian-* 包，彼此也不
  return [...new Set([...direct, ...BOTTOM_LAYERS])].filter((d) => d !== pkg).sort();
}

const policies = [
  // 同一个包内部的相对引用随便引。
  { from: { element: { type: 'qian' } }, allow: { to: { element: { type: 'qian', captured: { pkg: '{{ from.captured.pkg }}' } } } } },
  // 每个包按矩阵引其它 @cavailab/qian-* 包：解析到工作区源码的按元素匹配，没解析到的（包还没建）按 import 说明符匹配。
  ...QIAN_PACKAGES.map((pkg) => {
    const allowed = allowedDependencies(pkg);
    return {
      from: { element: { type: 'qian', captured: { pkg } } },
      allow: {
        to: [
          ...(allowed.length ? [{ element: { type: 'qian', captured: { pkg: allowed } } }] : []),
          { module: { source: allowed.map((d) => `@cavailab/qian-${d}`) } },
        ],
      },
    };
  }),
  // 第三方库与 Node 内置模块对所有 qian 包放行（@cavailab/qian-* 不在此列，只走矩阵）。
  // Qian 专有的外壳接线（@qian/shell-kit，留在后端仓库）同样在 qian 之上：qian 包不得反向引用。
  { from: { element: { type: 'qian' } }, allow: { to: { module: { source: '!{@cavailab/qian-**,@cavailab/qian-plugin-sdk{,/**},@qian/plugin-sdk{,/**},@cavailab/qian-runtime{,/**},@qian/runtime{,/**},@qian/shell-kit{,/**}}' } } } },
  // Qian 的前端 SDK 在 qian 之上，只消费 sdk/底层契约与 TS Runtime，不能反向进入 UI 控件或应用。
  { from: { element: { type: 'qian-ui-sdk' } }, allow: { to: [{ element: { type: 'qian-ui-sdk' } }, { element: { type: 'qian-runtime' } },
    { element: { type: 'qian', captured: { pkg: ['sdk', 'tokens', 'contracts'] } } },
    { module: { source: ['@cavailab/qian-sdk{,/**}', '@cavailab/qian-tokens{,/**}', '@cavailab/qian-contracts{,/**}', '@cavailab/qian-runtime{,/**}', '@qian/runtime'] } },
    { module: { source: '!{@cavailab/qian-**,@cavailab/qian-plugin-sdk{,/**},@qian/plugin-sdk{,/**},@qian/shell-kit{,/**}}' } }] } },
  // 应用面（apps/*）可以引任何 qian 包、彼此与第三方库。
  // 更名之后运行时与插件开发包和组件层同一前缀，@cavailab/qian-** 也盖住了它们；改名前它们不在 @idadawn/yue-** 之内，
  // 按说明符引用本来就放行，所以这里显式放行，范围与改名前一致。上面插件开发包那条的 @cavailab/qian-runtime{,/**} 同理。
  { from: { element: { type: 'app' } }, allow: { to: [{ element: { type: 'qian' } }, { element: { type: 'app' } }, { element: { type: 'qian-ui-sdk' } }, { element: { type: 'qian-runtime' } }, { module: { source: ['!@cavailab/qian-**'] } },
    { module: { source: ['@cavailab/qian-plugin-sdk{,/**}', '@cavailab/qian-runtime{,/**}'] } }] } },
];

/** 只含边界规则的 ESLint 配置片段（根 eslint.config.mjs 与 eslint.boundaries.config.mjs 共用）。 */
export const qianBoundariesConfig = [
  {
    files: ['packages/qian/**/*.{ts,tsx,mts,mjs}', 'apps/**/*.{ts,tsx,mts,mjs}', 'packages/qian-plugin-sdk/**/*.{ts,tsx,mts,mjs}'],
    languageOptions: { parser: tseslint.parser, ecmaVersion: 'latest', sourceType: 'module' },
    plugins: { boundaries },
    settings: {
      'boundaries/elements': [
        { type: 'qian', pattern: 'packages/qian/*', capture: ['pkg'] },
        { type: 'app', pattern: 'apps/*', capture: ['app'] },
        { type: 'qian-ui-sdk', pattern: 'packages/qian-plugin-sdk' },
        { type: 'qian-runtime', pattern: 'packages/qian-runtime' },
      ],
      'boundaries/dependency-nodes': ['import', 'dynamic-import', 'export'],
      'boundaries/ignore': ['**/node_modules/**', '**/dist/**'],
      'import/resolver': {
        typescript: { project: ['packages/qian/*/tsconfig.json', 'apps/*/tsconfig.json', 'packages/qian-plugin-sdk/tsconfig.json'] },
      },
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          checkAllOrigins: true,
          checkUnknownLocals: true,
          message: 'qian 分层违规：不得依赖 {{ dependency.source }}（矩阵在 packages/qian/boundaries.config.mjs，规格 docs/prd/specs/yue.md §3.1）',
          policies,
        },
      ],
      'boundaries/no-unknown-files': 'off',
    },
  },
];
