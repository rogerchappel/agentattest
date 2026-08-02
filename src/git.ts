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

export async function changedFilesSince(
  cwd: string,
  since: string,
  excludedPaths: ReadonlySet<string> = new Set()
): Promise<FileRecord[]> {
  const base = await git(["merge-base", since, "HEAD"], cwd);
  const [trackedOutput, untrackedOutput] = await Promise.all([
    git(["diff", "--name-status", "--find-renames", "-z", base], cwd),
    git(["ls-files", "--others", "--exclude-standard", "-z"], cwd)
  ]);

  const statuses = new Map<string, string>();
  const trackedFields = splitNulFields(trackedOutput);
  for (let index = 0; index < trackedFields.length;) {
    const status = trackedFields[index++];
    const sourcePath = trackedFields[index++];
    const filePath = status?.startsWith("R") || status?.startsWith("C")
      ? trackedFields[index++]
      : sourcePath;

    if (!status || sourcePath === undefined || filePath === undefined) {
      throw new Error("Unexpected NUL-delimited output from git diff --name-status");
    }

    statuses.set(filePath, status);
  }

  for (const filePath of splitNulFields(untrackedOutput)) {
    statuses.set(filePath, "A");
  }

  const records: FileRecord[] = [];
  for (const [filePath, status] of statuses) {
    if (excludedPaths.has(filePath)) {
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

function splitNulFields(output: string): string[] {
  if (!output) {
    return [];
  }

  const fields = output.split("\0");
  if (fields.pop() !== "") {
    throw new Error("Unexpected unterminated NUL-delimited Git output");
  }
  return fields;
}
