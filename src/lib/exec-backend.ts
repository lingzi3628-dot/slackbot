/**
 * SPYRO Exec Backend client — talks to the real execution service
 * running on the VPS (64.181.198.8:3003).
 *
 * This provides REAL command execution, code execution, git operations,
 * and file system access — no simulation.
 */

const EXEC_BACKEND_URL =
  process.env.NEXT_PUBLIC_EXEC_BACKEND_URL ||
  "http://64.181.198.8:3003";

export interface ExecResult {
  output: string;
  exitCode: number;
  error?: boolean;
}

export interface CodeResult {
  output: string;
  exitCode: number;
}

export interface GitCloneResult {
  output: string;
  success: boolean;
}

/** Check if the exec backend is available */
export async function isExecBackendAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${EXEC_BACKEND_URL}/health`, { cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}

/** Execute a real shell command on the VPS */
export async function executeCommand(command: string): Promise<ExecResult> {
  try {
    const res = await fetch(`${EXEC_BACKEND_URL}/execute`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ command }),
    });
    const data = await res.json();
    return {
      output: data.output || "",
      exitCode: data.exitCode ?? 0,
      error: data.error || false,
    };
  } catch (e) {
    return {
      output: `Connection error: ${e instanceof Error ? e.message : "Failed to connect to exec backend"}`,
      exitCode: 1,
      error: true,
    };
  }
}

/** Execute code (JS, Python, Bash) on the VPS */
export async function runCode(
  code: string,
  language: string,
  filename?: string
): Promise<CodeResult> {
  try {
    const res = await fetch(`${EXEC_BACKEND_URL}/run-code`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code, language, filename }),
    });
    const data = await res.json();
    return {
      output: data.output || "(no output)",
      exitCode: data.exitCode ?? 0,
    };
  } catch (e) {
    return {
      output: `Connection error: ${e instanceof Error ? e.message : "Failed"}`,
      exitCode: 1,
    };
  }
}

/** Clone a git repository on the VPS */
export async function gitClone(url: string): Promise<GitCloneResult> {
  try {
    const res = await fetch(`${EXEC_BACKEND_URL}/git-clone`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const data = await res.json();
    return {
      output: data.output || "",
      success: data.success || false,
    };
  } catch (e) {
    return {
      output: `Connection error: ${e instanceof Error ? e.message : "Failed"}`,
      success: false,
    };
  }
}

/** List files in the VPS workspace */
export async function listFiles(): Promise<string[]> {
  try {
    const res = await fetch(`${EXEC_BACKEND_URL}/files`, { cache: "no-store" });
    const data = await res.json();
    return data.files || [];
  } catch {
    return [];
  }
}

/** Read a file from the VPS workspace */
export async function readFile(filepath: string): Promise<string | null> {
  try {
    const res = await fetch(`${EXEC_BACKEND_URL}/file`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ path: filepath, action: "read" }),
    });
    const data = await res.json();
    return data.content || null;
  } catch {
    return null;
  }
}

/** Write a file to the VPS workspace */
export async function writeFile(filepath: string, content: string): Promise<boolean> {
  try {
    const res = await fetch(`${EXEC_BACKEND_URL}/file`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ path: filepath, content, action: "write" }),
    });
    const data = await res.json();
    return data.success || false;
  } catch {
    return false;
  }
}

export { EXEC_BACKEND_URL };
