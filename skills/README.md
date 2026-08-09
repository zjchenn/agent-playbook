# Skills Collection

## learning

### 安装

```shell
mkdir -p ~/.codex/skills ~/.claude/skills

ln -s $PWD/skills/learning \
  ~/.codex/skills/learning

ln -s $PWD/skills/learning \
  ~/.claude/skills/learning
```

### 如何使用

| 模式        | 使用时机          | Agent 主要行为       |
| --------- | ------------- | ---------------- |
| `learn`   | 新知识或首次系统学习    | 诊断、示例、渐退提示、迁移    |
| `coding`  | 读代码、理解实现      | 预测、trace、实验、代码证据 |
| `review`  | 间隔复现          | 闭卷抽查、反馈、再检索      |
| `debrief` | 工作已由 Agent 完成 | 提炼原理、根因和可迁移经验    |

```shell
$learning learn FSDP2，重点是参数生命周期和通信。
$learning coding 读这次 fused_moe 重构，先让我自己 trace。
$learning review MTP，不要先讲。
$learning debrief 刚才修好的乱码问题。
```