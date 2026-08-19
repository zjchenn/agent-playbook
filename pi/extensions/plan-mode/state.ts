/**
 * Shared mutable state for the plan-mode extension.
 *
 * Both `index.ts` (plan mode lifecycle) and `subagent.ts` (delegation tool)
 * import this module so the subagent tool can enforce plan-mode rules
 * (e.g. only scout/planner agents may run while plan mode is read-only).
 */

import type { TodoItem } from "./utils.ts";

export interface PlanModeConfig {
	/** Automatically propose plan mode when a complex task is detected. */
	autoTrigger: boolean;
	/** Complexity score at or above which auto-trigger fires. Higher = less trigger-happy. */
	threshold: number;
	/** In TUI mode, ask the user before auto-enabling plan mode. */
	requireConfirmation: boolean;
}

export const DEFAULT_CONFIG: PlanModeConfig = {
	autoTrigger: true,
	threshold: 8,
	requireConfirmation: true,
};

export const planState = {
	enabled: false,
	executing: false,
	todos: [] as TodoItem[],
	toolsBeforePlanMode: undefined as string[] | undefined,
	config: { ...DEFAULT_CONFIG },
};

export function resetPlanState(): void {
	planState.enabled = false;
	planState.executing = false;
	planState.todos = [];
	planState.toolsBeforePlanMode = undefined;
}
