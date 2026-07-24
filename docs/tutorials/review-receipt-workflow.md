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

The receipt records git metadata and the workspace relative to the merge base
of the selected ref and `HEAD`: committed, staged, and unstaged changes plus
non-ignored untracked files. Ignored files are omitted. A path changed in both
the index and working tree is recorded once with its final working-tree
contents. The receipt also includes configured verification command results.

## Verify and render

```sh
node dist/src/cli.js verify agent-attestation.json
node dist/src/cli.js markdown agent-attestation.json > agent-attestation.md
```

The receipt can live below the workspace root, such as
`receipts/agent-attestation.json`. Invoke both commands from the collected
repository workspace and pass that nested path. AgentAttest resolves recorded
file paths from the workspace, not from the receipt's directory.

Use the Markdown output in a PR or handoff note. Keep the caveat visible:
receipts are local JSON and are not cryptographic supply-chain attestations.
