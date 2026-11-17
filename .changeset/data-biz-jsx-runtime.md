---
'@cavailab/qian-data': patch
'@cavailab/qian-biz': patch
---

修复 0.2.0 一渲染组件就报错。0.2.0 的数据组件包与业务选择器包构建时用了经典 JSX 转换：发布的 `dist/index.js` 调用 `React.createElement`，模块里却没有导入 `React`，渲染这两个包的任何组件（如 `DataTable`、`Tree`、`OrganizeSelect`、`UserSelect`）都会报 `ReferenceError: React is not defined`。现在改用 automatic JSX runtime，从 `react/jsx-runtime` 导入，不再依赖全局的 `React`。组件的接口与行为没有变化。

用到这两个包的项目请从 0.2.0 升到 0.2.1；8 个层包是同一个版本号，一起升。
