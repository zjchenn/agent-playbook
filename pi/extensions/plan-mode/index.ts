/**
 * Plan Mode for pi — 参考 Codex / Claude / Kimi 的 plan 模式，针对 coding agent 定制。
 *
 * 核心能力：
 *   1. 只读规划：进入 plan 模式后禁用 edit/write，bash 限制为只读白名单，
 *      agent 只调研、只出方案，不碰文件。
 *   2. 自动触发：input 事件对任务做复杂度打分，超过阈值询问是否进入 plan 模式；
 *      也支持 /plan [task] 手动触发、Ctrl+Alt+P 切换、--plan 启动即进入。
 *   3. 子代理拆分：规划阶段要求产出 Plan: + Subagent split: 两个部分；
 *      执行阶段按步骤难度自动用 subagent 工具拆分 —— 独立步骤并行 worker，
 *      依赖步骤链式 worker，需要侦察/复查的派 scout/reviewer。
 *   4. 计划跟踪：Plan: 编号步骤 + [DONE:n] 标记 + 进度 widget + 会话持久化。
 *
 * 配置（可选）：~/.pi/agent/plan-mode.json
 *   { "autoTrigger": true, "threshold": 8, "requireConfirmation": true }
 *
 * 结构：
 *   - index.ts      本文件：plan 模式生命周期
 *   - subagent.ts   subagent 工具（单发/并行/链式）
 *   - agents.ts     子代理发现（~/.pi/agent/agents、.pi/agents）
 *   - complexity.ts 复杂度启发式（自动触发）
 *   - utils.ts      计划解析 + bash 白名单
 *   - state.ts      共享状态
 *
 * 部分代码改编自 pi 官方 examples/extensions/plan-mode 与 subagent (MIT)。
 */

import * as fs from "node:fs";
import * as path from "node:path";
import type { AgentMessage } from "@earendil-works/pi-agent-core";
import type { AssistantMessage, TextContent } from "@earendil-works/pi-ai";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { getAgentDir } from "@earendil-works/pi-coding-agent";
import { scoreComplexity } from "./complexity.ts";
import { planState, resetPlanState, DEFAULT_CONFIG, type PlanModeConfig } from "./state.ts";
import { registerSubagentTool } from "./subagent.ts";
import {
	extractTodoItems,
	isSafeCommand,
	markCompletedSteps,
	type TodoItem,
} from "./utils.ts";

// Tools kept available in plan mode (read-only + subagent for recon/planning)
const PLAN_MODE_TOOLS = ["read", "bash", "grep", "find", "ls", "subagent"];
const PLAN_MODE_DISABLED_TOOLS = new Set<string>(["edit", "write"]);

const PLAN_CTX_TYPE = "plan-mode-context";
const EXEC_CTX_TYPE = "plan-mode-execute";
const PLAN_STATE_TYPE = "plan-mode";

interface PlanModeState {
	enabled: boolean;
	todos?: TodoItem[];
	executing?: boolean;
	toolsBeforePlanMode?: string[];
}

function isAssistantMessage(m: AgentMessage): m is AssistantMessage {
	return m.role === "assistant" && Array.isArray(m.content);
}

function getTextContent(message: AssistantMessage): string {
	return message.content
		.filter((block): block is TextContent => block.type === "text")
		.map((block) => block.text)
		.join("\n");
}

function uniqueToolNames(toolNames: string[]): string[] {
	return [...new Set(toolNames)];
}

function getPlanModeTools(activeToolNames: string[]): string[] {
	return uniqueToolNames([
		...activeToolNames.filter((name) => !PLAN_MODE_DISABLED_TOOLS.has(name)),
		...PLAN_MODE_TOOLS,
	]);
}

function enablePlanModeTools(): void {
	if (planState.toolsBeforePlanMode === undefined) {
		planState.toolsBeforePlanMode = api.getActiveTools();
	}
	api.setActiveTools(getPlanModeTools(planState.toolsBeforePlanMode));
}

function restoreNormalModeTools(): void {
	api.setActiveTools(planState.toolsBeforePlanMode ?? api.getActiveTools());
	planState.toolsBeforePlanMode = undefined;
}

function loadConfig(): PlanModeConfig {
	try {
		const configPath = path.join(getAgentDir(), "plan-mode.json");
		if (!fs.existsSync(configPath)) return { ...DEFAULT_CONFIG };
		const raw = JSON.parse(fs.readFileSync(configPath, "utf-8")) as Record<string, unknown>;
		return {
			autoTrigger: typeof raw.autoTrigger === "boolean" ? raw.autoTrigger : DEFAULT_CONFIG.autoTrigger,
			threshold: typeof raw.threshold === "number" ? raw.threshold : DEFAULT_CONFIG.threshold,
			requireConfirmation:
				typeof raw.requireConfirmation === "boolean" ? raw.requireConfirmation : DEFAULT_CONFIG.requireConfirmation,
		};
	} catch {
		return { ...DEFAULT_CONFIG };
	}
}

function persistState(): void {
	api.appendEntry(PLAN_STATE_TYPE, {
		enabled: planState.enabled,
		todos: planState.todos,
		executing: planState.executing,
		toolsBeforePlanMode: planState.toolsBeforePlanMode,
	});
}

function updateStatus(ctx: ExtensionContext): void {
	if (planState.executing && planState.todos.length > 0) {
		const completed = planState.todos.filter((t) => t.completed).length;
		ctx.ui.setStatus("plan-mode", ctx.ui.theme.fg("accent", `📋 ${completed}/${planState.todos.length}`));
	} else if (planState.enabled) {
		ctx.ui.setStatus("plan-mode", ctx.ui.theme.fg("warning", "⏸ plan"));
	} else {
		ctx.ui.setStatus("plan-mode", undefined);
	}

	if (planState.executing && planState.todos.length > 0) {
		const lines = planState.todos.map((item) => {
			if (item.completed) {
				return (
					ctx.ui.theme.fg("success", "☑ ") + ctx.ui.theme.fg("muted", ctx.ui.theme.strikethrough(item.text))
				);
			}
			return `${ctx.ui.theme.fg("muted", "☐ ")}${item.text}`;
		});
		ctx.ui.setWidget("plan-todos", lines);
	} else {
		ctx.ui.setWidget("plan-todos", undefined);
	}
}

function enablePlanMode(ctx: ExtensionContext): void {
	planState.enabled = true;
	planState.executing = false;
	planState.todos = [];
	enablePlanModeTools();
	ctx.ui.notify("Plan 模式已开启：只读调研 + 规划，edit/write 已禁用", "info");
	updateStatus(ctx);
	persistState();
}

function disablePlanMode(ctx: ExtensionContext): void {
	planState.enabled = false;
	planState.executing = false;
	planState.todos = [];
	restoreNormalModeTools();
	ctx.ui.notify("Plan 模式已关闭，完整权限已恢复", "info");
	updateStatus(ctx);
	persistState();
}

let api: ExtensionAPI;

export default function planModeExtension(pi: ExtensionAPI): void {
	api = pi;
	registerSubagentTool(pi);

	pi.registerFlag("plan", {
		description: "Start in plan mode (read-only exploration and planning)",
		type: "boolean",
		default: false,
	});

	// ── Commands ──────────────────────────────────────────────────────────

	pi.registerCommand("plan", {
		description: "进入 Plan 模式（只读调研 + 规划）；/plan <任务> 直接开始规划",
		handler: async (args, ctx) => {
			const task = args?.trim();
			if (planState.enabled && !task) {
				disablePlanMode(ctx);
				return;
			}
			if (!planState.enabled) enablePlanMode(ctx);
			if (task) {
				// Idle 时立即触发，streaming 中排队等 agent 空闲
				pi.sendUserMessage(task, { deliverAs: "followUp" });
			} else {
				ctx.ui.notify("Plan 模式已开启。请描述任务（或直接 /plan <任务>）", "info");
			}
		},
	});

	pi.registerCommand("todos", {
		description: "显示当前计划进度",
		handler: async (_args, ctx) => {
			if (planState.todos.length === 0) {
				ctx.ui.notify("暂无计划。先 /plan 进入 Plan 模式生成计划。", "info");
				return;
			}
			const list = planState.todos
				.map((t, i) => `${i + 1}. ${t.completed ? "☑" : "☐"} ${t.text}`)
				.join("\n");
			ctx.ui.notify(`Plan 进度：\n${list}`, "info");
		},
	});

	pi.registerShortcut("ctrl+alt+p", {
		description: "切换 Plan 模式",
		handler: async (ctx) => {
			if (planState.enabled) disablePlanMode(ctx);
			else enablePlanMode(ctx);
		},
	});

	// ── Auto-trigger: 复杂度超过阈值时询问是否进入 plan 模式 ───────────────

	pi.on("input", async (event, ctx) => {
		if (planState.enabled || planState.executing) return;
		if (!planState.config.autoTrigger) return;
		if (event.source !== "interactive") return;
		if (event.streamingBehavior) return; // 不打断 streaming 中的 steering

		const text = event.text.trim();
		if (!text || text.startsWith("/")) return;

		const { score, reasons } = scoreComplexity(text);
		if (score < planState.config.threshold) return;

		if (ctx.mode === "tui" && planState.config.requireConfirmation) {
			const choice = await ctx.ui.select(
				`⚠ 检测到复杂任务（复杂度 ${score}: ${reasons.slice(0, 3).join("；")}）`,
				["进入 Plan 模式（只读分析 + 自动拆分子代理）", "直接执行"],
			);
			if (!choice?.startsWith("进入")) return;
		}

		enablePlanMode(ctx);
		ctx.ui.notify(`已自动进入 Plan 模式（复杂度 ${score}）`, "info");
	});

	// ── Plan 模式只读约束 ─────────────────────────────────────────────────

	pi.on("tool_call", async (event) => {
		if (!planState.enabled || event.toolName !== "bash") return;

		const command = event.input.command as string;
		if (!isSafeCommand(command)) {
			return {
				block: true,
				reason: `Plan 模式：命令不在只读白名单内，已阻止。\n命令: ${command}\n退出 plan 模式（/plan）后再执行。`,
			};
		}
	});

	// 非 plan 模式时过滤掉历史注入的 plan/exec 上下文
	pi.on("context", async (event) => {
		if (planState.enabled || planState.executing) return;

		return {
			messages: event.messages.filter((m) => {
				const msg = m as AgentMessage & { customType?: string };
				if (msg.customType === PLAN_CTX_TYPE || msg.customType === EXEC_CTX_TYPE) return false;
				if (msg.role !== "user") return true;

				const content = msg.content;
				if (typeof content === "string") {
					return !content.includes("[PLAN MODE ACTIVE]") && !content.includes("[EXECUTING PLAN]");
				}
				if (Array.isArray(content)) {
					return !content.some(
						(c) =>
							c.type === "text" &&
							((c as TextContent).text?.includes("[PLAN MODE ACTIVE]") ||
								(c as TextContent).text?.includes("[EXECUTING PLAN]")),
					);
				}
				return true;
			}),
		};
	});

	// ── 每轮注入 plan / 执行上下文 ────────────────────────────────────────

	pi.on("before_agent_start", async () => {
		if (planState.enabled) {
			return {
				message: {
					customType: PLAN_CTX_TYPE,
					content: `[PLAN MODE ACTIVE]
你现在处于 Plan 模式：只读调研 + 规划。不会修改任何文件。

限制：
- edit / write 工具已禁用，其他工具保留
- bash 仅允许只读命令（cat / grep / find / ls / git status 等）
- subagent 工具只允许调用 scout / planner 子代理（只读）；worker / reviewer 在执行阶段才能用

流程：
1. 先理解任务。如果对代码库不熟悉，用 subagent 工具并行派出多个 scout 子代理侦察
   （tasks: [{agent:"scout", task:"..."}, ...]），把关键上下文压缩回来。
2. 复杂任务可用 subagent 工具让 planner 子代理起草方案（chain: [{agent:"planner", task:"...{previous}..."}]）。
3. 产出规划，必须包含以下两个部分：

Plan:
1. 第一步（原子、可执行、写明涉及的文件）
2. 第二步
...

Subagent split:
- 可并行执行（worker 子代理并行）: 第 1、3 步
- 有依赖链（worker 链式）: 第 2 步 → 第 4 步
- 必须由你直接执行: 第 5 步（原因）

注意：
- 不要尝试做任何修改，只描述要做什么、怎么做。
- 子代理任务要自包含：给出文件路径、接口、验收标准，让 worker 不依赖你未提供的上下文。`,
					display: false,
				},
			};
		}

		if (planState.executing && planState.todos.length > 0) {
			const remaining = planState.todos.filter((t) => !t.completed);
			const todoList = remaining.map((t) => `${t.step}. ${t.text}`).join("\n");
			return {
				message: {
					customType: EXEC_CTX_TYPE,
					content: `[EXECUTING PLAN - 完整工具权限已恢复]

剩余步骤：
${todoList}

执行策略（按难度自动拆分 subagent）：
- 简单 / 快速步骤：直接执行。
- 复杂或批量步骤：用 subagent 工具拆分执行。
  - 相互独立的步骤 → tasks: [...] 并行派 worker 子代理（互不依赖，同时跑）
  - 有依赖关系的步骤 → chain: [...] 链式派 worker（用 {previous} 传递上一步输出）
  - 需要侦察 / 验证的 → scout / reviewer 子代理
- 子代理任务必须自包含：明确文件路径、改动目标、验收标准。
- 派完子代理后检查其结果是否符合验收标准，不符合就修复或补派。

每完成一步，在你的回复中带上 [DONE:n] 标记（n 为步骤号）。
全部完成后，如改动较大可派 reviewer 子代理复查，并给出总结。`,
					display: false,
				},
			};
		}
	});

	// ── 进度跟踪 ──────────────────────────────────────────────────────────

	pi.on("turn_end", async (event, ctx) => {
		if (!planState.executing || planState.todos.length === 0) return;
		if (!isAssistantMessage(event.message)) return;

		const text = getTextContent(event.message);
		if (markCompletedSteps(text, planState.todos) > 0) {
			updateStatus(ctx);
		}
		persistState();
	});

	// ── 计划生成后：执行 / 调整 / 停留 ────────────────────────────────────

	pi.on("agent_end", async (event, ctx) => {
		// 执行阶段完成检查
		if (planState.executing && planState.todos.length > 0) {
			if (planState.todos.every((t) => t.completed)) {
				const completedList = planState.todos.map((t) => `~~${t.text}~~`).join("\n");
				pi.sendMessage(
					{
						customType: "plan-complete",
						content: `**✅ Plan 全部完成！**\n\n${completedList}`,
						display: true,
					},
					{ triggerTurn: false },
				);
				planState.executing = false;
				planState.todos = [];
				updateStatus(ctx);
				persistState();
			}
			return;
		}

		if (!planState.enabled || !ctx.hasUI) return;

		// 从最后一条 assistant 消息提取 Plan: 步骤
		const lastAssistant = [...event.messages].reverse().find(isAssistantMessage);
		if (lastAssistant) {
			const extracted = extractTodoItems(getTextContent(lastAssistant));
			if (extracted.length > 0) {
				planState.todos = extracted;
			}
		}

		if (planState.todos.length === 0) return;
		persistState();

		const todoListText = planState.todos.map((t, i) => `${i + 1}. ☐ ${t.text}`).join("\n");
		const planTodoListMessage = {
			customType: "plan-todo-list",
			content: `**Plan 步骤 (${planState.todos.length})**\n\n${todoListText}`,
			display: true,
		};

		const choice = await ctx.ui.select("Plan 模式 - 下一步？", [
			"执行计划（按难度自动拆分 subagent）",
			"调整计划",
			"留在 Plan 模式",
		]);

		if (choice?.startsWith("执行")) {
			const firstTodoItem = planState.todos[0];
			if (!firstTodoItem) return;

			planState.enabled = false;
			planState.executing = true;
			restoreNormalModeTools();
			updateStatus(ctx);
			persistState();

			const remainingList = planState.todos.map((t) => `${t.step}. ${t.text}`).join("\n");
			const execMessage = `开始执行计划。\n\n剩余步骤：\n${remainingList}\n\n从第 1 步开始：${firstTodoItem.text}\n完成一步后，在回复中带上 [DONE:n] 标记。`;
			pi.sendMessage(planTodoListMessage, { deliverAs: "followUp" });
			pi.sendMessage(
				{ customType: EXEC_CTX_TYPE, content: execMessage, display: true },
				{ triggerTurn: true, deliverAs: "followUp" },
			);
		} else if (choice === "调整计划") {
			const refinement = await ctx.ui.editor("调整计划：", "");
			if (refinement?.trim()) {
				pi.sendMessage(planTodoListMessage, { deliverAs: "followUp" });
				pi.sendUserMessage(refinement.trim(), { deliverAs: "followUp" });
			}
		}
	});

	// ── 会话恢复 ──────────────────────────────────────────────────────────

	pi.on("session_start", async (_event, ctx) => {
		planState.config = loadConfig();

		if (pi.getFlag("plan") === true && !planState.enabled) {
			planState.enabled = true;
		}

		const entries = ctx.sessionManager.getEntries();

		const planModeEntry = entries
			.filter((e: { type: string; customType?: string }) => e.type === "custom" && e.customType === PLAN_STATE_TYPE)
			.pop() as { data?: PlanModeState } | undefined;

		if (planModeEntry?.data) {
			planState.enabled = planModeEntry.data.enabled ?? planState.enabled;
			planState.todos = planModeEntry.data.todos ?? planState.todos;
			planState.executing = planModeEntry.data.executing ?? planState.executing;
			planState.toolsBeforePlanMode =
				planModeEntry.data.toolsBeforePlanMode ?? planState.toolsBeforePlanMode;
		}

		// 恢复时重建完成状态：只扫最后一次 plan-mode-execute 之后的 assistant 消息
		const isResume = planModeEntry !== undefined;
		if (isResume && planState.executing && planState.todos.length > 0) {
			let executeIndex = -1;
			for (let i = entries.length - 1; i >= 0; i--) {
				const entry = entries[i] as { type: string; customType?: string };
				if (entry.customType === EXEC_CTX_TYPE) {
					executeIndex = i;
					break;
				}
			}

			const messages: AssistantMessage[] = [];
			for (let i = executeIndex + 1; i < entries.length; i++) {
				const entry = entries[i];
				if (entry.type === "message" && "message" in entry && isAssistantMessage(entry.message as AgentMessage)) {
					messages.push(entry.message as AssistantMessage);
				}
			}
			const allText = messages.map(getTextContent).join("\n");
			markCompletedSteps(allText, planState.todos);
		}

		if (planState.enabled) {
			enablePlanModeTools();
		}
		updateStatus(ctx);
	});

	pi.on("session_shutdown", () => {
		resetPlanState();
	});
}
