# pi 配置（主题 + 扩展）

本目录是 [pi](https://github.com/earendil-works/pi)（coding agent）配置的**源目录**，
与 `skills/` 平行的分发源：仓库内唯一一份，通过软链装到 `~/.pi/agent/` 对应位置。

## 目录结构

```
pi/
├── settings.json            # 参考设置（theme: april-dark）；见下方说明，勿整份覆盖
├── themes/                  # TUI 主题（april-dark 为当前主题）
│   ├── april-dark.json
│   ├── catppuccin.json
│   ├── gruvbox.json
│   ├── nord.json
│   └── tokyo-night.json
└── extensions/
    └── opencode-usage.ts    # /usage 命令：查询 OpenCode Go 套餐用量限额
```

## 安装

### 方式 ①：软链到全局（推荐，与 skills 的安装方式一致）

所有项目生效，主题与扩展随仓库更新：

```shell
mkdir -p ~/.pi/agent/themes ~/.pi/agent/extensions

# 主题（想装哪个链接哪个，全部链接也可以）
ln -sf "$PWD/pi/themes/april-dark.json"   ~/.pi/agent/themes/april-dark.json
ln -sf "$PWD/pi/themes/catppuccin.json"   ~/.pi/agent/themes/catppuccin.json
ln -sf "$PWD/pi/themes/gruvbox.json"      ~/.pi/agent/themes/gruvbox.json
ln -sf "$PWD/pi/themes/nord.json"         ~/.pi/agent/themes/nord.json
ln -sf "$PWD/pi/themes/tokyo-night.json"  ~/.pi/agent/themes/tokyo-night.json

# 扩展（软链，不要 cp 拷贝）
ln -sf "$PWD/pi/extensions/opencode-usage.ts" ~/.pi/agent/extensions/opencode-usage.ts
```

### 方式 ②：项目内自动加载（可选）

在本仓库内让 pi 直接发现这些配置（需信任项目，启动时选择信任或 `/trust`）：

```shell
ln -s "$PWD/pi" .pi
```

### settings.json 说明

`pi/settings.json` 是**参考设置**，不要整份覆盖全局 `~/.pi/agent/settings.json`
（会丢掉你机器的 provider / model 等配置）。只需要把主题行合进去：

```json
{ "theme": "april-dark" }
```

或者直接 `/settings` 里切换主题。

安装完成后在 pi 会话里执行 `/reload`（热加载扩展），或重启 pi。

> **冲突原理**：pi 对「两个不同扩展文件注册同名命令」会做去重
> （`/usage` 变成 `/usage:1`、`/usage:2`），此时 `/usage` 不会被调度。
> 软链与项目内同一份文件（同一真实路径）不触发该逻辑，可放心共存。
> 但**不要**在全局目录再 `cp` 一份真实拷贝。

## 验证

1. 在 `/settings` 中能看到并选择 `april-dark`。
2. 输入 `/usage`，聊天区出现用量卡片：

```
OpenCode Go 套餐用量
Rolling   ░░░░░░░░░░  0% ok   重置 2026/8/16 22:17
Weekly    ░░░░░░░░░░  0% ok   重置 2026/8/17 08:00
Monthly   ░░░░░░░░░░  0% ok   重置 2026/9/15 15:32
输入 /usage 可随时刷新
```

## /usage 使用说明

查询 opencode 的 Go/Zen 套餐用量限额（官方接口 `GET /zen/go/v1/usage`），
由 pi 扩展命令机制同步执行，**不经过 LLM，零 token 消耗**。

### 前置条件

- 使用 `opencode-go` provider，API key 通过以下任一方式提供：
  - `~/.pi/agent/models.json` 中 `providers.opencode-go.apiKey`
  - `~/.pi/agent/auth.json` 中 `opencode-go` 条目
  - 环境变量 `OPENCODE_API_KEY`

### endpoint 解析优先级

| 优先级 | 方式 | 示例 |
|--------|------|------|
| 1 | `/usage <url>` 命令参数 | `/usage https://my-proxy/zen/go/v1/usage` |
| 2 | 环境变量 `OPENCODE_USAGE_URL` | `export OPENCODE_USAGE_URL=https://my-proxy/usage` |
| 3 | 自动跟随 models.json 中 opencode-go 的 `baseUrl` | 改配置后自动推导 `${baseUrl}/usage` |
| 4 | 官方默认 | `https://opencode.ai/zen/go/v1/usage` |

使用非默认 endpoint 时，卡片会额外显示一行 `endpoint: <url>`。

### 卸载

```shell
unlink ~/.pi/agent/themes/april-dark.json      # 按安装过的链接逐个移除
unlink ~/.pi/agent/extensions/opencode-usage.ts
```

若全局侧当初是 `cp` 真实拷贝而非软链，直接 `rm` 删除即可。