# obsidian-plugin-assets

Verified fetch, cache, and resolve layer for [Obsidian][obsidian] plugins that ship release-sourced assets.

[obsidian]: https://obsidian.md/

## What it does

Obsidian's distribution channels carry three files per plugin: `main.js`, `manifest.json`, and `styles.css`. Anything larger lives somewhere else. This library downloads the matching asset from a GitHub release at plugin load, verifies a sigstore attestation, caches the file in the plugin directory, and hands the plugin a path on disk.

## Status

Pre-release scaffold. The public API remains under design, and no runtime surface ships yet.

## Development

Read [`DEVELOPMENT.md`](DEVELOPMENT.md) for the full contributor guide. [`AGENTS.md`](AGENTS.md) has the condensed version aimed at AI coding agents, and Claude Code imports it automatically via [`CLAUDE.md`](CLAUDE.md).

Release details live in [`RELEASING.md`](RELEASING.md).

## Artificial intelligence disclosure

Claude helped draft code, tests, documentation, and the release pipeline under human direction. See [`AI_DISCLOSURE.md`](AI_DISCLOSURE.md) for the full Artificial Intelligence Disclosure (AID) statement.

## License

Released under the [MIT License](LICENSE).
