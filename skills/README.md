# Skills Collection

## mastery-arc

`mastery-arc` 是原 `learning` skill 的后继名称。它把一次学习组织成有明确
起点、依赖地图、结束条件和落盘记录的完整弧线。

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
| `learn`   | 新知识或首次系统学习    | 诊断、示例、渐退提示、迁移    |
| `coding`  | 读代码、理解实现      | 预测、trace、实验、代码证据 |
| `review`  | 间隔复现          | 闭卷抽查、反馈、再检索      |
| `debrief` | 工作已由 Agent 完成 | 提炼原理、根因和可迁移经验    |

```shell
$mastery-arc learn FSDP2，重点是参数生命周期和通信。
$mastery-arc coding 读这次 fused_moe 重构，先梳理完整调用链。
$mastery-arc review MTP，不要先讲。
$mastery-arc debrief 刚才修好的乱码问题。
```

每次实质性学习结束时，会默认在当前学习工作区的
`learning-notes/<YYYY>/` 下生成一份不可覆盖的 Markdown 记录。
