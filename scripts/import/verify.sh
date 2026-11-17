#!/usr/bin/env bash
# 导入的一致性证明（S1-YUE-023）：本仓库某个提交里，paths.txt 列出的路径下每个文件的模式与 blob
# 是否与源提交逐个一致。说明见同目录 README.md。
#
#   scripts/import/verify.sh --commit <源提交> [--source <源仓库>] [--target <本仓库的提交>] [--since <旧源提交>]
#
# --source 默认 https://github.com/idadawn/qian.git（会临时克隆一份），也可以是一份本机克隆（只读）。
# --target 默认 HEAD。导入的合并提交上（裁剪之前）应当全部一致；之后的裁剪提交有意改过一部分文件。
# --since 用于增量补齐：只核对源仓库在 <旧源提交>..<源提交> 之间改过的路径。
# 目标是合并提交时，另外报告导入的提交数（第二个父提交可达、第一个父提交不可达的提交）。
# 全部一致时退出码为 0，否则为 1。
set -euo pipefail

here=$(cd "$(dirname "$0")" && pwd)
source_repo="https://github.com/idadawn/qian.git"
commit=""
target="HEAD"
since=""

usage() {
  sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'
}

while [ $# -gt 0 ]; do
  case "$1" in
    --source) source_repo=$2; shift 2 ;;
    --commit) commit=$2; shift 2 ;;
    --target) target=$2; shift 2 ;;
    --since) since=$2; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "未知参数：$1" >&2; usage >&2; exit 2 ;;
  esac
done
[ -n "$commit" ] || { echo "必须用 --commit 指定源提交" >&2; exit 2; }

# 本仓库按 git 的常规办法定位（尊重调用方设的 GIT_DIR），之后清掉这些变量，免得它们串到源仓库的命令上。
repo=$(git -C "$here" rev-parse --absolute-git-dir)
unset GIT_DIR GIT_WORK_TREE

work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

if [ -d "$source_repo" ] && git -C "$source_repo" rev-parse --git-dir >/dev/null 2>&1; then
  src=$(git -C "$source_repo" rev-parse --absolute-git-dir)
else
  echo "克隆源仓库：$source_repo" >&2
  git clone --quiet --bare --no-tags "$source_repo" "$work/source"
  src="$work/source"
fi
full=$(git --git-dir="$src" rev-parse --verify "$commit^{commit}")
target_full=$(git --git-dir="$repo" rev-parse --verify "$target^{commit}")

# 清单转成路径参数：目录去掉末尾的斜杠，ls-tree 按前缀列出其下全部文件。
paths=()
while IFS= read -r line; do
  case "$line" in ''|'#'*) continue ;; esac
  paths+=("${line%/}")
done < "$here/paths.txt"

if [ -n "$since" ]; then
  since_full=$(git --git-dir="$src" rev-parse --verify "$since^{commit}")
  git --git-dir="$src" diff --name-only --no-renames "$since_full" "$full" -- "${paths[@]}" > "$work/changed"
  echo "增量核对：只看源仓库 ${since_full:0:10}..${full:0:10} 之间改过的 $(wc -l < "$work/changed" | tr -d ' ') 个路径" >&2
fi

list() { # $1 仓库的 git 目录 $2 提交 → 「模式 blob<TAB>路径」，按路径排序
  git --git-dir="$1" ls-tree -r --full-tree "$2" -- "${paths[@]}" | awk -F'\t' '{split($1, a, " "); print a[1] " " a[3] "\t" $2}' | LC_ALL=C sort -t "$(printf '\t')" -k2
}
list "$src" "$full" > "$work/source.txt"
list "$repo" "$target_full" > "$work/target.txt"

python3 - "$work" "$since" <<'PY'
import sys
work, since = sys.argv[1], sys.argv[2]
def load(name):
    entries = {}
    with open(f"{work}/{name}", encoding="utf-8") as f:
        for line in f:
            meta, path = line.rstrip("\n").split("\t", 1)
            entries[path] = meta
    return entries
source, target = load("source.txt"), load("target.txt")
if since:
    with open(f"{work}/changed", encoding="utf-8") as f:
        changed = {line.rstrip("\n") for line in f if line.strip()}
    source = {p: m for p, m in source.items() if p in changed}
    target = {p: m for p, m in target.items() if p in changed}
missing = sorted(set(source) - set(target))
extra = sorted(set(target) - set(source))
differ = sorted(p for p in set(source) & set(target) if source[p] != target[p])
same = len(set(source) & set(target)) - len(differ)
print(f"源提交的文件数：{len(source)}")
print(f"一致：{same}")
print(f"不一致：{len(differ)}")
print(f"目标里缺少：{len(missing)}")
print(f"目标里多出：{len(extra)}")
for label, items in (("不一致", differ), ("缺少", missing), ("多出", extra)):
    for p in items:
        print(f"  {label}  {p}  源 {source.get(p, '-')}  目标 {target.get(p, '-')}")
with open(f"{work}/result", "w") as f:
    f.write("ok" if not (missing or extra or differ) else "fail")
PY

echo "源提交：$full"
echo "目标提交：$target_full"
parents=$(git --git-dir="$repo" rev-list --parents -n 1 "$target_full" | wc -w | tr -d ' ')
if [ "$parents" -eq 3 ]; then
  echo "导入的提交数：$(git --git-dir="$repo" rev-list --count "$target_full^1..$target_full^2")"
fi
[ "$(cat "$work/result")" = ok ]
