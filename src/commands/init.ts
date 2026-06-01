import path from "node:path";
import { configExists, writeDefaultConfig } from "../config.js";

export async function initCommand(cwd: string, args: string[]): Promise<number> {
  const overwrite = args.includes("--force");
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
