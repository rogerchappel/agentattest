export type AgentAttestConfig = {
  verificationCommands: string[];
  output: string;
};

export type GitMetadata = {
  branch: string;
  headCommit: string;
  headCommitShort: string;
  remoteUrl?: string;
  since: string;
};

export type FileRecord = {
  path: string;
  sha256: string;
  sizeBytes: number;
  status: string;
};

export type CommandResult = {
  command: string;
  exitCode: number | null;
  durationMs: number;
  stdout: string;
  stderr: string;
};

export type AgentAttestation = {
  schemaVersion: 1;
  generatedAt: string;
  tool: {
    name: "agentattest";
    version: string;
  };
  statement: string;
  git: GitMetadata;
  environment: {
    node: string;
    platform: string;
    arch: string;
  };
  files: FileRecord[];
  verification: {
    commands: string[];
    results: CommandResult[];
  };
  caveats: string[];
};
