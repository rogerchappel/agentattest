import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { collectAttestation } from "../src/attestation.js";
import { hashFile } from "../src/hash.js";
import { formatMarkdown } from "../src/commands/markdown.js";
import { readConfig, writeDefaultConfig } from "../src/config.js";
import { verifyAttestation } from "../src/verify.js";
import type { AgentAttestation } from "../src/types.js";

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const cliPath = path.join(repoRoot, "dist/src/cli.js");

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
  await writeFile(path.join(workspace, "README.md"), "# original\n", "utf8");
  await git(workspace, ["init", "-b", "main"]);
  await git(workspace, ["config", "user.email", "agentattest@example.com"]);
  await git(workspace, ["config", "user.name", "AgentAttest Test"]);
  await git(workspace, ["add", "."]);
  await git(workspace, ["commit", "-m", "initial"]);
  await writeFile(path.join(workspace, "README.md"), "# demo\n", "utf8");

  const file = await hashFile(workspace, "README.md", "M");
  const attestation = makeAttestation([file], "HEAD");

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
  await writeFile(path.join(workspace, "README.md"), "# original\n", "utf8");
  await git(workspace, ["init", "-b", "main"]);
  await git(workspace, ["config", "user.email", "agentattest@example.com"]);
  await git(workspace, ["config", "user.name", "AgentAttest Test"]);
  await git(workspace, ["add", "."]);
  await git(workspace, ["commit", "-m", "initial"]);
  await writeFile(path.join(workspace, "README.md"), "# demo\n", "utf8");
  const file = await hashFile(workspace, "README.md", "M");
  const attestation = makeAttestation([file], "HEAD");
  const receiptPath = path.join(workspace, "agent-attestation.json");
  await writeFile(receiptPath, `${JSON.stringify(attestation, null, 2)}\n`, "utf8");

  const markdown = formatMarkdown(attestation, true);
  assert.match(markdown, /# AgentAttest Receipt/);
  assert.match(markdown, /Workspace matches receipt: yes/);

  const { stdout } = await execFileAsync("node", [cliPath, "markdown", receiptPath], {
    cwd: workspace
  });

  assert.match(stdout, /README\.md/);
  assert.match(stdout, /Verification/);
});

test("CLI help advertises implemented commands", async () => {
  const { stdout } = await execFileAsync("node", [cliPath, "--help"]);

  assert.match(stdout, /agentattest collect --since <ref>/);
  assert.match(stdout, /agentattest markdown <agent-attestation\.json>/);
});

test("CLI executes when invoked through a symlinked path", async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), "agentattest-cli-link-"));
  const linkedCli = path.join(workspace, "agentattest");
  await symlink(cliPath, linkedCli);

  const { stdout } = await execFileAsync("node", [linkedCli, "--help"]);

  assert.match(stdout, /agentattest collect --since <ref>/);
});

test("collect creates a verifiable receipt from a real git repository", async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), "agentattest-e2e-"));
  await cp(path.join(repoRoot, "tests/fixtures/basic-repo"), workspace, { recursive: true });

  await git(workspace, ["init", "-b", "main"]);
  await git(workspace, ["config", "user.email", "agentattest@example.com"]);
  await git(workspace, ["config", "user.name", "AgentAttest Test"]);
  await execFileAsync("node", [cliPath, "init"], { cwd: workspace });
  await git(workspace, ["add", "."]);
  await git(workspace, ["commit", "-m", "initial fixture"]);

  await writeFile(path.join(workspace, "README.md"), "# Fixture Project\n\nChanged by the e2e test.\n", "utf8");
  await git(workspace, ["add", "."]);
  await git(workspace, ["commit", "-m", "change fixture"]);
  await mkdir(path.join(workspace, "receipts"));

  const receiptPath = "receipts/receipt.json";
  const { stdout: collectStdout } = await execFileAsync(
    "node",
    [cliPath, "collect", "--since", "HEAD~1", "--output", receiptPath],
    { cwd: workspace }
  );
  assert.match(collectStdout, /Wrote receipts\/receipt\.json/);

  const receipt = JSON.parse(await readFile(path.join(workspace, receiptPath), "utf8")) as AgentAttestation;
  assert.equal(receipt.files.length, 1);
  assert.equal(receipt.files[0]?.path, "README.md");
  assert.equal(receipt.verification.results[0]?.exitCode, 0);

  const { stdout: verifyStdout } = await execFileAsync("node", [cliPath, "verify", receiptPath], {
    cwd: workspace
  });
  assert.match(verifyStdout, /Verified 1 file/);

  const { stdout: markdownStdout } = await execFileAsync("node", [cliPath, "markdown", receiptPath], {
    cwd: workspace
  });
  assert.match(markdownStdout, /Workspace matches receipt: yes/);

  await execFileAsync(
    "node",
    [cliPath, "collect", "--since", "HEAD~1", "--output", receiptPath],
    { cwd: workspace }
  );
  const repeatedReceipt = JSON.parse(
    await readFile(path.join(workspace, receiptPath), "utf8")
  ) as AgentAttestation;
  assert.equal(repeatedReceipt.files.some((file) => file.path === receiptPath), false);
  const { stdout: repeatedVerifyStdout } = await execFileAsync(
    "node",
    [cliPath, "verify", receiptPath],
    { cwd: workspace }
  );
  assert.match(repeatedVerifyStdout, /Verified 1 file/);

  await writeFile(path.join(workspace, "created-after-collection.txt"), "late change\n", "utf8");
  await assert.rejects(
    execFileAsync("node", [cliPath, "verify", receiptPath], { cwd: workspace }),
    (error: unknown) => {
      assert.match((error as { stderr?: string }).stderr ?? "", /created-after-collection\.txt: new workspace change \(A\)/);
      return true;
    }
  );
  await assert.rejects(
    execFileAsync("node", [cliPath, "markdown", receiptPath], { cwd: workspace }),
    (error: unknown) => {
      assert.match((error as { stdout?: string }).stdout ?? "", /Workspace matches receipt: no/);
      return true;
    }
  );
  await rm(path.join(workspace, "created-after-collection.txt"));

  await writeFile(path.join(workspace, "README.md"), "# Fixture Project\n\nTampered after collection.\n", "utf8");
  await assert.rejects(
    execFileAsync("node", [cliPath, "verify", receiptPath], { cwd: workspace }),
    /Verification failed/
  );
  await assert.rejects(
    execFileAsync("node", [cliPath, "markdown", receiptPath], { cwd: workspace }),
    (error: unknown) => {
      assert.match((error as { stdout?: string }).stdout ?? "", /Workspace matches receipt: no/);
      return true;
    }
  );
});

test("collectAttestation records renamed and deleted files", async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), "agentattest-diff-"));
  await writeFile(path.join(workspace, "old.md"), "old\n", "utf8");
  await writeFile(path.join(workspace, "delete-me.md"), "delete\n", "utf8");
  await git(workspace, ["init", "-b", "main"]);
  await git(workspace, ["config", "user.email", "agentattest@example.com"]);
  await git(workspace, ["config", "user.name", "AgentAttest Test"]);
  await git(workspace, ["add", "."]);
  await git(workspace, ["commit", "-m", "initial"]);
  await git(workspace, ["mv", "old.md", "new.md"]);
  await git(workspace, ["rm", "delete-me.md"]);
  await git(workspace, ["commit", "-m", "rename and delete"]);

  const attestation = await collectAttestation(workspace, "HEAD~1", {
    verificationCommands: [],
    output: "agent-attestation.json"
  });

  assert.deepEqual(attestation.files.map((file) => [file.status, file.path]), [
    ["D", "delete-me.md"],
    ["R100", "new.md"]
  ]);
});

test("collectAttestation records and verifies the complete local workspace", async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), "agentattest-workspace-"));
  await writeFile(path.join(workspace, "modified.txt"), "original\n", "utf8");
  await writeFile(path.join(workspace, "staged.txt"), "original\n", "utf8");
  await writeFile(path.join(workspace, "delete-me.txt"), "delete\n", "utf8");
  await writeFile(path.join(workspace, ".gitignore"), "ignored.txt\n", "utf8");
  await git(workspace, ["init", "-b", "main"]);
  await git(workspace, ["config", "user.email", "agentattest@example.com"]);
  await git(workspace, ["config", "user.name", "AgentAttest Test"]);
  await git(workspace, ["add", "."]);
  await git(workspace, ["commit", "-m", "initial"]);

  await writeFile(path.join(workspace, "modified.txt"), "working tree\n", "utf8");
  await writeFile(path.join(workspace, "staged.txt"), "index\n", "utf8");
  await git(workspace, ["add", "staged.txt"]);
  await writeFile(path.join(workspace, "staged.txt"), "working tree wins\n", "utf8");
  await writeFile(path.join(workspace, "untracked.txt"), "untracked\n", "utf8");
  await writeFile(path.join(workspace, "ignored.txt"), "ignored\n", "utf8");
  await git(workspace, ["rm", "delete-me.txt"]);

  const attestation = await collectAttestation(workspace, "HEAD", {
    verificationCommands: [],
    output: "agent-attestation.json"
  });

  assert.deepEqual(attestation.files.map((file) => [file.status, file.path]), [
    ["D", "delete-me.txt"],
    ["M", "modified.txt"],
    ["M", "staged.txt"],
    ["A", "untracked.txt"]
  ]);
  assert.equal(attestation.files.find((file) => file.path === "staged.txt")?.sizeBytes, 18);
  assert.deepEqual(await verifyAttestation(workspace, attestation), {
    ok: true,
    checked: 4,
    issues: []
  });

  await git(workspace, ["rm", "-f", "modified.txt"]);
  const statusChanged = await verifyAttestation(workspace, attestation);
  assert.equal(statusChanged.ok, false);
  assert.equal(
    statusChanged.issues.find((issue) => issue.path === "modified.txt")?.message,
    "status changed from M to D"
  );
  await git(workspace, ["reset", "HEAD", "modified.txt"]);
  await writeFile(path.join(workspace, "modified.txt"), "working tree\n", "utf8");

  await writeFile(path.join(workspace, "untracked.txt"), "changed later\n", "utf8");
  const changed = await verifyAttestation(workspace, attestation);
  assert.equal(changed.ok, false);
  assert.equal(changed.issues.find((issue) => issue.path === "untracked.txt")?.message, "sha256 mismatch");
});

async function git(cwd: string, args: string[]): Promise<void> {
  await execFileAsync("git", args, { cwd });
}

function makeAttestation(files: AgentAttestation["files"], since = "HEAD~1"): AgentAttestation {
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
      since
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
