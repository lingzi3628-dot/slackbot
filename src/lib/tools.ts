/**
 * SPYRO V1 Tool-calling system — lightweight agent loop.
 *
 * Before generating a reply, SPYRO checks if the user's message would
 * benefit from a tool (web search, calculator, image generation). If so,
 * the tool executes and its output is injected into the context.
 *
 * This is a simplified LangChain-style agent: intent detection → tool
 * execution → context injection → final LLM response.
 */

export interface ToolResult {
  tool: string;
  query: string;
  result: string;
}

export interface SpyroTool {
  name: string;
  description: string;
  /** Returns true if this tool should be used for the given user message. */
  shouldUse: (userMessage: string) => boolean;
  /** Execute the tool and return a string result to inject as context. */
  execute: (userMessage: string) => Promise<string>;
}

// ── Web Search Tool ──────────────────────────────────────────────────
const webSearchTool: SpyroTool = {
  name: "web_search",
  description: "Search the web for current information",
  shouldUse: (msg) => {
    const lower = msg.toLowerCase();
    // Detect current-events / factual queries that need live data.
    const triggers = [
      "latest", "recent", "today", "yesterday", "this week", "this month",
      "current", "now", "news", "update", "2025", "2026",
      "who won", "what happened", "stock", "price of", "weather",
      "score", "result of", "release date",
    ];
    return triggers.some((t) => lower.includes(t));
  },
  execute: async (query) => {
    try {
      const ZAI = (await import("z-ai-web-dev-sdk")).default;
      const zai = await ZAI.create();
      const results = await zai.functions.invoke("web_search", {
        query: query.slice(0, 200),
        num: 5,
      });
      if (!Array.isArray(results) || results.length === 0) return "";
      return results
        .map(
          (r: { name: string; url: string; snippet: string }, i: number) =>
            `[${i + 1}] ${r.name}\n${r.snippet}\nURL: ${r.url}`
        )
        .join("\n\n");
    } catch {
      return "";
    }
  },
};

// ── Calculator Tool ──────────────────────────────────────────────────
const calculatorTool: SpyroTool = {
  name: "calculator",
  description: "Evaluate a mathematical expression",
  shouldUse: (msg) => {
    // Detect math expressions: numbers + operators, "calculate", "what is X times Y"
    const lower = msg.toLowerCase();
    if (/(calculate|what is|compute|solve)\s.+[\d+\-*/×÷^()]/i.test(lower)) return true;
    // Pure math expression
    if (/^[\d\s+\-*/().×÷^%]+$/.test(msg.trim()) && /\d/.test(msg) && /[+\-*/×÷^]/.test(msg)) return true;
    return false;
  },
  execute: async (expr) => {
    try {
      // Extract the mathematical expression from the user's message.
      const cleaned = expr
        .replace(/^(calculate|what is|compute|solve|what's|how much is)\s+/i, "")
        .replace(/\?/g, "")
        .replace(/×/g, "*")
        .replace(/÷/g, "/")
        .replace(/\^/g, "**")
        .trim();
      // Safe eval — only allow numbers, operators, parentheses, Math functions.
      if (!/^[\d\s+\-*/().%]+|Math\./.test(cleaned)) {
        return `Could not parse expression: ${cleaned}`;
      }
      // Safe eval via Function constructor (only numbers + operators allowed by the regex above)
      const result = Function(`"use strict"; return (${cleaned})`)();
      return `Calculator result: ${cleaned} = ${result}`;
    } catch {
      return `Could not calculate: ${expr}`;
    }
  },
};

// ── All registered tools ─────────────────────────────────────────────
const TOOLS: SpyroTool[] = [webSearchTool, calculatorTool];

/**
 * Run the agent loop: check if any tools should be used, execute them,
 * and return a system message with the results to inject into context.
 *
 * Returns null if no tools are needed.
 */
export async function runTools(userMessage: string): Promise<ToolResult[] | null> {
  const results: ToolResult[] = [];

  for (const tool of TOOLS) {
    if (tool.shouldUse(userMessage)) {
      const result = await tool.execute(userMessage);
      if (result) {
        results.push({ tool: tool.name, query: userMessage, result });
      }
    }
  }

  return results.length > 0 ? results : null;
}

/** Format tool results as a system message for context injection. */
export function formatToolResults(results: ToolResult[]): string {
  return results
    .map(
      (r) =>
        `[Tool: ${r.tool}]\nQuery: ${r.query}\nResult:\n${r.result}`
    )
    .join("\n\n---\n\n");
}
