# agent-router

`agent-router` 是一个纯提示词路由 Skill：按任务边界选择本地 Codex、Claude、Kimi、
DSH 或 Pi，并自动设置可落实的 effort。Codex、Claude、Kimi 构成核心可信池；DSH
和 Pi 只处理输入完备、结果可直接验收的简单固定任务。两者同属 DeepSeek V4 Flash
来源，不能充当两份独立意见。

它既可以通过 `$agent-router` 显式调用，也可以在用户要求委派、本地 Agent 或独立
复核时由 `description` 隐式触发。默认只调用一个 Agent，多 Agent 复核只使用核心池。

## 安装

```shell
mkdir -p ~/.agents/skills ~/.claude/skills

ln -s "$PWD/skills/agent-router" \
  ~/.agents/skills/agent-router

ln -s "$PWD/skills/agent-router" \
  ~/.claude/skills/agent-router
```

不安装到 Pi 的 Skill 目录；Pi 仅作为下游 CLI。

## 如何使用

```shell
$agent-router 用 Claude high 只读复核这个设计。
$agent-router 让另一个可信 Agent 检查这个根因判断。
$agent-router 用 Pi low 把已提供的 JSON 转成表格，不要补充事实。
```
