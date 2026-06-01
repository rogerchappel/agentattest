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
  const output = await git(["diff", "--name-status", "--find-renames", `${since}...HEAD`], cwd);
  if (!output) {
    return [];
  }

  const records: FileRecord[] = [];
  for (const line of output.split("\n")) {
    const parts = line.split("\t");
    const status = parts[0] ?? "";
    const filePath = parts[parts.length - 1];
    if (!filePath) {
      continue;
    }

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
