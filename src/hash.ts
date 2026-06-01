import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import type { FileRecord } from "./types.js";

export async function hashFile(cwd: string, relativePath: string, status: string): Promise<FileRecord> {
  const target = path.join(cwd, relativePath);
  const [contents, stats] = await Promise.all([
    readFile(target),
    stat(target)
  ]);

  return {
    path: relativePath,
    sha256: createHash("sha256").update(contents).digest("hex"),
    sizeBytes: stats.size,
    status
  };
}
