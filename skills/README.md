# Skills Collection

## mastery-arc

`mastery-arc` 是原 `learning` skill 的后继名称。仅在显式调用或明确要求进入
教学模式时启用，并把学习组织成有前置知识检查、范围边界、结束条件和落盘记录的完整弧线。

### 安装

```shell
mkdir -p ~/.codex/skills ~/.claude/skills

ln -s "$PWD/skills/mastery-arc" \
  ~/.codex/skills/mastery-arc

ln -s "$PWD/skills/mastery-arc" \
  ~/.claude/skills/mastery-arc
```

从旧名称迁移时，确认旧路径是符号链接后再移除：

```shell
test -L ~/.codex/skills/learning && unlink ~/.codex/skills/learning
test -L ~/.claude/skills/learning && unlink ~/.claude/skills/learning
```

### 如何使用

| 模式        | 使用时机          | Agent 主要行为       |
| --------- | ------------- | ---------------- |
| `learn`   | 学习新概念、理论或机制 | 建立可独立重建和迁移的知识模型 |
| `coding`  | 阅读并理解当前代码实现 | 连续梳理调用链、数据流和设计机制 |
| `review`  | 检索和巩固已有学习 | 闭卷检索、针对缺口纠错、再次迁移 |
| `debrief` | 已完成工作的复盘 | 从实际证据提炼决策、反模式和经验 |

```shell
$mastery-arc learn FSDP2，重点是参数生命周期和通信。
$mastery-arc coding 读这次 fused_moe 重构，先梳理完整调用链。
$mastery-arc review MTP，不要先讲。
$mastery-arc debrief 刚才修好的乱码问题。
```

每次实质性学习结束时，会默认在当前学习工作区的
`learning-notes/<YYYY>/` 下生成一份不可覆盖的 Markdown 记录。
