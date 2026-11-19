# 后端契约的副本

这个目录里的文件是**副本**，唯一来源在后端仓库，**不在这里改**。要改去后端仓库改，合入之后按下文更新副本与清单。为什么只放副本、两个仓库之间还有哪些接口，见 [迁移文档](../docs/migration.md) 第 2.3 节与第 4 节。

## 清单

[`manifest.json`](manifest.json) 记着副本从哪里来：

| 字段 | 含义 |
|---|---|
| `source.repository` | 来源仓库，写成「所有者/仓库」。现在是后端仓库 `CavaiLAB/kun` |
| `source.pathPrefix` | 契约所在目录相对来源仓库根的前缀。空串表示仓库根，子目录的前缀以 `/` 结尾 |
| `source.commit` | 来源提交，全长哈希 |
| `files` | 每个副本的路径（相对本目录，也就是在来源仓库里去掉前缀之后的路径）与 SHA-256；领先于来源的副本另有 `lead`，见下文 |

| 副本 | 谁在用 | 用途 |
|---|---|---|
| `contracts/v0/error-detail.schema.json` | `packages/qian/contracts/scripts/generate.mjs`、`packages/qian-runtime/test/errors.test.mjs` | 结构化错误的 Schema；界面契约包随包发布它的一份拷贝并由它生成类型 |
| `contracts/v0/error-codes.json` | `packages/qian-runtime/scripts/prepare.mjs`、`packages/qian-plugin-sdk/scripts/errors.mjs` | 内置错误码目录，两个包的 `src/error-catalog.ts` 由它派生 |
| `contracts/v0/fixtures/capability-entry.valid.json` | `packages/qian-plugin-sdk/test/host.test.ts` | 能力条目的测试夹具 |
| `schemas/v2/ui.schema.json` | `packages/qian-plugin-sdk/scripts/ui-schema.mjs`、`packages/qian-plugin-sdk/test/ui-schema.test.ts` | 界面清单的 Schema，派生类型副本与预编译的校验器 |
| `tck/surfaces/cases.json` | `packages/qian-plugin-sdk/test/ui-schema.test.ts` | 界面清单的一致性用例 |

## 检查

本机只核对摘要（门禁 unit 那一项也跑它）：副本与清单记的 SHA-256 一致，目录里没有清单之外的文件；领先的副本按登记的替换换回去，摘要要等于登记的来源摘要。

```bash
node scripts/backend-copy.mjs
```

与后端逐个文件比对，由 CI 的 `backend-copy` 工作流做：按清单里的仓库与提交检出后端（只取这几个文件），再跑下面这条。本机要比对，先把一份后端检出切到清单记的提交上：

```bash
node scripts/backend-copy.mjs --source <后端仓库的检出>
```

`--source` 给检出的根目录，清单里的路径前缀由脚本补上。检出没停在清单记的提交上、或者任何一个文件与来源不同，都算失败。领先的副本不要求与来源相同，要求的是：来源的摘要等于登记的来源摘要，来源按登记的替换换过之后与副本逐字节相同。

## 领先于来源的副本

一般情况下副本与来源逐字节相同。例外是「领先于来源」：本仓库的改动要求某份契约先变，来源要晚一步才改。领先的文件在清单里多一个 `lead`：

| 字段 | 含义 |
|---|---|
| `sha256` | 副本的摘要，与不领先的文件一样 |
| `lead.sourceSha256` | 来源文件在来源提交的摘要 |
| `lead.reason` | 为什么领先 |
| `lead.resolvedBy` | 由哪个任务消除领先 |
| `lead.replace` | 从来源得到副本的确定办法：按顺序逐条把 `from` 换成 `to`，每条在来源里恰好命中 `count` 次 |

两头都对得上才算通过：本机不带参数时，把副本按 `replace` 反向换回去，摘要要等于 `lead.sourceSha256`；CI 的比对（`--source`）要求来源的摘要等于 `lead.sourceSha256`，即后端那份没有意外变化，而且来源按 `replace` 正向替换之后与副本逐字节相同，即副本与来源的差异恰好是登记的那几处。

现在没有领先的副本，5 份副本都与来源逐字节相同。

`--update` 遇到领先的文件：新来源还是旧的写法，就在新来源上重做一遍登记的替换，更新 `lead.sourceSha256`；新来源已经是副本的样子，去掉 `lead`，副本恢复与来源逐字节相同；两样都不是，说明来源在领先改动的位置变了，停下来人工处理。

由界面清单 Schema 派生的两个文件（`packages/qian-plugin-sdk/src/ui-schema.generated.ts`、`ui-validators.generated.ts`）按副本生成，见下一节第 3 步。

## 后端改了契约之后

1. 改动先在后端仓库合入。
2. 在本仓库开分支，把一份后端检出切到合入后的提交上，从它更新副本：复制文件，按检出的提交与文件内容重写清单。

   ```bash
   node scripts/backend-copy.mjs --update <后端仓库的检出>
   ```

3. 重新生成派生物，再跑门禁：

   ```bash
   pnpm --filter @cavailab/qian-contracts contracts:generate
   ```

   ```bash
   node packages/qian-plugin-sdk/scripts/errors.mjs
   ```

   ```bash
   node packages/qian-plugin-sdk/scripts/ui-schema.mjs
   ```

   运行时的 `src/error-catalog.ts` 在 `pnpm --filter @cavailab/qian-runtime build` 时重新生成；业务选择器与数据组件的接口类型用各自的 `contracts:generate`。

4. 提 PR，说明来源提交从哪里升到哪里、哪些副本变了。

后端换了仓库或目录结构，更新时一并写回清单：

```bash
node scripts/backend-copy.mjs --update <后端仓库的检出> --repository CavaiLAB/kun --path-prefix ''
```

上面的空串表示从后端仓库根目录取文件。更新其他布局时，先确认五个文件都位于同一来源前缀下，再将该前缀传给 `--path-prefix`。

## 同一个来源提交的另一个用处

TypeScript 运行时与 .NET 运行时共用的一致性用例（TCK）不复制到这里，留在后端仓库。`runtime-ts` 工作流里「运行时一致性用例」那一项按这份清单的仓库、前缀与提交检出后端，在清单指定的目录构建命令行，再用本仓库的运行时跑那套用例。所以升来源提交时，这一项也会跟着用新提交的用例。
