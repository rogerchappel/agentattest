#!/usr/bin/env node

import { agentAttestVersion } from "./index.js";
import { collectCommand } from "./commands/collect.js";
import { initCommand } from "./commands/init.js";
import { markdownCommand } from "./commands/markdown.js";
import { verifyCommand } from "./commands/verify.js";
import { realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function helpText(): string {
  return `agentattest ${agentAttestVersion}

Usage:
  agentattest init [--force]
  agentattest collect --since <ref> [--output <path>]
  agentattest verify <agent-attestation.json>
  agentattest markdown <agent-attestation.json>

Each command rejects unknown options and unexpected arguments with a usage error.

Local-first provenance receipts for agent-assisted git changes.
The collect output file is excluded from its own file inventory.`;
}

export async function main(argv = process.argv.slice(2)): Promise<number> {
  if (argv.includes("--help") || argv.includes("-h") || argv.length === 0) {
    console.log(helpText());
    return 0;
  }

  const [command, ...args] = argv;
  if (command === "init") {
    return initCommand(process.cwd(), args);
  }
  if (command === "collect") {
    return collectCommand(process.cwd(), args);
  }
  if (command === "verify") {
    return verifyCommand(process.cwd(), args);
  }
  if (command === "markdown") {
    return markdownCommand(process.cwd(), args);
  }

  console.error(`Unknown command: ${command}`);
  console.error(helpText());
  return 1;
}

export function isMainModule(moduleUrl: string, executablePath: string | undefined): boolean {
  if (!executablePath) {
    return false;
  }

  try {
    return realpathSync(fileURLToPath(moduleUrl)) === realpathSync(path.resolve(executablePath));
  } catch {
    return fileURLToPath(moduleUrl) === path.resolve(executablePath);
  }
}

if (isMainModule(import.meta.url, process.argv[1])) {
  main().then((code) => {
    process.exitCode = code;
  }).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
