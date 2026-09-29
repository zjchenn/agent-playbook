# /usage（opencode-usage）

pi 扩展：查询 opencode 的 Go/Zen 套餐用量限额（官方接口 `GET /zen/go/v1/usage`），
由 pi 扩展命令机制同步执行，**不经过 LLM，零 token 消耗**。

## 安装

```shell
mkdir -p ~/.pi/agent/extensions
ln -sf "$PWD/pi/extensions/opencode-usage.ts" ~/.pi/agent/extensions/opencode-usage.ts
```

装完在 pi 会话里执行 `/reload`，或重启 pi。

### 前置条件

- 使用 `opencode-go` provider，API key 通过以下任一方式提供：
  - `~/.pi/agent/models.json` 中 `providers.opencode-go.apiKey`
  - `~/.pi/agent/auth.json` 中 `opencode-go` 条目
  - 环境变量 `OPENCODE_API_KEY`

## 验证

输入 `/usage`，聊天区出现用量卡片：

```
OpenCode Go 套餐用量
Rolling   ░░░░░░░░░░  0% ok   重置 2026/8/16 22:17
Weekly    ░░░░░░░░░░  0% ok   重置 2026/8/17 08:00
Monthly   ░░░░░░░░░░  0% ok   重置 2026/9/15 15:32
输入 /usage 可随时刷新
```

## endpoint 解析优先级

| 优先级 | 方式 | 示例 |
|--------|------|------|
| 1 | `/usage <url>` 命令参数 | `/usage https://my-proxy/zen/go/v1/usage` |
| 2 | 环境变量 `OPENCODE_USAGE_URL` | `export OPENCODE_USAGE_URL=https://my-proxy/usage` |
| 3 | 自动跟随 models.json 中 opencode-go 的 `baseUrl` | 改配置后自动推导 `${baseUrl}/usage` |
| 4 | 官方默认 | `https://opencode.ai/zen/go/v1/usage` |

使用非默认 endpoint 时，卡片会额外显示一行 `endpoint: <url>`。

## 卸载

```shell
unlink ~/.pi/agent/extensions/opencode-usage.ts
```

若当初是 `cp` 的真实拷贝而非软链，直接 `rm` 删除即可。
