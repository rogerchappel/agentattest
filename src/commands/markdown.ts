import path from "node:path";
import { readAttestation, verifyAttestation } from "../verify.js";
import type { AgentAttestation, CommandResult, FileRecord } from "../types.js";
import { parseReceiptPath } from "./arguments.js";

export async function markdownCommand(cwd: string, args: string[]): Promise<number> {
  const attestationPath = parseReceiptPath(args);
  if (!attestationPath) {
    console.error("Usage: agentattest markdown <agent-attestation.json>");
    return 1;
  }

  const absolutePath = path.resolve(cwd, attestationPath);
  const attestation = await readAttestation(absolutePath);
  const relativePath = path.relative(cwd, absolutePath);
  const excludedPaths = !relativePath || relativePath === ".." || relativePath.startsWith(`..${path.sep}`)
    ? new Set<string>()
    : new Set([relativePath.split(path.sep).join("/")]);
  const report = await verifyAttestation(cwd, attestation, excludedPaths);

  console.log(formatMarkdown(attestation, report.ok));
  return report.ok ? 0 : 1;
}

export function formatMarkdown(attestation: AgentAttestation, workspaceMatches = true): string {
  const failedCommands = attestation.verification.results.filter((result) => result.exitCode !== 0);
  const lines = [
    "# AgentAttest Receipt",
    "",
    `- Tool: ${attestation.tool.name} ${attestation.tool.version}`,
    `- Generated: ${attestation.generatedAt}`,
    `- Branch: ${attestation.git.branch}`,
    `- Commit: ${attestation.git.headCommitShort}`,
    `- Since: ${attestation.git.since}`,
    `- Workspace matches receipt: ${workspaceMatches ? "yes" : "no"}`,
    `- Files recorded: ${attestation.files.length}`,
    `- Verification commands: ${attestation.verification.results.length}`,
    `- Failed verification commands: ${failedCommands.length}`,
    "",
    "## Files",
    "",
    ...formatFiles(attestation.files),
    "",
    "## Verification",
    "",
    ...formatCommands(attestation.verification.results),
    "",
    "## Caveats",
    "",
    ...attestation.caveats.map((caveat) => `- ${caveat}`),
    ""
  ];

  return `${lines.join("\n")}`;
}

function formatFiles(files: FileRecord[]): string[] {
  if (files.length === 0) {
    return ["No files recorded."];
  }

  return files.map((file) => `- ${file.status} ${file.path} (${file.sizeBytes} bytes, ${file.sha256 || "deleted"})`);
}

function formatCommands(results: CommandResult[]): string[] {
  if (results.length === 0) {
    return ["No verification commands recorded."];
  }

  return results.map((result) => {
    const exitCode = result.exitCode === null ? "unknown" : String(result.exitCode);
    return `- \`${result.command}\` exited ${exitCode} in ${result.durationMs}ms`;
  });
}
