# 更名脚本

F2「更名」（任务 S1-YUE-022）用的脚本：把前端框架由 yue 更名为 qian。规则见 [迁移与更名](../../docs/migration.md) 第 5 节，这次更名的记录见同一文档的「更名记录」一节。

脚本只用 Node 自带的模块与 `git`，不依赖 `node_modules`，在干净的检出里也能跑。

## 三步与对应的提交

| 子命令 | 做什么 | 对应的提交 |
|---|---|---|
| `move` | 按 `MOVES` 表逐项 `git mv`：`packages/yue/` → `packages/qian/`、`apps/yue-playground` → `apps/qian-playground`、`tests/gates/yue` → `tests/gates/qian`、`scripts/yue-visual.mjs` → `scripts/qian-visual.mjs`、`yue.yml` → `qian.yml`，以及 6 个文件名带 yue 的变更登记。文件内容一个字节不改 | 纯改名提交 |
| `replace` | 按 `RULES` 表做机械替换，只改文件内容 | 机械替换提交 |
| `check` | 替换之后全仓再搜一遍 yue（不分大小写），把剩下的每一处归到「不改的」某一类，按类计数；有归不了类的就以非零退出 | — |

另有两个辅助子命令：`inventory` 在替换之前列出全部 yue，按规则归类计数（盘点）；`verify <提交>` 核对可重现性，见下文。

纯改名与机械替换之间还有一个修本脚本的提交：保护区可以嵌套（固定提交的地址里带着任务号），最初的版本只放回一层占位符，会在文件里留下私用区字符。修过的版本一层层放回，放完还有私用区字符就失败；映射表、保护区与跳过的文件都没变。机械替换由修过的版本完成；`verify` 用父提交里的脚本重跑，所以两步各自都能重现。

锁文件不归这个脚本管，见下文「锁文件」。

## 映射表怎么定的

`RULES` 显式、有序，逐条应用在整段文本上；每条都按词法边界匹配，前后紧挨着标识符字符的不算（锁文件完整性摘要这类碰巧含有这三个字母的串，本来就不在范围里）。前面几条把特定写法换掉，最后一条 `word` 兜底处理其余的小写 yue。

| 规则 | 旧 | 新 |
|---|---|---|
| `scope-yue`、`scope-yue-escaped` | `@idadawn/yue-<名>`（含子路径、`@idadawn/yue-*`、模板串，以及正则里转义过的写法） | `@cavailab/qian-<名>` |
| `scope`、`scope-escaped`、`scope-registry` | 其余 `@idadawn/`（运行时、插件开发包、测试里的假包名），`.npmrc` 里的 `@idadawn:registry` | `@cavailab/`、`@cavailab:registry` |
| `tarball` | `pnpm pack` 产出的 `idadawn-yue-*`、`idadawn-qian-*` | `cavailab-qian-*` |
| `design-shorthand`、`design-shorthand-family` | 设计文档里的简称 `@yue/<名>`、`@yue` | 全名 `@cavailab/qian-<名>`、`@cavailab/qian-*`。不用 `@qian/<名>`：`@qian/*` 是后端包的命名空间（如 `@qian/shell-kit`） |
| `bare-package` | 正文里的裸包简称 `yue-<名>` | 全名 `@cavailab/qian-<名>`。不写 `qian-shell`：那是后端应用外壳的包名 |
| `css-var`、`data-attr` | `--yue-*`、`data-yue-*` | `--qian-*`、`data-qian-*` |
| `pascal`、`camel`、`upper` | `YueProps`；`yueVersion`、`yueBoundariesConfig`；`YUE_PACKAGES`、`YUE_DIR`、`__YUE_VERSION__` 与页面上的大写字样 | `Qian…`、`qian…`、`QIAN…` |
| `word` | 其余的 `yue`：路径段、私有包名 `yue-playground`、测试标识与插件名等前缀 `yue-`、存储键、清单版本键 `engines.yue`、根脚本 `yue:*`、工作流名与正文 | `qian` |

保护区（`PROTECT`）先整段挪开，替换完再放回，里面的 yue 一个字不动：

| 保护区 | 内容 |
|---|---|
| `task-id` | 任务号 `S1-YUE-*` 与简写 `YUE-012` |
| `pinned-url` | 指向 `idadawn/qian` 固定提交的完整地址（F1 改写的链接），路径是源仓库在那个提交的路径 |
| `backend-path` | 正文里提到的后端仓库文件与文档站路由：`docs/prd/specs/yue.md`、`docs/adr/ADR-013-frontend-yue.md`、`/design/prd/specs/yue`、`/components/yue/` |
| `qian-dev-url` | `https://qian.dev/…` 运行期字面（组件清单 Schema 的 `$id`） |
| `backend-script` | 后端仓库的根脚本 `yue:docs`、`yue:auth` |

保护区按表里的顺序挪开，可以嵌套：任务号先换成占位符，固定提交的地址再把带着这个占位符的整段挪开。放回时一层层放，直到一个占位符也不剩；计数与 `check` 都把嵌套的片段算在最外层名下。

不进替换范围的文件（`SKIP`）：`scripts/import/`（描述源仓库的路径，整目录不改）、本目录、`backend-copy/` 里的副本与清单（`engines` 键的领先改动另做手工提交，见 [副本的说明](../../backend-copy/README.md)）、`pnpm-lock.yaml`、根目录的 `AGENTS.md` / `README.md` / `CLAUDE.md` 与 `docs/`（手工改写），以及由契约副本生成的两个文件 `packages/qian-plugin-sdk/src/ui-schema.generated.ts`、`ui-validators.generated.ts`（随副本重新生成）。

## 重跑与核对

在纯改名提交的父提交上跑 `move`，或者在机械替换提交的父提交上跑 `replace`，得到的树要与那个提交逐字节相同。`verify` 把这件事做完：在临时工作区里检出父提交，用父提交里的这个脚本重跑对应的子命令，再比较树的哈希。

```bash
node scripts/rename/rename.mjs verify <纯改名提交>
```

```bash
node scripts/rename/rename.mjs verify <机械替换提交>
```

手工做也一样：

```bash
git switch --detach <机械替换提交>^
node scripts/rename/rename.mjs replace
git add -A && git write-tree
git rev-parse <机械替换提交>^{tree}
```

最后两行的输出相同即可。

## 替换之后剩下的

```bash
node scripts/rename/rename.mjs check
```

`check` 按类列出剩下的 yue：上面的保护区、不进替换范围的文件、二进制文件（视觉基线 PNG 压缩数据里碰巧出现的字节）、锁文件里的完整性摘要，以及迁移文档里的新旧对照与更名记录。加环境变量 `RENAME_VERBOSE=1` 会列出每一类所在的文件；`inventory` 加它会列出每条规则命中的写法。

F2、F3 手工写进来、本来就要带旧名字的片段另列在 `CHECK_KEEP` 与 `KEEP_PATHS`，只用来归类，不参与 `replace`：

| 类 | 内容 |
|---|---|
| `guide-path` | 给使用方的迁移说明 `docs/migrating-from-yue.md` 的文件名 |
| `guide-link` | 指向这份迁移说明的链接 |
| `first-release-entry` | 各包变更记录（`CHANGELOG.md`）里首发 0.2.0 那一条：新旧名字的逐项对照，含其中指向迁移说明的链接 |
| `lead-registration` | 契约副本说明（`backend-copy/README.md`）「领先于来源」一节里，来源仍在用的旧键 |
| `release-assertion` | 打包与消费验证（`scripts/release/`）里断言制品不带旧名字的那两行 |

## 锁文件

锁文件只用 `pnpm install` 生成，不做文本替换。`lockfile.mjs` 做两件事：

```bash
node scripts/rename/lockfile.mjs regenerate
```

```bash
node scripts/rename/lockfile.mjs compare <更名之前的提交>
```

`regenerate` 跑两次 `pnpm install`：目录改名之后 pnpm 把演练场当成新的工作区项目重新解析，它的 `@lhci/cli` 那一支里有个可选的同伴依赖会取到锁文件里更高的版本，多出 22 个快照；先在演练场临时声明原来的版本装一次，再撤掉声明装一次，pnpm 沿用这份解析，`package.json` 回到原样。`compare` 把工作区里的锁文件与更名之前的逐项比对，包名与工作区路径按更名映射换算，输出导入项、直接依赖、包与快照的比对结果；除名字外有任何不同都会列出来。
