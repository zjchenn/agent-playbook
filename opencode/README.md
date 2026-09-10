# opencode 配置（主题）

本目录是 [opencode](https://opencode.ai) TUI 配置的**源目录**，与 `pi/`、`skills/` 平行的
分发源：仓库内唯一一份，通过软链装到 `~/.config/opencode/` 对应位置。

## 目录结构

```
opencode/
└── themes/
    └── april-dark.json    # april-dark 主题（从 pi 版移植，secondary/warning 为 lime）
```

## 安装

全局生效（推荐，与 `pi/`、`skills/` 的安装方式一致）：

```shell
mkdir -p ~/.config/opencode/themes
ln -sf "$PWD/opencode/themes/april-dark.json" ~/.config/opencode/themes/april-dark.json
```

启用主题，写入 `~/.config/opencode/tui.json`（已存在则只合并 `theme` 一行）：

```json
{
  "$schema": "https://opencode.ai/tui.json",
  "theme": "april-dark"
}
```

也可启动后在 TUI 里执行 `/theme` 选择 `april-dark`。

> 注意：opencode 全局配置目录是 `~/.config/opencode/`（不是 `~/.opencode/`）；
> 配置只在启动时加载，装完需重启 opencode。

项目内安装（可选）：软链到 `<project>/.opencode/themes/` 即可同名生效。

## 与 pi 版的差异

- pi 的 `vars` / `colors` → opencode 的 `defs` / `theme`（键名不同，已做映射）
- pi 的 `accent`（lime）→ opencode 的 `primary`；多级 thinking 颜色 → `thinkingOpacity: 0.6`
- `secondary` / `warning` 设为 lime：输入框左条、Build 标识、variant（如 max）标签与思考文本为绿色；
  副作用：权限确认框、进行中 todo 等 warning 元素也是绿色
- 换色只需改 `defs` 里的颜色引用，opencode 自带 diff / markdown / syntax 等键已按 pi 对应项填好

## 验证

1. 启动 opencode，`/theme` 里能看到并选择 `april-dark`。
2. 输入框左条、Build 标识为 lime 绿；模型 variant 标签（如 max）为绿色。

## 卸载

```shell
unlink ~/.config/opencode/themes/april-dark.json
```
