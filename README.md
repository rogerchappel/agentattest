# agentattest

Local-first provenance receipts for agent-assisted git changes. `agentattest`
records changed files, file hashes, git metadata, and verification command
results into a JSON receipt that can be checked later.

## Status

This repository is early-stage. Receipts are unsigned local JSON; they are useful
for review and handoff, not tamper-proof supply-chain attestations.

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

## License

MIT
