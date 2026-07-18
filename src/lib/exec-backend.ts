/**
 * SPYRO Exec Backend client — talks to the VPS execution service
 * through Next.js API route proxies (avoids CORS / mixed-content issues).
 *
 * The browser calls /api/studio/* (same origin) which proxies to the
 * VPS backend at http://64.181.198.8:3003.
 */

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
    const res = await fetch("/api/studio/exec", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ command: "echo ok" }),
    });
    const data = await res.json();
    return res.ok && !data.error;
  } catch {
    return false;
  }
}

/** Execute a real shell command on the VPS */
export async function executeCommand(command: string): Promise<ExecResult> {
  try {
    const res = await fetch("/api/studio/exec", {
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
      output: `Connection error: ${e instanceof Error ? e.message : "Failed to connect"}`,
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
    const res = await fetch("/api/studio/run-code", {
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
    const res = await fetch("/api/studio/git-clone", {
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
    const res = await fetch("/api/studio/files", { cache: "no-store" });
    const data = await res.json();
    return data.files || [];
  } catch {
    return [];
  }
}

/** Read a file from the VPS workspace */
export async function readFile(filepath: string): Promise<string | null> {
  try {
    const res = await fetch("/api/studio/file", {
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
    const res = await fetch("/api/studio/file", {
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
