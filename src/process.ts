import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { CommandResult } from "./types.js";

const execFileAsync = promisify(execFile);

export async function git(args: string[], cwd: string): Promise<string> {
  const { stdout } = await execFileAsync("git", args, {
    cwd,
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024
  });
  return stdout.trim();
}

export async function runShellCommand(command: string, cwd: string): Promise<CommandResult> {
  const started = Date.now();

  try {
    const { stdout, stderr } = await execFileAsync(command, {
      cwd,
      encoding: "utf8",
      shell: true,
      maxBuffer: 10 * 1024 * 1024
    });
    return {
      command,
      exitCode: 0,
      durationMs: Date.now() - started,
      stdout,
      stderr
    };
  } catch (error: unknown) {
    const failure = error as {
      code?: number | null;
      stdout?: string;
      stderr?: string;
    };
    return {
      command,
      exitCode: typeof failure.code === "number" ? failure.code : null,
      durationMs: Date.now() - started,
      stdout: failure.stdout ?? "",
      stderr: failure.stderr ?? String(error)
    };
  }
}
