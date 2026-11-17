---
'@cavailab/qian-tokens': patch
'@cavailab/qian-contracts': patch
'@cavailab/qian-sdk': patch
'@cavailab/qian-core': patch
'@cavailab/qian-form': patch
'@cavailab/qian-data': patch
'@cavailab/qian-shell': patch
'@cavailab/qian-biz': patch
'@cavailab/qian-runtime': patch
'@cavailab/qian-plugin-sdk': patch
---

包内说明的安装一段改为：项目的 `.npmrc` 只写作用域那一行，认证行放进用户级配置（`~/.npmrc`，或 `NPM_CONFIG_USERCONFIG` 指向的文件）。pnpm 10.34.2 起的 10、11.5.3 起的 11 与 12 不展开项目 `.npmrc` 认证行里的环境变量，照 0.2.0 说明里的写法用 pnpm 装包会得到 401。
