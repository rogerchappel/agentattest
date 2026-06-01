import { writeFile } from "node:fs/promises";
import path from "node:path";
import { collectAttestation } from "../attestation.js";
import { readConfig } from "../config.js";

function valueAfter(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

export async function collectCommand(cwd: string, args: string[]): Promise<number> {
  const since = valueAfter(args, "--since");
  if (!since) {
    console.error("Missing required --since <ref>");
    return 1;
  }

  const outputArg = valueAfter(args, "--output");
  const config = await readConfig(cwd);
  const output = outputArg ?? config.output;
  const attestation = await collectAttestation(cwd, since, config);
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
