/**
 * SPYRO V1 God Mode — multi-agent collaboration system.
 *
 * When God Mode is enabled, a user's prompt is processed by a TEAM of
 * specialized SPYRO agents, each using the best model for its role:
 *
 *   1. PLANNER (openai) — breaks the task into steps, assigns agents
 *   2. RESEARCHER (openai + web_search tool) — gathers information
 *   3. CODER (openai) — writes/executes code if needed
 *   4. SYNTHESIZER (openai) — combines everything into the final answer
 *
 * Each agent's output is fed to the next. Progress events stream to the UI
 * so the user sees the agents working in real time.
 */
import { getSpyroReply, type SpyroMessage, type SpyroModelId } from "./spyro-engine";
import { runTools, formatToolResults } from "./tools";

export interface GodModeStep {
  agent: string;
  model: string;
  status: "thinking" | "done" | "error";
  output?: string;
  icon: string;
}

export interface GodModeResult {
  steps: GodModeStep[];
  finalAnswer: string;
}

export interface GodModeOptions {
  onStep?: (step: GodModeStep) => void;
  signal?: AbortSignal;
}

const AGENTS = {
  planner: {
    name: "Planner",
    model: "openai" as SpyroModelId,
    icon: "🧠",
    systemPrompt: `You are the PLANNER agent of SPYRO V1 God Mode. Your job is to break down the user's request into a clear plan.
Output EXACTLY 3-5 numbered steps. Each step should be one sentence.
Do NOT solve the problem yourself — just plan how to approach it.
Format:
1. [Research] What to look up or gather
2. [Analyze] What to figure out
3. [Execute] What to produce
Keep it concise.`,
  },
  researcher: {
    name: "Researcher",
    model: "openai" as SpyroModelId,
    icon: "🔍",
    systemPrompt: `You are the RESEARCHER agent of SPYRO V1 God Mode. Using the plan and any web search results provided, gather the key information needed to answer the user's question.
Be thorough but concise. Summarize findings as bullet points.
If the information is already in the plan/context, just confirm it.
Focus on FACTS, not opinions.`,
  },
  coder: {
    name: "Coder",
    model: "openai" as SpyroModelId,
    icon: "💻",
    systemPrompt: `You are the CODER agent of SPYRO V1 God Mode. If the task requires code, write it. If not, explain why no code is needed.
When writing code:
- Use proper Markdown code blocks with language tags
- Keep it concise and well-commented
- If the user asked for HTML/CSS/JS, make it complete and runnable
If no code is needed, respond with: "No code required for this task."`,
  },
  synthesizer: {
    name: "Synthesizer",
    model: "openai" as SpyroModelId,
    icon: "⚡",
    systemPrompt: `You are the SYNTHESIZER agent of SPYRO V1 God Mode. You receive the plan, research, and code from the other agents.
Your job: produce the FINAL, polished answer to the user's original question.
- Combine the research findings and code into a coherent response
- Use clean Markdown (headings, lists, code blocks)
- Be comprehensive but not verbose
- Do NOT mention the other agents or that this is a multi-agent system — present the answer as SPYRO V1's response`,
  },
} as const;

/**
 * Run God Mode — multi-agent collaboration on a user prompt.
 * Returns progress steps + the final synthesized answer.
 */
export async function runGodMode(
  userPrompt: string,
  conversationHistory: SpyroMessage[],
  options: GodModeOptions = {}
): Promise<GodModeResult> {
  const steps: GodModeStep[] = [];
  const { onStep, signal } = options;

  // ── Step 1: PLANNER ────────────────────────────────────────────────
  const plannerStep: GodModeStep = {
    agent: AGENTS.planner.name,
    model: AGENTS.planner.model,
    status: "thinking",
    icon: AGENTS.planner.icon,
  };
  steps.push(plannerStep);
  onStep?.(plannerStep);

  let plan: string;
  try {
    plan = await getSpyroReply(
      [
        { role: "system", content: AGENTS.planner.systemPrompt },
        ...conversationHistory.slice(-4),
        { role: "user", content: userPrompt },
      ],
      { model: AGENTS.planner.model, traceName: "god-mode-planner", signal }
    );
  } catch (err) {
    plan = "1. Research the question\n2. Analyze findings\n3. Provide the answer";
  }

  steps[0].status = "done";
  steps[0].output = plan;
  onStep?.({ ...steps[0] });

  // ── Step 2: RESEARCHER (with web search tool) ──────────────────────
  const researcherStep: GodModeStep = {
    agent: AGENTS.researcher.name,
    model: AGENTS.researcher.model,
    status: "thinking",
    icon: AGENTS.researcher.icon,
  };
  steps.push(researcherStep);
  onStep?.(researcherStep);

  // Run web search tool if the prompt seems to need current info.
  const toolResults = await runTools(userPrompt);
  const toolContext = toolResults ? formatToolResults(toolResults) : "";

  let research: string;
  try {
    research = await getSpyroReply(
      [
        { role: "system", content: AGENTS.researcher.systemPrompt },
        { role: "user", content: `Plan:\n${plan}\n\n${toolContext ? `Web search results:\n${toolContext}\n\n` : ""}Original question: ${userPrompt}` },
      ],
      { model: AGENTS.researcher.model, traceName: "god-mode-researcher", signal }
    );
  } catch (err) {
    research = "Research unavailable — proceeding with available information.";
  }

  steps[1].status = "done";
  steps[1].output = research;
  onStep?.({ ...steps[1] });

  // ── Step 3: CODER ──────────────────────────────────────────────────
  const coderStep: GodModeStep = {
    agent: AGENTS.coder.name,
    model: AGENTS.coder.model,
    status: "thinking",
    icon: AGENTS.coder.icon,
  };
  steps.push(coderStep);
  onStep?.(coderStep);

  let code: string;
  try {
    code = await getSpyroReply(
      [
        { role: "system", content: AGENTS.coder.systemPrompt },
        { role: "user", content: `Plan:\n${plan}\n\nResearch:\n${research}\n\nOriginal question: ${userPrompt}` },
      ],
      { model: AGENTS.coder.model, traceName: "god-mode-coder", signal }
    );
  } catch (err) {
    code = "No code required for this task.";
  }

  steps[2].status = "done";
  steps[2].output = code;
  onStep?.({ ...steps[2] });

  // ── Step 4: SYNTHESIZER ────────────────────────────────────────────
  const synthStep: GodModeStep = {
    agent: AGENTS.synthesizer.name,
    model: AGENTS.synthesizer.model,
    status: "thinking",
    icon: AGENTS.synthesizer.icon,
  };
  steps.push(synthStep);
  onStep?.(synthStep);

  let finalAnswer: string;
  try {
    finalAnswer = await getSpyroReply(
      [
        { role: "system", content: AGENTS.synthesizer.systemPrompt },
        { role: "user", content: `Original question: ${userPrompt}\n\nPlan:\n${plan}\n\nResearch:\n${research}\n\nCode:\n${code}\n\nNow produce the final answer:` },
      ],
      { model: AGENTS.synthesizer.model, traceName: "god-mode-synth", signal }
    );
  } catch (err) {
    finalAnswer = `**SPYRO V1 God Mode encountered an error during synthesis.**\n\nHere's what the agents found:\n\n${research}\n\n${code}`;
  }

  steps[3].status = "done";
  steps[3].output = finalAnswer;
  onStep?.({ ...steps[3] });

  return { steps, finalAnswer };
}
