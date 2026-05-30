import { agentAttestVersion } from "./index.js";
import type { AgentAttestation, AgentAttestConfig } from "./types.js";
import { changedFilesSince, readGitMetadata } from "./git.js";
import { runShellCommand } from "./process.js";

export async function collectAttestation(
  cwd: string,
  since: string,
  config: AgentAttestConfig
): Promise<AgentAttestation> {
  const [git, files] = await Promise.all([
    readGitMetadata(cwd, since),
    changedFilesSince(cwd, since)
  ]);
  const results = [];

  for (const command of config.verificationCommands) {
    results.push(await runShellCommand(command, cwd));
  }

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    tool: {
      name: "agentattest",
      version: agentAttestVersion
    },
    statement: "Local agent-assisted change receipt. This is not cryptographic supply-chain provenance.",
    git,
    environment: {
      node: process.version,
      platform: process.platform,
      arch: process.arch
    },
    files,
    verification: {
      commands: config.verificationCommands,
      results
    },
    caveats: [
      "Local JSON can be edited after generation.",
      "File hashes only prove the current workspace matches this receipt.",
      "No signing keys, remote transparency log, or tamper-proof storage are used."
    ]
  };
}
