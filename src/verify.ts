import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { hashFile } from "./hash.js";
import { changedFilesSince } from "./git.js";
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

export async function verifyAttestation(
  cwd: string,
  attestation: AgentAttestation,
  excludedPaths: ReadonlySet<string> = new Set()
): Promise<VerificationReport> {
  const issues: VerificationIssue[] = [];
  const currentFiles = await changedFilesSince(cwd, attestation.git.since, excludedPaths);
  const recordedByPath = new Map(attestation.files.map((file) => [file.path, file]));
  const currentByPath = new Map(currentFiles.map((file) => [file.path, file]));

  for (const file of currentFiles) {
    const recorded = recordedByPath.get(file.path);
    if (!recorded) {
      issues.push({ path: file.path, message: `new workspace change (${file.status})` });
    } else if (recorded.status !== file.status) {
      issues.push({ path: file.path, message: `status changed from ${recorded.status} to ${file.status}` });
    }
  }

  for (const file of attestation.files) {
    if (!currentByPath.has(file.path)) {
      issues.push({ path: file.path, message: `recorded workspace change is absent (${file.status})` });
    }
  }

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
