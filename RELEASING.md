# Releasing

[release-please][release-please] drives the release pipeline across two channels, stable and beta. Both channels publish to npm with sigstore provenance via `actions/attest-build-provenance` and `pnpm publish --provenance`.

[release-please]: https://github.com/googleapis/release-please-action

## Channels

- **Stable.** Push conventional commits to `main`. release-please opens a release PR that bumps `package.json` and updates `CHANGELOG.md`. Merging creates a bare-semver tag like `1.2.0` and a GitHub release. The `publish-release` job then builds, attests, and publishes to npm under the default `latest` dist-tag.
- **Beta.** Push to the `beta` branch. The same flow applies, driven by `.github/release-please-config.beta.json`. Tags look like `1.2.0-beta.1` and ship to npm under the `beta` dist-tag, so `npm install obsidian-plugin-assets` keeps resolving to the latest stable release.

## What triggers a release PR

Only `feat:`, `fix:`, and commits marked with a breaking change open a release PR. `chore:`, `docs:`, `refactor:`, `style:`, `test:`, `ci:`, and `build:` commits land without cutting a release.

## Authentication

Publishing uses [npm trusted publishing][npm-trusted]. The registry exchanges the GitHub Actions OIDC token for a short-lived publish credential, and `--provenance` records the same identity on the package. The `publish-release` job requests `id-token: write` so sigstore can sign the build attestation and so npm can verify the OIDC token. No `NPM_TOKEN` secret exists.

[npm-trusted]: https://docs.npmjs.com/trusted-publishers

Actions supplies `GITHUB_TOKEN` automatically. No manual setup.

One-time repository and npm configuration lives in the design sketch at `obsidian-plugin-assets.md` in the sandbox vault.

## Manual verification after a release

```bash
npm view obsidian-plugin-assets@<version> dist.shasum
npm view obsidian-plugin-assets@<version> .dist.fingerprints
```

The `provenance` field should match the Actions run that published the tag.

## What not to hand-edit

release-please owns the following files. Don't edit them by hand and don't create tags manually.

- `manifest.json` `version` field
- `package.json` `version` field
- `versions.json`
- `CHANGELOG.md`
- `.github/release-please-manifest.json`
- Git tags
