// opencode-usage.ts
//
// /usage — 查询 OpenCode Go 套餐当前用量限额
//
// 直接调用 opencode 官方用量接口 https://opencode.ai/zen/go/v1/usage，
// 命令由 pi 的扩展命令机制同步执行，不经过 LLM（零 token 消耗）。
// 结果以自定义 entry 渲染成聊天区内置卡片，可 /reload 热更新。
//
// 用法：
//   /usage                       在聊天区渲染用量卡片（endpoint 自动推导）
//   /usage <url>                 指定 endpoint 查询（例如自建代理网关）
// 环境变量：
//   OPENCODE_USAGE_URL          覆盖 endpoint（优先级高于 provider 推导）
import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import { Box, Text } from "@earendil-works/pi-tui";

const PROVIDER_ID = "opencode-go";
const DEFAULT_USAGE_URL = "https://opencode.ai/zen/go/v1/usage";
const ENTRY_TYPE = "opencode-usage";

const WINDOW_LABELS: Record<string, string> = {
  rolling: "Rolling",
  weekly: "Weekly",
  monthly: "Monthly",
};
const WINDOW_ORDER = ["rolling", "weekly", "monthly"];

interface UsageWindow {
  status?: string;
  percent?: number; // 0..1
  resetsAt?: string;
}

interface UsageReportData {
  fetchedAt: number;
  endpoint?: string;
  windows?: Record<string, UsageWindow>;
  error?: string;
}

// 优先通过 pi 的 model registry 动态解析 opencode-go 的 API key，
// 解析不到时回退到 ~/.pi/agent/models.json 里的自定义 provider 配置。
async function resolveApiKey(ctx: ExtensionCommandContext): Promise<string | undefined> {
  try {
    const registry = ctx.modelRegistry as {
      getProviderAuth?: (id: string) => unknown | Promise<unknown>;
    };
    if (registry && typeof registry.getProviderAuth === "function") {
      const auth = (await registry.getProviderAuth(PROVIDER_ID)) as {
        apiKey?: string;
        key?: string;
      } | null;
      const key = auth && (auth.apiKey ?? auth.key);
      if (typeof key === "string" && key.length > 0) return key;
    }
  } catch {
    // fall through to models.json
  }
  try {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const { homedir } = await import("node:os");
    const cfg = JSON.parse(readFileSync(join(homedir(), ".pi", "agent", "models.json"), "utf8"));
    const key = cfg?.providers?.[PROVIDER_ID]?.apiKey;
    if (typeof key === "string" && key.length > 0) return key;
  } catch {
    // give up
  }
  return undefined;
}

async function fetchUsage(key: string, url: string): Promise<UsageReportData> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    const body = (await res.text()).slice(0, 200);
    throw new Error(`HTTP ${res.status}${body ? `: ${body}` : ""}`);
  }
  const json = (await res.json()) as { usage?: Record<string, UsageWindow> };
  return { fetchedAt: Date.now(), endpoint: url, windows: json.usage ?? {} };
}

// endpoint 解析优先级：
//   1. /usage 命令参数
//   2. OPENCODE_USAGE_URL 环境变量
//   3. provider 解析出的 baseUrl（如 models.json 里改过可自动跟随）
//   4. 官方默认地址
async function resolveEndpoint(
  ctx: ExtensionCommandContext,
  explicitArg?: string
): Promise<string> {
  const fromArg = explicitArg?.trim();
  if (fromArg) return fromArg;
  const fromEnv = process.env.OPENCODE_USAGE_URL?.trim();
  if (fromEnv) return fromEnv;
  try {
    const registry = ctx.modelRegistry as {
      getProviderAuth?: (id: string) => unknown | Promise<unknown>;
    };
    if (registry && typeof registry.getProviderAuth === "function") {
      const auth = (await registry.getProviderAuth(PROVIDER_ID)) as { baseUrl?: string } | null;
      if (auth?.baseUrl) return `${auth.baseUrl.replace(/\/+$/, "")}/usage`;
    }
  } catch {
    // fall through to default
  }
  return DEFAULT_USAGE_URL;
}

function pct(w?: UsageWindow): number {
  return Math.round((w?.percent ?? 0) * 100);
}

function bar(pct: number): string {
  const filled = Math.max(0, Math.min(10, Math.round(pct / 10)));
  return "█".repeat(filled) + "░".repeat(10 - filled);
}

function oneLineSummary(data: UsageReportData): string {
  if (data.error) return `查询失败: ${data.error}`;
  return WINDOW_ORDER.map((k) => `${WINDOW_LABELS[k] ?? k} ${pct(data.windows?.[k])}%`).join(" / ");
}

export default function (pi: ExtensionAPI) {
  pi.registerEntryRenderer<UsageReportData>(ENTRY_TYPE, (entry, _opts, theme) => {
    const d = entry.data ?? { fetchedAt: Date.now() };
    const box = new Box(1, 1, (text) => theme.bg("customMessageBg", text));
    box.addChild(new Text(theme.fg("accent", "OpenCode Go 套餐用量"), 0, 0));

    if (d.error) {
      box.addChild(new Text(theme.fg("error", `✗ ${d.error}`), 0, 0));
    } else {
      const windows = d.windows ?? {};
      for (const key of WINDOW_ORDER) {
        const w = windows[key];
        const label = (WINDOW_LABELS[key] ?? key).padEnd(8, " ");
        const p = pct(w);
        const color = p >= 90 ? "error" : p >= 70 ? "warning" : p >= 50 ? "text" : "success";
        const status = (w?.status ?? "?").padEnd(4, " ");
        const reset = w?.resetsAt ? `重置 ${new Date(w.resetsAt).toLocaleString()}` : "";
        box.addChild(
          new Text(
            `${theme.fg("text", label)} ${theme.fg(color, bar(p))} ${theme.fg(color, `${String(p).padStart(3)}%`)} ${status}${theme.fg("dim", ` ${reset}`)}`,
            0,
            0
          )
        );
      }
    }
    if (d.endpoint && d.endpoint !== DEFAULT_USAGE_URL) {
      box.addChild(new Text(theme.fg("dim", `endpoint: ${d.endpoint}`), 0, 0));
    }
    box.addChild(new Text(theme.fg("dim", "输入 /usage 可随时刷新"), 0, 0));
    return box;
  });

  pi.registerCommand("usage", {
    description: "查询 OpenCode Go 套餐当前用量限额",
    getArgumentCompletions: () =>
      process.env.OPENCODE_USAGE_URL
        ? null
        : [{ value: "https://", label: "自定义 usage endpoint" }],
    handler: async (args, ctx) => {
      const endpoint = await resolveEndpoint(ctx, args);
      let data: UsageReportData;
      try {
        const key = await resolveApiKey(ctx);
        if (!key) {
          throw new Error("未找到 opencode-go 的 API key（检查 models.json / auth.json）");
        }
        data = await fetchUsage(key, endpoint);
      } catch (err) {
        data = {
          fetchedAt: Date.now(),
          endpoint,
          error: err instanceof Error ? err.message : String(err),
        };
      }
      pi.appendEntry<UsageReportData>(ENTRY_TYPE, data);
      if (ctx.hasUI) {
        ctx.ui.notify(`OpenCode Go 用量: ${oneLineSummary(data)}`, data.error ? "error" : "info");
      }
    },
  });
}