import path from "node:path";
import { configExists, writeDefaultConfig } from "../config.js";
import { parseInitArguments } from "./arguments.js";

export async function initCommand(cwd: string, args: string[]): Promise<number> {
  const parsed = parseInitArguments(args);
  if (!parsed) {
    console.error("Usage: agentattest init [--force]");
    return 1;
  }
  const overwrite = parsed.force;
  const existed = await configExists(cwd);
  const target = await writeDefaultConfig(cwd, overwrite);
  const displayPath = path.relative(cwd, target) || target;

  if (existed && !overwrite) {
    console.log(`${displayPath} already exists`);
    return 0;
  }

  console.log(`Wrote ${displayPath}`);
  return 0;
}
