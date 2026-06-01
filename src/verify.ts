import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { hashFile } from "./hash.js";
import type { AgentAttestation, FileRecord } from "./types.js";

export type VerificationIssue = {
  path: string;
  message: string;
};

export type VerificationReport = {
  ok: boolean;
  checked: number;
  issues: VerificationIssue[];
};

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function verifyFile(cwd: string, file: FileRecord): Promise<VerificationIssue | undefined> {
  const target = path.join(cwd, file.path);
  const present = await exists(target);

  if (file.status.startsWith("D")) {
    return present ? { path: file.path, message: "expected deleted file to be absent" } : undefined;
  }

  if (!present) {
    return { path: file.path, message: "file is missing" };
  }

  const current = await hashFile(cwd, file.path, file.status);
  if (current.sha256 !== file.sha256) {
    return { path: file.path, message: "sha256 mismatch" };
  }

  if (current.sizeBytes !== file.sizeBytes) {
    return { path: file.path, message: "size mismatch" };
  }

  return undefined;
}

export async function readAttestation(filePath: string): Promise<AgentAttestation> {
  return JSON.parse(await readFile(filePath, "utf8")) as AgentAttestation;
}

export async function verifyAttestation(cwd: string, attestation: AgentAttestation): Promise<VerificationReport> {
  const issues: VerificationIssue[] = [];

  for (const file of attestation.files) {
    const issue = await verifyFile(cwd, file);
    if (issue) {
      issues.push(issue);
    }
  }

  return {
    ok: issues.length === 0,
    checked: attestation.files.length,
    issues
  };
}
