# pi 配置

本目录是 [pi](https://github.com/earendil-works/pi)（coding agent）配置的**源目录**：
仓库内唯一一份，通过软链装到 `~/.pi/agent/` 对应位置。本文档负责主题与参考设置，
各扩展的安装与用法见各自的文档。

## 目录结构

```
pi/
├── settings.json   # 参考设置；勿整份覆盖，见下方说明
├── themes/         # TUI 主题
├── agents/         # 子代理定义，由 plan-mode 使用
└── extensions/     # 扩展，见下方「扩展」
```

## 扩展

- [`/usage`](extensions/opencode-usage.md)
- [`plan-mode`](extensions/plan-mode/README.md)

## 安装主题

### 方式 ①：软链到全局（推荐）

所有项目生效，随仓库更新。想装哪个主题链接哪个，全部链接也可以：

```shell
mkdir -p ~/.pi/agent/themes
for f in "$PWD"/pi/themes/*.json; do
  ln -sf "$f" ~/.pi/agent/themes/$(basename "$f")
done
```

### 方式 ②：项目内自动加载（可选）

在本仓库内让 pi 直接发现 `pi/` 下的全部配置（需信任项目，启动时选择信任或 `/trust`）：

```shell
ln -s "$PWD/pi" .pi
```

### settings.json 说明

`pi/settings.json` 是**参考设置**，不要整份覆盖全局 `~/.pi/agent/settings.json`
（会丢掉你机器的 provider / model 等配置）。只需要把主题行合进去：

```json
{ "theme": "april-dark" }
```

或者直接 `/settings` 里切换主题。

> **不要 `cp`**：pi 对「两个不同扩展文件注册同名命令」会做去重
> （如 `/usage` 变成 `/usage:1`、`/usage:2`），此时原命令不会被调度。
> 软链与项目内同一份文件（同一真实路径）不触发该逻辑，可放心共存。

## 验证

在 `/settings` 中能看到并选择 `april-dark`。

## 卸载

```shell
for f in "$PWD"/pi/themes/*.json; do
  unlink ~/.pi/agent/themes/$(basename "$f") 2>/dev/null
done
```

若当初是 `cp` 的真实拷贝而非软链，直接 `rm` 删除即可。
