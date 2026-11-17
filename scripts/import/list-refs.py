"""列出提交说明里全部的 #数字 命中，以及各自按 rewrite-message.py 的规则会不会被改写。

由 import.sh --list-refs 调用：标准输入是 git log --format='@@@%H%n%B' 的输出。
两处的正则必须一致；改了 rewrite-message.py 的规则，这里同步改。
"""
import re
import sys

RULE = re.compile(r"(?<![A-Za-z0-9_/])#([0-9]+)(?![A-Za-z0-9_])")

commit, total, rewritten = None, 0, 0
for line in sys.stdin.read().split("\n"):
    if line.startswith("@@@"):
        commit = line[3:13]
        continue
    starts = {m.start() for m in RULE.finditer(line)}
    for m in re.finditer(r"#[0-9]+", line):
        total += 1
        hit = m.start() in starts
        rewritten += hit
        tag = "改写  " if hit else "不改写"
        left = line[max(0, m.start() - 24):m.start()]
        right = line[m.end():m.end() + 24]
        print(f"{commit}  {tag}  {left}【{m.group(0)}】{right}")
print(f"合计 {total} 处，按规则改写 {rewritten} 处，不改写 {total - rewritten} 处。")
