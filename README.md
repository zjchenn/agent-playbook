# Agent Playbook

我的 agent 工作台 —— 面向各类 coding agent 的技能（skills）与配置（pi / opencode）集合，
按「源目录 + 软链安装」的模式管理：仓库内是唯一源，装到哪个 agent 就软链过去，
随仓库更新。

## 目录

| 目录 | 内容 | 安装说明 |
|------|------|----------|
| [`skills/`](skills/README.md) | agent 技能（如 `mastery-arc` 教学模式），供 Claude Code / Codex / pi 等使用 | [skills/README.md](skills/README.md) |
| [`pi/`](pi/README.md) | pi（coding agent）的配置：主题、扩展（`/usage` 用量查询、`/plan` plan 模式 + 子代理拆分）与子代理定义 | [pi/README.md](pi/README.md) |
| [`opencode/`](opencode/README.md) | opencode TUI 的配置：主题（april-dark，从 pi 版移植） | [opencode/README.md](opencode/README.md) |

## 安装

- 让 agent 装：发送「读 https://github.com/zjchenn/agent-playbook/blob/master/INSTALL.md ，按它帮我配置」。
- 手动装：看上表中各组件的 README。

## License

[MIT](LICENSE) © 2026 zjchenn