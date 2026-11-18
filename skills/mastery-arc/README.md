# mastery-arc

以提问为核心的学习 skill：让学习者自己回忆、解释、预测和迁移，而不是听讲。
仅在显式调用或明确要求进入教学模式时启用。每个主题维护一份档案，用于续学和间隔复习。

## 安装

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

## 如何使用

开头的词表示侧重，可以组合，也可以不写。

| 写法       | 使用时机             | Agent 主要行为                                   |
| ---------- | -------------------- | ------------------------------------------------ |
| `learn`    | 学新概念、理论或论文 | 先摸底，再按缺口讲一点、问一点                   |
| `coding`   | 读源码、理解实现     | 沿一条代表性路径提问，结论落到 `文件:行号`       |
| `review`   | 复习学过的内容       | 闭卷回忆，只补暴露出的缺口；不带主题时列出到期的 |

```shell
$mastery-arc learn FSDP2，重点是参数生命周期和通信。
$mastery-arc coding 读这次 fused_moe 重构，先梳理完整调用链。
$mastery-arc review MTP
$mastery-arc review
$mastery-arc 拿刚才修好的乱码问题考我。
```

## 档案

每个主题一份 `learning-notes/<主题>.md`，默认放在当前工作区根目录下。续学和复习都更新同一个文件，
里面记着进度、易错点、题库和下次复习日期。想把所有主题集中到一处，在调用时或 agent 的全局指令里
指明档案目录。
