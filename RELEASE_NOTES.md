# AgentAttest 0.1.0 Release Candidate

## Classification

Ship-ready when the recorded checks pass on the release-candidate branch.

## Summary

- Adds a local-first TypeScript CLI for agent-assisted change receipts.
- Records changed files, SHA-256 hashes, git metadata, environment hints, configured verification commands, and command output.
- Verifies that the current workspace still matches a generated receipt.
- Renders receipts as Markdown for pull request review notes.

## Verification

To be updated by the release worker before publishing:

- `npm run release:check`
- `bash scripts/validate.sh`
- Real CLI smoke covering `init`, `collect`, `verify`, `markdown`, and tamper failure.

## Limitations

- Receipts are unsigned local JSON and can be edited after generation.
- AgentAttest does not provide key management, remote signing, transparency logs, or SLSA/in-toto compliance.
- Command output may contain sensitive data if configured verification commands print it.
- File hashes only prove that the current workspace matches the receipt at verification time.
