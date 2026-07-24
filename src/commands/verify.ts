import path from "node:path";
import { readAttestation, verifyAttestation } from "../verify.js";

export async function verifyCommand(cwd: string, args: string[]): Promise<number> {
  const attestationPath = args[0];
  if (!attestationPath) {
    console.error("Missing attestation path");
    return 1;
  }

  const absolutePath = path.resolve(cwd, attestationPath);
  const attestation = await readAttestation(absolutePath);
  const report = await verifyAttestation(cwd, attestation);

  if (report.ok) {
    console.log(`Verified ${report.checked} file(s)`);
    return 0;
  }

  console.error(`Verification failed for ${report.issues.length} file(s):`);
  for (const issue of report.issues) {
    console.error(`- ${issue.path}: ${issue.message}`);
  }

  return 1;
}
