# agentattest

Local-first provenance receipts for agent-assisted git changes. `agentattest`
records changed files, file hashes, git metadata, and verification command
results into a JSON receipt that can be checked later.

## Status

This repository is early-stage. Receipts are unsigned local JSON; they are useful
for review and handoff, not tamper-proof supply-chain attestations.


## Verification

Run the local quality gates before opening a pull request:

```sh
npm run lint
npm test
npm run smoke
```

`npm run lint` is an alias for the repository static check so contributors can use the common npm workflow without guessing the project-specific command.

## Safety Boundary

AgentAttest is a local review aid. It does not create cryptographic provenance,
does not manage signing keys, and does not make a branch trustworthy by itself.
Treat a receipt as a compact record of what changed and what was run, then review
the code and verification results normally.

## Install

```sh
npm install
npm run build
```

## Use

Create a config file:

```sh
npm exec -- agentattest init
```

Collect a receipt for changes since a ref:

```sh
npm exec -- agentattest collect --since origin/main
```

Verify that the current workspace still matches a receipt:

```sh
npm exec -- agentattest verify agent-attestation.json
```

Verification recomputes the complete Git change inventory from the receipt's
recorded `--since` ref. It fails when a recorded file's content, size, or change
status differs; when a recorded change is no longer present; or when a new
tracked or non-ignored untracked change appears. Ignored files and the receipt
file passed to `verify` or `markdown` are excluded from this comparison.

Verification also requires the repository's current `HEAD` to equal the
receipt's recorded `git.headCommit`. The recorded `git.headCommitShort`, branch,
and remote URL are informational: changing a branch name or remote configuration
does not by itself fail verification. The recorded `git.since` ref is used to
recompute the change inventory, but its name is not compared as repository
identity. Receipts remain unsigned local JSON, so these checks detect workspace
drift but do not prevent someone from editing the receipt itself.

Render the receipt as markdown for a PR or handoff note:

```sh
npm exec -- agentattest markdown agent-attestation.json
```

Receipt output may be stored in a subdirectory, for example
`receipts/agent-attestation.json`. Run `verify` and `markdown` from the
repository workspace whose files were collected; recorded file paths are
workspace-relative and do not depend on the receipt's location. The selected
receipt output is excluded from its own file inventory and from later
verification, so collecting again to the same path produces a receipt that can
still be verified.

Example config:

```json
{
  "verificationCommands": ["npm test", "npm run check"],
  "output": "agent-attestation.json"
}
```

See [examples/basic-config/.agentattest.json](examples/basic-config/.agentattest.json)
and [examples/basic-receipt.md](examples/basic-receipt.md) for the smallest
expected workflow artifacts.

For a step-by-step local demo, see
[docs/tutorials/review-receipt-workflow.md](docs/tutorials/review-receipt-workflow.md).

## What Gets Recorded

- Git branch, head commit, remote URL when available, and the `--since` ref.
- Committed, staged, and unstaged files relative to the merge base of `--since`
  and `HEAD`, reconciled to each path's final working-tree content.
- Non-ignored untracked files as additions; files excluded by Git ignore rules
  are omitted.
- Repository-relative filenames are read from Git's NUL-delimited output, so
  non-ASCII characters, whitespace, and characters Git normally quotes are
  preserved exactly.
- SHA-256 hashes and file sizes for files that still exist.
- Verification commands from `.agentattest.json` and their exit codes, duration,
  stdout, and stderr.
- Runtime hints including Node.js version, platform, and CPU architecture.

## Verify

Run the release check before opening a pull request:

```sh
npm run release:check
```

Run repository validation:

```sh
bash scripts/validate.sh
```

`scripts/validate.sh` runs the repository's standard local checks when they are defined and will also run `agent-qc ready` when `agent-qc` is installed. Missing `agent-qc` is treated as a skip, not a failure.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution expectations. Changes
should be small, reviewable, and verified before review.

## Security

See [SECURITY.md](SECURITY.md) for vulnerability reporting guidance.

## Documentation

- [PRD](docs/PRD.md)
- [Tasks](docs/TASKS.md)
- [Orchestration](docs/ORCHESTRATION.md)
- [Machine-readable orchestration](docs/orchestration.json)

## License

MIT

## Development

Run the same local checks used for release readiness before opening changes:

- `npm run check`
- `npm test`
- `npm run build`
- `npm run smoke`
- `npm run package:smoke`
- `npm run release:check`
