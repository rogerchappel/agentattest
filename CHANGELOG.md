# Changelog

All notable changes to this project will be documented in this file.

This project follows the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
format and uses semantic versioning when versioned releases are published.

## [Unreleased]

### Fixed

- Verify workspace-relative files correctly when a receipt is stored in a subdirectory.

### Added

- Local-first `agentattest` CLI with `init`, `collect`, `verify`, and `markdown` commands.
- JSON receipts with git metadata, changed-file hashes, environment hints, and verification command results.
- Temporary git repository tests and fixture coverage for the end-to-end receipt workflow.
- Documentation, examples, orchestration metadata, and release-candidate notes for the MVP safety boundary.

## Release Links

- Unreleased:
  `https://github.com/rogerchappel/agentattest/compare/...HEAD`
- Latest release:
  `https://github.com/rogerchappel/agentattest/releases/latest`

Replace placeholder links once the first release tag exists.
