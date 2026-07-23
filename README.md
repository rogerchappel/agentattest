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

Render the receipt as markdown for a PR or handoff note:

```sh
npm exec -- agentattest markdown agent-attestation.json
```

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
