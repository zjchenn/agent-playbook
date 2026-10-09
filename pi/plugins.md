# 外部插件

pi 的 plan 模式、子代理委派、联网搜索由外部 npm 插件提供，本目录不再自建维护。
本文档记录装哪些插件、上游地址，以及本仓库自己的配置约定。

## 装什么

| 插件 | 用途 | 上游 |
|------|------|------|
| `@narumitw/pi-plan-mode` | Codex 风格 `/plan` 只读规划模式 | https://github.com/narumitw/pi-plan-mode |
| `pi-subagents` | `subagent` 工具：单发 / 并行 / workflow / 后台子代理 | https://github.com/nicobailon/pi-subagents |
| `pi-web-search` | `web_search` / `url_context` 工具 | https://github.com/ttttmr/pi-web-search |

安装：

```shell
pi install npm:@narumitw/pi-plan-mode
pi install npm:pi-subagents
pi install npm:pi-web-search
```

装完在 pi 会话里 `/reload` 或重启 pi。卸载把 `install` 换成 `remove`，source 写法相同。

## 子代理

`pi-subagents` 读取 `~/.pi/agent/agents/*.md` 作为用户级子代理定义，
优先级高于其内置代理（scout / worker / reviewer / oracle 等）。
自定义代理放这里即可，不需要额外注册。

## 联网搜索

`pi-web-search` 需要「模型原生支持搜索」：当前会话模型支持时直接用，
不支持时会返回错误，也可以在 `~/.pi/agent/web-search.json` 指定专用搜索模型：

```json
{ "provider": "opencode-go", "model": "gpt-5.6-luna" }
```

### 适配 opencode-go 的 DeepSeek（纯配置）

`opencode-go` 的 DeepSeek 在 pi 模型目录里是 `openai-completions`，pi-web-search
默认会当成“不支持原生搜索”。但该网关同时提供 Anthropic 兼容路由
`/zen/go/v1/messages`，对 DeepSeek 支持 `web_search_20260209`。把这个路由声明成
一个独立 provider，再用 pi-web-search 自带的 `web-search.json` 指定搜索模型即可，
**不改第三方源码**，升级/重装插件也不会失效。

`~/.pi/agent/models.json`（新增一个 provider；apiKey 用 `!command` 复用现有凭据）：

```json
{
  "providers": {
    "opencode-go-anthropic": {
      "name": "OpenCode Go (Anthropic-compatible route)",
      "baseUrl": "https://opencode.ai/zen/go/v1",
      "api": "anthropic-messages",
      "apiKey": "!pi auth print-api-key --provider opencode-go",
      "models": [
        {
          "id": "deepseek-v4.1-flash",
          "reasoning": true,
          "thinkingLevelMap": { "off": null, "minimal": null, "low": "low", "medium": null, "high": "high", "xhigh": null, "max": "max" },
          "input": ["text", "image"],
          "contextWindow": 1000000,
          "maxTokens": 384000,
          "cost": { "input": 0.15, "output": 0.6, "cacheRead": 0.003, "cacheWrite": 0 }
        }
      ]
    }
  }
}
```

`~/.pi/agent/web-search.json`：

```json
{ "provider": "opencode-go-anthropic", "model": "deepseek-v4.1-flash" }
```

对话模型仍是 `opencode-go/deepseek-v4.1-flash`，只有 `web_search` 的请求走该 provider。
验证：`pi -p --no-session "用 web_search 查一下今天的 UTC 日期"`。
