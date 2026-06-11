# Video Brief

## Title

AgentAttest: local receipts for agent-assisted code changes

## Core Demo

1. Show a small changed file in a git checkout.
2. Run `node dist/src/cli.js init`.
3. Run `node dist/src/cli.js collect --since origin/main`.
4. Open `agent-attestation.json` and point to changed files, SHA-256 hashes, and
   verification command results.
5. Run `node dist/src/cli.js verify agent-attestation.json`.
6. Run `node dist/src/cli.js markdown agent-attestation.json`.

## Grounded Talking Points

- Local-first CLI for review and handoff receipts.
- Records changed files, hashes, git metadata, and verification command results.
- Can render a Markdown summary for PRs.
- Does not sign receipts or create tamper-proof provenance.

## Short Post

`agentattest` turns an agent-assisted git change into a local JSON receipt:
changed files, file hashes, git metadata, and verification command results. It
can also render Markdown for review notes. It is a review aid, not a signing or
supply-chain attestation system.

