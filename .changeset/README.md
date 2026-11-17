# Changesets

本仓库的包用 [Changesets](https://github.com/changesets/changesets) 管版本与变更记录：改了包的公开行为就在 PR 里跑 `pnpm changeset`，选受影响的包与升级级别（0.x 期间破坏性变更记 `minor`，见 `packages/qian/README.md`「版本策略」）。`packages/qian/*` 的 8 个包固定同一版本号（`config.json` 的 `fixed`）。那里逐个写包名、不写 `@cavailab/qian-*`：运行时与插件开发包也以这个前缀开头，它们不在固定组里，各自定版本。`qian-playground` 不发包。
