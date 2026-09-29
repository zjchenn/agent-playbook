# things-mcp

[hald/things-mcp](https://github.com/hald/things-mcp)：让 agent 读写 [Things 3](https://culturedcode.com/things)
的任务数据（查看列表、搜索、新建和更新待办等）。

## 安装

前置条件、安装命令和验证方式都以[上游 README](https://github.com/hald/things-mcp#installation) 为准，
安装时现读，这里不抄写。本仓库只约定以下几点：

- 注册到用户级（所有项目可用），服务名统一为 `things`。
- 装到本机已有的 Claude Code、Codex、opencode。上游没写到的客户端，用上游给出的通用启动命令，
  按该客户端自己的 MCP 注册方式配置。
- pi 不装：它没有内置 MCP 客户端。

卸载：在各客户端里移除名为 `things` 的 MCP 服务。
