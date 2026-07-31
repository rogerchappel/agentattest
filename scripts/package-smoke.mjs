#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const workspace = await mkdtemp(path.join(tmpdir(), "agentattest-package-smoke-"));

try {
  const output = execFileSync("npm", ["pack", "--json", "--pack-destination", workspace], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  });

  const [packument] = JSON.parse(output);
  const packedFiles = new Set(packument.files.map((file) => file.path));
  const requiredFiles = new Set(["README.md", "LICENSE"]);

  if (packageJson.main) {
    requiredFiles.add(packageJson.main.replace(/^\.\//, ""));
  }

  const binEntries =
    typeof packageJson.bin === "string"
      ? [packageJson.bin]
      : Object.values(packageJson.bin ?? {});

  for (const binEntry of binEntries) {
    requiredFiles.add(binEntry.replace(/^\.\//, ""));
  }

  const missing = [...requiredFiles].filter((file) => !packedFiles.has(file));

  if (missing.length > 0) {
    console.error(`${packageJson.name} package smoke failed; missing packed file(s):`);
    for (const file of missing) {
      console.error(`- ${file}`);
    }
    process.exitCode = 1;
  } else {
    const installPrefix = path.join(workspace, "install");
    const tarball = path.join(workspace, packument.filename);
    execFileSync("npm", ["install", "--ignore-scripts", "--prefix", installPrefix, tarball], {
      stdio: "inherit",
    });
    const executable = path.join(
      installPrefix,
      "node_modules",
      ".bin",
      process.platform === "win32" ? "agentattest.cmd" : "agentattest"
    );
    const help = execFileSync(executable, ["--help"], { encoding: "utf8" });
    if (!help.includes("agentattest collect --since <ref>")) {
      throw new Error("installed executable did not print expected help");
    }
    console.log(
      `${packageJson.name} package smoke passed with ${packument.files.length} packed file(s) and an executable install check.`
    );
  }
} finally {
  await rm(workspace, { recursive: true, force: true });
}
