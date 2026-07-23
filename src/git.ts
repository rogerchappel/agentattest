import type { FileRecord, GitMetadata } from "./types.js";
import { git } from "./process.js";
import { hashFile } from "./hash.js";

export async function readGitMetadata(cwd: string, since: string): Promise<GitMetadata> {
  const [branch, headCommit, headCommitShort, remoteUrl] = await Promise.all([
    git(["rev-parse", "--abbrev-ref", "HEAD"], cwd),
    git(["rev-parse", "HEAD"], cwd),
    git(["rev-parse", "--short", "HEAD"], cwd),
    git(["config", "--get", "remote.origin.url"], cwd).catch(() => "")
  ]);

  return {
    branch,
    headCommit,
    headCommitShort,
    remoteUrl: remoteUrl || undefined,
    since
  };
}

export async function changedFilesSince(cwd: string, since: string): Promise<FileRecord[]> {
  const base = await git(["merge-base", since, "HEAD"], cwd);
  const [trackedOutput, untrackedOutput] = await Promise.all([
    git(["diff", "--name-status", "--find-renames", base], cwd),
    git(["ls-files", "--others", "--exclude-standard"], cwd)
  ]);

  const statuses = new Map<string, string>();
  for (const line of trackedOutput.split("\n")) {
    const parts = line.split("\t");
    const status = parts[0] ?? "";
    const filePath = parts[parts.length - 1];
    if (!filePath) {
      continue;
    }

    statuses.set(filePath, status);
  }

  for (const filePath of untrackedOutput.split("\n")) {
    if (filePath) {
      statuses.set(filePath, "A");
    }
  }

  const records: FileRecord[] = [];
  for (const [filePath, status] of statuses) {
    if (status.startsWith("D")) {
      records.push({
        path: filePath,
        sha256: "",
        sizeBytes: 0,
        status
      });
      continue;
    }

    records.push(await hashFile(cwd, filePath, status));
  }

  return records.sort((a, b) => a.path.localeCompare(b.path));
}
