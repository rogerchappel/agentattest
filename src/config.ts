import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AgentAttestConfig } from "./types.js";

export const configFileName = ".agentattest.json";

export const defaultConfig: AgentAttestConfig = {
  verificationCommands: ["npm test"],
  output: "agent-attestation.json"
};

export async function configExists(cwd: string): Promise<boolean> {
  try {
    await access(path.join(cwd, configFileName));
    return true;
  } catch {
    return false;
  }
}

export async function writeDefaultConfig(cwd: string, overwrite = false): Promise<string> {
  const target = path.join(cwd, configFileName);
  if (!overwrite && await configExists(cwd)) {
    return target;
  }

  await writeFile(target, `${JSON.stringify(defaultConfig, null, 2)}\n`, "utf8");
  return target;
}

export async function readConfig(cwd: string): Promise<AgentAttestConfig> {
  if (!await configExists(cwd)) {
    return defaultConfig;
  }

  const raw = await readFile(path.join(cwd, configFileName), "utf8");
  const parsed = JSON.parse(raw) as Partial<AgentAttestConfig>;
  return {
    verificationCommands: Array.isArray(parsed.verificationCommands)
      ? parsed.verificationCommands.map(String)
      : defaultConfig.verificationCommands,
    output: typeof parsed.output === "string" ? parsed.output : defaultConfig.output
  };
}
