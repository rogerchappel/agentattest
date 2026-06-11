# Review Receipt Workflow

This recipe shows the smallest local workflow for creating, checking, and
rendering an `agentattest` receipt.

## Build the CLI

```sh
npm install
npm run build
```

## Initialize config

```sh
node dist/src/cli.js init
```

The default config is equivalent to:

```json
{
  "verificationCommands": ["npm test", "npm run check"],
  "output": "agent-attestation.json"
}
```

See [examples/basic-config/.agentattest.json](../../examples/basic-config/.agentattest.json)
for a checked-in copy.

## Collect after a local change

```sh
node dist/src/cli.js collect --since origin/main
```

The receipt records git metadata, changed files from the selected ref, file
hashes for files that still exist, and configured verification command results.

## Verify and render

```sh
node dist/src/cli.js verify agent-attestation.json
node dist/src/cli.js markdown agent-attestation.json > agent-attestation.md
```

Use the Markdown output in a PR or handoff note. Keep the caveat visible:
receipts are local JSON and are not cryptographic supply-chain attestations.

