/**
 * Task complexity heuristic used to auto-trigger plan mode.
 *
 * Pure functions, no pi imports — easy to tune or unit-test.
 * The score is a weighted sum of signals; tune `DEFAULT_AUTO_THRESHOLD`
 * (or the `threshold` field in `~/.pi/agent/plan-mode.json`) to taste.
 */

export interface ComplexityResult {
	score: number;
	reasons: string[];
}

const KEYWORDS_ZH = [
	"重构", "迁移", "架构", "设计", "方案", "复杂", "多文件", "模块",
	"子系统", "集成", "接入", "新增功能", "兼容", "扩展", "优化", "拆分",
	"改造", "升级", "落地", "实现",
];

const KEYWORDS_EN = [
	"refactor", "migrat", "architect", "redesign", "re-architect", "implement",
	"integrat", "multi-file", "multiple files", "complex", "complicated",
	"overhaul", "rewrite", "architecture", "schema",
];

const CONNECTORS_ZH = ["然后", "之后", "同时", "并且", "以及", "接着", "首先", "其次", "最后", "再"];
const CONNECTORS_EN = [
	" then ", " and then ", " afterwards ", " meanwhile ", " moreover ",
	" in addition ", " finally ", " step by step ", " after that ",
];

const REQUIREMENT_ZH = ["需要", "必须", "要求", "应该", "确保", "支持"];
const REQUIREMENT_EN = [" need ", " must ", " require ", " should ", " ensure ", " make sure ", " support "];

const VERBS_ZH = [
	"重构", "创建", "实现", "修改", "新增", "删除", "重命名", "移动", "修复",
	"构建", "编写", "设计", "迁移", "集成", "优化", "测试", "部署", "审查",
	"拆分", "添加", "改造", "升级",
];

const VERBS_EN = [
	"refactor", "create", "implement", "update", "modify", "add", "remove",
	"rename", "move", "fix", "build", "write", "design", "migrate", "integrate",
	"optimize", "test", "deploy", "review", "split", "restructure", "rewrite",
	"extend",
];

const PLAN_TRIGGER_ZH = ["做个计划", "做计划", "先计划", "规划一下", "方案设计", "计划一下"];
const PLAN_TRIGGER_EN = [" make a plan", " plan for ", " plan the ", " planning", " plan mode"];

const FILE_EXT_RE = /\.(ts|tsx|js|jsx|py|go|rs|java|c|cpp|h|hpp|rb|php|swift|kt|vue|css|scss|html|json|ya?ml|toml|sql|sh|md)\b/gi;

export function scoreComplexity(text: string): ComplexityResult {
	const reasons: string[] = [];
	let score = 0;

	const trimmed = text.trim();
	if (!trimmed) return { score: 0, reasons: [] };

	const lower = trimmed.toLowerCase();
	const words = trimmed.split(/\s+/).filter(Boolean).length;
	const lines = trimmed.split("\n").length;

	if (words > 120) {
		score += 4;
		reasons.push(`长文本(${words} 词)`);
	} else if (words > 60) {
		score += 2;
		reasons.push(`文本较长(${words} 词)`);
	}

	if (lines > 15) {
		score += 3;
		reasons.push(`${lines} 行`);
	} else if (lines > 5) {
		score += 1;
		reasons.push(`${lines} 行`);
	}

	// List-like requirements (bullets / numbered items)
	const listItems = (trimmed.match(/^\s*(?:[-*+]|\d+[.)])\s+/gm) || []).length;
	if (listItems >= 4) {
		score += 4;
		reasons.push(`${listItems} 条列表需求`);
	} else if (listItems >= 2) {
		score += 2;
		reasons.push(`${listItems} 条列表需求`);
	}

	// Clauses: many semicolons / periods / newlines in one prompt
	const clauses = (trimmed.match(/[；;。！？\n]/g) || []).length;
	if (clauses >= 8) {
		score += 2;
		reasons.push(`${clauses} 个分句`);
	} else if (clauses >= 4) {
		score += 1;
		reasons.push(`${clauses} 个分句`);
	}

	// Domain keywords
	const kwFound: string[] = [];
	for (const kw of KEYWORDS_ZH) if (trimmed.includes(kw)) kwFound.push(kw);
	for (const kw of KEYWORDS_EN) if (lower.includes(kw)) kwFound.push(kw);
	if (kwFound.length > 0) {
		score += Math.min(kwFound.length, 6);
		reasons.push(`关键词: ${[...new Set(kwFound)].slice(0, 5).join(",")}`);
	}

	// Sequence connectors → multi-step task
	let connHits = 0;
	for (const c of CONNECTORS_ZH) if (trimmed.includes(c)) connHits++;
	for (const c of CONNECTORS_EN) if (lower.includes(c)) connHits++;
	if (connHits >= 3) {
		score += 3;
		reasons.push("多步骤任务");
	} else if (connHits >= 1) {
		score += 2;
		reasons.push("含顺序步骤");
	}

	// Distinct action verbs → multiple things to do
	const verbHits = new Set<string>();
	for (const v of VERBS_ZH) if (trimmed.includes(v)) verbHits.add(v);
	for (const v of VERBS_EN) if (lower.includes(v)) verbHits.add(v);
	if (verbHits.size >= 4) {
		score += 2;
		reasons.push(`${verbHits.size} 个动作`);
	} else if (verbHits.size >= 2) {
		score += 1;
		reasons.push(`${verbHits.size} 个动作`);
	}

	// Requirement markers
	let reqHits = 0;
	for (const r of REQUIREMENT_ZH) if (trimmed.includes(r)) reqHits++;
	for (const r of REQUIREMENT_EN) if (lower.includes(r)) reqHits++;
	if (reqHits >= 3) {
		score += 2;
		reasons.push(`${reqHits} 处要求`);
	} else if (reqHits >= 1) {
		score += 1;
		reasons.push("含明确要求");
	}

	// Mentions of multiple files
	const fileMentions = (trimmed.match(FILE_EXT_RE) || []).length;
	if (fileMentions >= 3) {
		score += 3;
		reasons.push(`${fileMentions} 处文件提及`);
	} else if (fileMentions >= 2) {
		score += 2;
		reasons.push(`${fileMentions} 处文件提及`);
	}

	// Explicit plan request
	if (PLAN_TRIGGER_ZH.some((p) => trimmed.includes(p)) || PLAN_TRIGGER_EN.some((p) => lower.includes(p))) {
		score += 3;
		reasons.push("明确要求规划");
	}

	return { score, reasons };
}

export const DEFAULT_AUTO_THRESHOLD = 8;
