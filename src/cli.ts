#!/usr/bin/env node

import { agentAttestVersion } from "./index.js";
import { initCommand } from "./commands/init.js";

export function helpText(): string {
  return `agentattest ${agentAttestVersion}

Usage:
  agentattest init
  agentattest collect --since <ref>
  agentattest verify <agent-attestation.json>
  agentattest markdown <agent-attestation.json>

Local-first provenance receipts for agent-assisted git changes.`;
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

  console.error(`Unknown command: ${command}`);
  console.error(helpText());
  return 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().then((code) => {
    process.exitCode = code;
  }).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
