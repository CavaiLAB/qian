#!/usr/bin/env bash
# 从源仓库的一个提交导出框架库的过滤后历史（F1 保留历史导入，S1-YUE-023）。说明见同目录 README.md。
#
#   scripts/import/import.sh --commit <源提交> --out <输出目录> [--source <源仓库>] [--list-refs]
#
# 输入：源仓库（默认 https://github.com/idadawn/qian.git，也可以是一份本机克隆）与源提交。
# 输出：--out 处的一个新的裸仓库，分支 import 指向过滤后历史的末端。只含 paths.txt 列出的路径，
#       提交说明里指向源仓库 PR 的 #N 改写成 idadawn/qian#N（规则见 rewrite-message.py）。
# --list-refs：不改写提交说明，只列出过滤后提交说明里全部的 #数字 命中与各自会不会被改写，供改写前逐条核对。
#
# git filter-repo 只在脚本自己新克隆的输出目录里跑，不碰 --source 指向的仓库。
# 同样的源提交、同一份 paths.txt 与 rewrite-message.py，重跑得到的提交逐个相同，增量补齐靠的就是这一点。
set -euo pipefail
# 只操作输出目录里新克隆的仓库；调用方环境里的 GIT_DIR 之类不能带进来。
unset GIT_DIR GIT_WORK_TREE

here=$(cd "$(dirname "$0")" && pwd)
source_repo="https://github.com/idadawn/qian.git"
commit=""
out=""
list_refs=0

usage() {
  sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'
}

while [ $# -gt 0 ]; do
  case "$1" in
    --source) source_repo=$2; shift 2 ;;
    --commit) commit=$2; shift 2 ;;
    --out) out=$2; shift 2 ;;
    --list-refs) list_refs=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "未知参数：$1" >&2; usage >&2; exit 2 ;;
  esac
done

[ -n "$commit" ] || { echo "必须用 --commit 指定源提交" >&2; exit 2; }
[ -n "$out" ] || { echo "必须用 --out 指定输出目录" >&2; exit 2; }
[ ! -e "$out" ] || { echo "输出目录已存在，换一个或先删掉：$out" >&2; exit 2; }
filter_repo=${GIT_FILTER_REPO:-git-filter-repo}
command -v "$filter_repo" >/dev/null || { echo "找不到 git-filter-repo；装上它，或用环境变量 GIT_FILTER_REPO 指定" >&2; exit 2; }
command -v python3 >/dev/null || { echo "找不到 python3" >&2; exit 2; }

echo "克隆源仓库：$source_repo" >&2
git clone --quiet --bare --no-tags "$source_repo" "$out"
out=$(cd "$out" && pwd)
if ! full=$(git -C "$out" rev-parse --verify --quiet "$commit^{commit}"); then
  echo "源仓库里找不到提交 $commit" >&2
  exit 1
fi

# 只留一个引用，指向源提交；其余分支一律删掉，过滤后的历史就只有源提交可达的那部分。
git -C "$out" for-each-ref --format='%(refname)' | while read -r ref; do
  git -C "$out" update-ref -d "$ref"
done
git -C "$out" update-ref refs/heads/import "$full"
git -C "$out" symbolic-ref HEAD refs/heads/import

args=(--force --quiet --paths-from-file "$here/paths.txt")
if [ "$list_refs" -eq 0 ]; then
  args+=(--message-callback "$here/rewrite-message.py")
fi
# --force：输出目录是上面刚克隆、只改过引用的仓库，filter-repo 的「全新克隆」检查只认它自己的判据。
(cd "$out" && "$filter_repo" "${args[@]}")

tip=$(git -C "$out" rev-parse refs/heads/import)
count=$(git -C "$out" rev-list --count refs/heads/import)
files=$(git -C "$out" ls-tree -r --name-only refs/heads/import | wc -l | tr -d ' ')

if [ "$list_refs" -eq 1 ]; then
  echo "过滤后提交说明里的全部 #数字 命中（未改写）："
  git -C "$out" log --format='@@@%H%n%B' refs/heads/import | python3 "$here/list-refs.py"
else
  messages=$(git -C "$out" log --format=%B refs/heads/import)
  qualified=$(printf '%s' "$messages" | { grep -oE 'idadawn/qian#[0-9]+' || true; } | wc -l | tr -d ' ')
  bare=$(printf '%s' "$messages" | { grep -oE '(^|[^A-Za-z0-9_/])#[0-9]+([^A-Za-z0-9_]|$)' || true; } | wc -l | tr -d ' ')
  echo "提交说明里写成 idadawn/qian#N 的引用：$qualified 处；剩下的裸 #数字：$bare 处"
fi
echo "源提交：$full"
echo "过滤后的末端：$tip（分支 import）"
echo "提交数：$count"
echo "末端的文件数：$files"
