# AgentAttest PRD

Status: in-progress

## Summary

AgentAttest creates a local attestation for an agent-assisted change: git metadata, changed-file hashes, verification commands, environment hints, and a signed-looking but explicitly local JSON statement. It is a practical provenance receipt for developers who want to know what was verified before sharing a branch.

## Why now

AI-assisted development is faster, but stability and review confidence are recurring concerns. Teams need lightweight provenance that lives in the repo and does not require a supply-chain platform. AgentAttest is a small local receipt generator for "what changed and how did we check it?"

Sources/inspiration:

- Recent reporting that AI coding has increased speed while creating stability concerns.
- SLSA/in-toto style provenance ideas, reframed for local agent-assisted development rather than full supply-chain compliance.
- Roger's existing local-first tools such as `envreceipt` and `runledger`; AgentAttest focuses on one change bundle and verification commands.

## Users

- Developers using agents to prepare branches.
- Maintainers reviewing generated changes.
- Solo builders who want repeatable release-candidate evidence.

## MVP

- CLI commands:
  - `agentattest init` writes config.
  - `agentattest collect --since <ref>` writes `agent-attestation.json`.
  - `agentattest verify agent-attestation.json` checks file hashes still match.
  - `agentattest markdown agent-attestation.json` renders a review note.
- Captures git branch, head commit, changed files, SHA-256 hashes, configured verification commands, and command results when run through the tool.
- Fixture tests using temporary git repos.
- Honest README: local receipt, not cryptographic supply-chain compliance.

## Non-goals

- No key management in V1.
- No remote signing service.
- No claims of tamper-proof evidence.

## Success criteria

- The end-to-end fixture creates an attestation and verifies it.
- Tampering with a captured file causes verification to fail.
- Docs make the safety boundary obvious.

