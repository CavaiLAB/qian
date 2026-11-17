# 导入脚本

F1「保留历史导入」（任务 S1-YUE-023）用的脚本：把框架库连同提交历史，从后端仓库 `idadawn/qian` 导入本仓库，名字一个不改。计划见 [迁移与更名](../../docs/migration.md) 第 3 节，这次导入的记录见同一文档第 9 节。

| 文件 | 作用 |
|---|---|
| `paths.txt` | 导入的路径清单，`import.sh` 与 `verify.sh` 共用 |
| `import.sh` | 输入源提交，输出过滤后的历史：一个新的裸仓库，分支 `import` 指向末端 |
| `rewrite-message.py` | 提交说明里 PR 引用的改写规则，作为 `git filter-repo` 的回调传入 |
| `list-refs.py` | 改写之前列出全部 `#数字` 命中，标出每一处会不会被改写 |
| `verify.sh` | 一致性证明：本仓库某个提交里导入路径下的每个文件，模式与 blob 是否与源提交一致 |

要用到 `git`、[`git-filter-repo`](https://github.com/newren/git-filter-repo)、`python3` 与 `bash`。`git-filter-repo` 不在 `PATH` 上时，用环境变量 `GIT_FILTER_REPO` 指定。F1 用的是 `git-filter-repo` 2.47.0；过滤的结果取决于它的剪枝与改写规则，增量补齐时用同一个版本，换版本之前先按下文核对末端哈希。`--source` 不写时从 `https://github.com/idadawn/qian.git` 克隆；指向一份本机克隆可以省下下载，结果一样，因为过滤只认源提交的哈希。

## 做了什么

1. 新克隆一份源仓库（裸仓库），只留一个分支指向源提交，其余引用全删。
2. `git filter-repo --paths-from-file paths.txt`：只留清单里的路径，不碰这些路径的提交被剪掉。
3. 同一遍里用 `rewrite-message.py` 改写提交说明：指向源仓库 PR 的 `#N` 改成 `idadawn/qian#N`，否则在本仓库会被链到不相干的 PR。已经写成 `idadawn/qian#N` 的不再加前缀；任务号（如 `[S1-YUE-012]`）、复核号（如 `R169`）不带 `#`，不受影响。
4. 提交说明里出现的源仓库提交哈希，`git filter-repo` 照它的默认做法换成过滤后的哈希；被剪掉的提交没有对应，哈希原样留着，指的是 `idadawn/qian` 里的提交。输出目录的 `filter-repo/suboptimal-issues` 列出提交说明里所有像哈希、又没能换成新哈希的串：多数指被剪掉的提交，也有恰好全由数字组成的串（如 CI 的运行号），都原样留着。

F1 的核对办法：用输出目录里的 `filter-repo/commit-map` 把每个过滤后的提交对回源提交，把源提交说明按 `rewrite-message.py` 的规则改写一遍，再与过滤后的说明逐字比较。154 个提交里 108 个说明没变，45 个只有 PR 引用的改写（合计 50 处），1 个另有一处哈希被换成过滤后的哈希（它指的提交保留了下来），没有其它差异。改写之前的命中清单（51 处，其中 1 处原本就写成 `idadawn/qian#79`）由 `--list-refs` 列出，逐条看过，都是 PR 号。

`git filter-repo` 只在脚本自己克隆出来的输出目录里跑，不碰 `--source` 指向的仓库。

## 首次导入（F1）

源提交写全长哈希。输出目录要不存在，脚本会新建。

```bash
scripts/import/import.sh --commit aafa0cc5ab48637a1c634867d6cddb2935837814 --out <空目录> --list-refs
```

先用 `--list-refs` 把全部命中列出来逐条看，确认规则不会误伤不是 PR 号的 `#数字`，再去掉这个参数正式跑一遍：

```bash
scripts/import/import.sh --commit aafa0cc5ab48637a1c634867d6cddb2935837814 --out <空目录>
```

把输出合入本仓库的分支，然后在合并提交上做一致性证明：

```bash
git fetch <输出目录> import
```

```bash
git merge --allow-unrelated-histories --no-ff FETCH_HEAD
```

```bash
scripts/import/verify.sh --commit aafa0cc5ab48637a1c634867d6cddb2935837814 --target HEAD
```

`verify.sh` 报告源提交的文件数、一致与不一致的个数、目标里缺少与多出的文件；目标是合并提交时还报告导入的提交数。全部一致时退出码为 0。它要在合并提交上跑，裁剪工程配置的提交有意改过一部分文件。

导入的 PR 只能用合并提交合入：压缩合并或变基合并会丢掉导入的历史。

## 增量补齐

只在更名（F2）合入之前适用。迁移计划第 6 节规定，从源提交起这些路径在原仓库冻结；确有改动要进，就在原仓库合入之后，按下面的办法补到本仓库。F2 合入之后一律在本仓库改，不再从原仓库导入。

能增量补齐，靠的是过滤可重现：同样的源历史、同一份 `paths.txt` 与 `rewrite-message.py`、同一版本的 `git-filter-repo`，重跑得到的提交逐个相同（F1 用两份不同来源的克隆各跑一遍核对过：一份是脚本从 GitHub 新克隆的，一份是指向本机克隆的 `--source`，末端哈希相同，见 [迁移与更名](../../docs/migration.md) 第 9 节）。所以新的源提交过滤出来的历史，前面一段就是已经合入的那段，合并时只会带进新的提交。

1. 用新的源提交重跑 `import.sh`，得到新的末端。
2. 核对上次导入的末端是新末端的祖先（上次的末端就是导入合并提交的第二个父提交，第 9 节也记着）。不是祖先，说明清单或改写规则变过，不能按这个办法补，停下来另想办法。

   ```bash
   git -C <输出目录> merge-base --is-ancestor <上次导入的末端> import
   ```

3. 在本仓库开一个分支，`git fetch <输出目录> import`，再 `git merge --no-ff FETCH_HEAD`。这一次两边已有共同祖先，不用 `--allow-unrelated-histories`。裁剪提交改过的文件（根 `package.json`、`pnpm-lock.yaml`、工作流等）可能冲突：保留裁剪的结果，把新改动补进去；锁文件冲突就重新生成，再按第 9 节的办法比对版本。
4. 只核对源仓库这一段改过的路径：

   ```bash
   scripts/import/verify.sh --commit <新的源提交> --since <上次的源提交> --target HEAD
   ```

   裁剪改过、这一段又动到的文件会报不一致，逐个说明是哪处裁剪造成的。
5. 在 [迁移与更名](../../docs/migration.md) 第 9 节补一行记录，PR 同样只能用合并提交合入。
