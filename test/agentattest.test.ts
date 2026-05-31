import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { test } from "node:test";
import { hashFile } from "../src/hash.js";
import { formatMarkdown } from "../src/commands/markdown.js";
import { readConfig, writeDefaultConfig } from "../src/config.js";
import { verifyAttestation } from "../src/verify.js";
import type { AgentAttestation } from "../src/types.js";

const execFileAsync = promisify(execFile);

test("default config is written once and can be read back", async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), "agentattest-config-"));

  const target = await writeDefaultConfig(workspace);
  await writeFile(target, JSON.stringify({ verificationCommands: ["npm test", "npm run check"], output: "receipt.json" }));

  const secondTarget = await writeDefaultConfig(workspace);
  const config = await readConfig(workspace);

  assert.equal(secondTarget, target);
  assert.deepEqual(config.verificationCommands, ["npm test", "npm run check"]);
  assert.equal(config.output, "receipt.json");
});

test("verifyAttestation detects matching and changed files", async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), "agentattest-verify-"));
  await writeFile(path.join(workspace, "README.md"), "# demo\n", "utf8");

  const file = await hashFile(workspace, "README.md", "M");
  const attestation = makeAttestation([file]);

  assert.deepEqual(await verifyAttestation(workspace, attestation), {
    ok: true,
    checked: 1,
    issues: []
  });

  await writeFile(path.join(workspace, "README.md"), "# changed\n", "utf8");
  const changed = await verifyAttestation(workspace, attestation);

  assert.equal(changed.ok, false);
  assert.equal(changed.issues[0]?.message, "sha256 mismatch");
});

test("markdown command renders a reviewable receipt", async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), "agentattest-markdown-"));
  await writeFile(path.join(workspace, "README.md"), "# demo\n", "utf8");
  const file = await hashFile(workspace, "README.md", "M");
  const attestation = makeAttestation([file]);
  const receiptPath = path.join(workspace, "agent-attestation.json");
  await writeFile(receiptPath, `${JSON.stringify(attestation, null, 2)}\n`, "utf8");

  const markdown = formatMarkdown(attestation, true);
  assert.match(markdown, /# AgentAttest Receipt/);
  assert.match(markdown, /Workspace matches receipt: yes/);

  const { stdout } = await execFileAsync("node", [path.resolve("dist/src/cli.js"), "markdown", receiptPath], {
    cwd: workspace
  });

  assert.match(stdout, /README\.md/);
  assert.match(stdout, /Verification/);
});

test("CLI help advertises implemented commands", async () => {
  const { stdout } = await execFileAsync("node", ["dist/src/cli.js", "--help"]);

  assert.match(stdout, /agentattest collect --since <ref>/);
  assert.match(stdout, /agentattest markdown <agent-attestation\.json>/);
});

function makeAttestation(files: AgentAttestation["files"]): AgentAttestation {
  return {
    schemaVersion: 1,
    generatedAt: "2026-05-31T00:00:00.000Z",
    tool: {
      name: "agentattest",
      version: "0.1.0"
    },
    statement: "Local agent-assisted change receipt. This is not cryptographic supply-chain provenance.",
    git: {
      branch: "main",
      headCommit: "abc123",
      headCommitShort: "abc123",
      since: "HEAD~1"
    },
    environment: {
      node: process.version,
      platform: process.platform,
      arch: process.arch
    },
    files,
    verification: {
      commands: ["npm test"],
      results: [
        {
          command: "npm test",
          exitCode: 0,
          durationMs: 12,
          stdout: "",
          stderr: ""
        }
      ]
    },
    caveats: ["Local JSON can be edited after generation."]
  };
}
