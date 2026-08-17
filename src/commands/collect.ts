import { writeFile } from "node:fs/promises";
import path from "node:path";
import { collectAttestation } from "../attestation.js";
import { readConfig } from "../config.js";
import { parseCollectArguments } from "./arguments.js";

export async function collectCommand(cwd: string, args: string[]): Promise<number> {
  const parsed = parseCollectArguments(args);
  if (!parsed) {
    console.error("Usage: agentattest collect --since <ref> [--output <path>]");
    return 1;
  }

  const config = await readConfig(cwd);
  const output = parsed.output ?? config.output;
  const attestation = await collectAttestation(cwd, parsed.since, { ...config, output });
  const target = path.resolve(cwd, output);

  await writeFile(target, `${JSON.stringify(attestation, null, 2)}\n`, "utf8");
  console.log(`Wrote ${path.relative(cwd, target) || target}`);

  const failed = attestation.verification.results.filter((result) => result.exitCode !== 0);
  if (failed.length > 0) {
    console.error(`${failed.length} verification command(s) failed`);
    return 1;
  }

  return 0;
}
