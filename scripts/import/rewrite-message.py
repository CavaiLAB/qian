# git filter-repo 的 --message-callback 回调函数体（由 import.sh 传入，filter-repo 把它包成 def callback(message)）。
# message 是提交说明的原始字节。
#
# 把提交说明里指向源仓库 PR 的 #N 改写成 idadawn/qian#N，否则在新仓库里会被链到不相干的 PR。
# 只改前后都不是 ASCII 字母、数字、下划线的 #数字：已经写成 idadawn/qian#N 的（# 前是字母）不再加前缀，
# #1e1e1e 这样的十六进制颜色（数字后接字母）不动；任务号 [S1-YUE-012]、复核号 R169 不带 #，不受影响。
# 改写前的全部命中可用 import.sh --list-refs 列出来逐条看；list-refs.py 里的正则与这里必须一致。
import re

return re.sub(rb'(?<![A-Za-z0-9_/])#([0-9]+)(?![A-Za-z0-9_])', rb'idadawn/qian#\1', message)
