# Agent Playbook

我的 agent 工作台 —— 面向各类 coding agent 的技能（skills）与配置（pi）集合，
按「源目录 + 软链安装」的模式管理：仓库内是唯一源，装到哪个 agent 就软链过去，
随仓库更新。

## 目录

| 目录 | 内容 | 安装说明 |
|------|------|----------|
| [`skills/`](skills/README.md) | agent 技能（如 `mastery-arc` 教学模式），供 Claude Code / Codex / pi 等使用 | [skills/README.md](skills/README.md) |
| [`pi/`](pi/README.md) | pi（coding agent）的主题与扩展（`/usage` 套餐用量查询） | [pi/README.md](pi/README.md) |

## 快速开始

```shell
# 技能（以 mastery-arc 为例）
ln -sf "$PWD/skills/mastery-arc" ~/.claude/skills/mastery-arc

# pi 主题与扩展
ln -sf "$PWD/pi/themes/april-dark.json" ~/.pi/agent/themes/april-dark.json
ln -sf "$PWD/pi/extensions/opencode-usage.ts" ~/.pi/agent/extensions/opencode-usage.ts
```

具体步骤见各子目录的 README。

## License

[MIT](LICENSE) © 2026 zjchenn