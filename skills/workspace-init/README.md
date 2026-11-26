# workspace-init

用于初始化或整理任务工作区目录的 Skill：为新项目或已有散乱目录建立极简、实时、人机友好的文档与实验管理结构（`AGENTS.md` + `STATUS.md` + 按需创建的 `docs/` 与 `experiments/`），并固化实时 Git 检查、Agent 主动更新文档和实验单步自包含规范。

仅在显式调用（`@workspace-init` / `$workspace-init` / `/workspace-init`）或明确要求初始化/整理工作区协作文档时启用。

## 安装

按本机已安装的 agent 挂载软链（Antigravity 读 `~/.gemini/config/skills`，Codex 读 `~/.codex/skills`，Claude Code 读 `~/.claude/skills`，Kimi Code 读 `~/.kimi-code/skills`）：

```shell
mkdir -p ~/.gemini/config/skills ~/.codex/skills ~/.claude/skills ~/.kimi-code/skills

ln -s "$PWD/skills/workspace-init" \
  ~/.gemini/config/skills/workspace-init

ln -s "$PWD/skills/workspace-init" \
  ~/.codex/skills/workspace-init

ln -s "$PWD/skills/workspace-init" \
  ~/.claude/skills/workspace-init

ln -s "$PWD/skills/workspace-init" \
  ~/.kimi-code/skills/workspace-init
```

### 验证

确认目标软链均指向本仓库的 `skills/workspace-init` 且可读取 `SKILL.md`：

```shell
for d in ~/.gemini/config/skills ~/.codex/skills ~/.claude/skills ~/.kimi-code/skills; do
  [ -L "$d/workspace-init" ] && ls -ld "$d/workspace-init" && head -n 3 "$d/workspace-init/SKILL.md"
done
```

### 卸载

确认是符号链接后移除：

```shell
for d in ~/.gemini/config/skills ~/.codex/skills ~/.claude/skills ~/.kimi-code/skills; do
  test -L "$d/workspace-init" && unlink "$d/workspace-init"
done
```

## 如何使用

```text
@workspace-init 帮我初始化这个工作目录，主要做 XXX，repo-a 是主仓，repo-ref 是只读参考仓，后面会跑对比实验。
$workspace-init 帮我整理当前目录下散落的文档并建立工作区协作规范。
```
