# AGENTS.md：给编码代理的入口说明

这个仓库是 **Qian** 的新家：匠心智能体平台的前端框架（TypeScript、React）。**目前只有框架级文档，没有代码。**

## 先弄清名字

「Qian」换了所指。2026-11-17 之前它指基于 Kun 的平台层（`idadawn/qian` 仓库里的后端、`Qian.*` 包）；现在它只作前端框架的名字，也就是原来的 yue。原来叫 Qian 的后端并入 Kun。组件 id 前缀 `qian.`、`qian` 命令行这些保留下来的字面，不表示前端框架。完整的对照见平台总览仓库的[名称对照](https://github.com/CavaiLAB/jiangxin/blob/main/docs/glossary.md)。

## 要改代码

前端代码还在 `idadawn/qian` 的前端工作区里（`packages/yue/`、`packages/qian-*`、`apps/`），现在的名字仍是 yue。去那边改，按那边的 `AGENTS.md` 办。

不要在本仓库里新建代码目录，也不要把原仓库的代码复制过来。更名排在后端归并的最后一批，在那之前不要先改名。

## 要改文档

1. 文档用中文，不写参考平台和对标项目的名字。
2. 分清「已定」「提议」「待定」。更名、时点、包名换前缀、许可是已定的；所有者换成 CavaiLAB 之后的包名前缀、迁入本仓库的时点、命令行放在哪个仓库是待定的。
3. 说现状的时候写清是「已有」（在原仓库里已经实现）还是「规划」。
4. 平台级的口径（名称、三个框架的分工、契约）在 [jiangxin](https://github.com/CavaiLAB/jiangxin) 里改，这里只引用。
5. 改动走分支和 PR，不直接推 `main`。
