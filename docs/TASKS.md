# AgentAttest Tasks

Status: MVP release candidate.

## Completed

- CLI entry point with `init`, `collect`, `verify`, and `markdown` commands.
- Local JSON receipt with git metadata, changed file hashes, environment hints, verification commands, and command results.
- Workspace hash verification for modified, added, renamed, and deleted files recorded by git diff.
- Markdown rendering for pull request or handoff notes.
- Temporary git repository tests for the primary user flow.
- Safety documentation that states receipts are local review evidence, not tamper-proof supply-chain provenance.
- Release checks covering typecheck, build, tests, smoke, package dry-run, and repository validation.

## Before First Tagged Release

- Confirm package name availability and publishing account access.
- Decide whether `agent-attestation.json` should stay ignored by default or be committed by projects that use it.
- Replace release placeholder links in `CHANGELOG.md` after the first tag exists.

## Later

- Optional JSON schema export for validating receipts in CI.
- Optional redaction controls for command output.
- Optional signed receipts if users need cryptographic provenance.
- Optional GitHub Action that verifies a committed receipt during pull requests.
