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

### 适配 opencode-go 的 DeepSeek

`opencode-go` 的 DeepSeek 在 pi 模型目录里是 `openai-completions`，pi-web-search
默认会当成“不支持原生搜索”。实测网关的 `/zen/go/v1/messages`（Anthropic 兼容路由）
对 DeepSeek 支持 `web_search_20260209`，因此打了个小补丁：把 opencode-go / opencode
上的 `deepseek*` 识别为 DeepSeek 类型，并保持网关 baseUrl（不重写到 `/anthropic`）。
打完补丁后直接用当前模型就能搜索：

```shell
PKG=~/.pi/agent/npm/node_modules/pi-web-search
patch -p1 -d "$PKG" < pi/patches/pi-web-search-opencode-deepseek.patch
```

补丁针对 `pi-web-search@1.7.0`；重装/升级该包后需要重新应用（或钉住版本：
`pi install npm:pi-web-search@1.7.0`）。
