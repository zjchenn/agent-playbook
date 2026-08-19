# Plan Mode 扩展

为 [pi](https://github.com/earendil-works/pi) 实现的 plan 模式（参考 Codex / Claude / Kimi 的
plan mode），针对 coding agent 场景定制，两个核心设计：

1. **自动触发 + 手动触发**：`/plan` 手动进入；任务复杂度打分超过阈值时自动询问是否进入。
2. **按任务难度自动拆分 subagent**：规划阶段产出 `Plan:` + `Subagent split:` 双结构，
   执行阶段独立步骤并行派 worker、依赖步骤链式派 worker、收尾派 reviewer。

## 功能

| 能力 | 说明 |
|------|------|
| 只读规划 | plan 模式下禁用 edit/write；bash 限制为只读白名单（cat/grep/find/git status 等） |
| 自动触发 | `input` 事件对任务做复杂度打分（中英文关键词/列表需求/顺序词/动作数/文件提及等），超过阈值（默认 8）询问是否进入 plan 模式 |
| 手动触发 | `/plan`、`/plan <任务>`、`Ctrl+Alt+P`、`--plan` 启动参数 |
| 计划提取 | 从 `Plan:` 编号步骤提取 todo，`[DONE:n]` 标记进度，widget 实时显示 |
| 子代理拆分 | `subagent` 工具单发/并行/链式派 scout/planner/worker/reviewer，独立子进程隔离上下文 |
| Plan 模式守卫 | plan 模式下 subagent 只允许 scout/planner（只读），worker/reviewer 被拒绝 |
| 会话持久化 | 状态（模式/todo/进度）随会话保存，`/resume` 后自动恢复 |

## 安装

```shell
# 1) 扩展（目录软链，随仓库更新）
mkdir -p ~/.pi/agent/extensions
ln -sfn "$PWD/pi/extensions/plan-mode" ~/.pi/agent/extensions/plan-mode

# 2) 子代理定义
mkdir -p ~/.pi/agent/agents
for f in "$PWD"/pi/agents/*.md; do
  ln -sf "$f" ~/.pi/agent/agents/$(basename "$f")
done

# 3) 重载
# 在 pi 会话中执行 /reload，或重启 pi
```

卸载：`unlink ~/.pi/agent/extensions/plan-mode`，再逐个 `unlink ~/.pi/agent/agents/*.md`。

## 使用

### 手动触发

```
/plan                        # 进入 plan 模式，然后描述任务
/plan 重构登录模块            # 进入 plan 模式并直接开始规划
Ctrl+Alt+P                   # 切换
pi --plan                    # 启动即进入 plan 模式
```

### 自动触发

复杂任务（多步骤、多文件、重构/迁移类关键词、多条列表需求等）发送后，TUI 会弹出：

```
⚠ 检测到复杂任务（复杂度 12: 关键词:重构,模块；多步骤任务；3 处文件提及）
  [进入 Plan 模式（只读分析 + 自动拆分子代理）]  [直接执行]
```

RPC/JSON 模式无 UI 时自动进入，不询问。

### 流程

1. **规划阶段**：agent 只读调研（必要时并行派 scout 侦察、planner 起草），产出：

```
Plan:
1. 第一步
2. 第二步
...

Subagent split:
- 可并行执行（worker 子代理并行）: 第 1、3 步
- 有依赖链（worker 链式）: 第 2 步 → 第 4 步
- 必须由你直接执行: 第 5 步（原因）
```

2. **确认**：弹出选择菜单 `执行计划（按难度自动拆分 subagent）/ 调整计划 / 留在 Plan 模式`。
3. **执行阶段**：恢复全部工具。简单步骤直接做；复杂/批量步骤按 `Subagent split` 拆分
   —— 独立步骤并行派 worker、依赖步骤链式派 worker、收尾派 reviewer 复查。
   每完成一步 agent 输出 `[DONE:n]`，widget 显示 `📋 3/5`。

## 配置（可选）

`~/.pi/agent/plan-mode.json`：

```json
{
  "autoTrigger": true,        // 是否启用自动触发
  "threshold": 8,             // 复杂度阈值，越高越不容易触发
  "requireConfirmation": true // TUI 下是否先询问再进入
}
```

## 子代理

定义在 `~/.pi/agent/agents/*.md`（仓库源目录 `pi/agents/`），YAML frontmatter：

```markdown
---
name: scout
description: 快速侦察代码库…
tools: read, grep, find, ls, bash   # 可选，缺省 = 全部工具
model: claude-haiku-4-5             # 可选，缺省继承当前会话模型
---
```

| 代理 | 用途 | 工具 |
|------|------|------|
| `scout` | 代码库侦察，返回压缩上下文 | 只读 |
| `planner` | 方案设计（只读） | 只读 |
| `worker` | 实现具体步骤 | 全部 |
| `reviewer` | 改动复查 | 只读 |

项目级代理放 `<repo>/.pi/agents/*.md`，subagent 调用时传 `agentScope: "both"` 并会先询问确认。

## 目录结构

```
plan-mode/
├── index.ts       # plan 模式生命周期（命令/自动触发/工具集切换/上下文注入/进度跟踪）
├── subagent.ts    # subagent 工具（单发/并行/链式，流式渲染，plan 模式守卫）
├── agents.ts      # 子代理发现（用户级 + 项目级）
├── complexity.ts  # 复杂度打分（自动触发）
├── utils.ts       # Plan 解析 + bash 白名单
└── state.ts       # 共享状态 + 配置加载
```

## 说明

- 本扩展借鉴了 pi 官方 `examples/extensions/plan-mode` 与 `subagent`（MIT）的骨架，
  差异：自动触发、`/plan <任务>` 参数化、plan 模式 subagent 守卫、中英文复杂度打分、
  执行阶段按难度拆分策略注入。
- 若同时安装了官方 subagent 示例扩展，工具名 `subagent` 会冲突（变成 `subagent:1`），
  建议只保留本扩展。
