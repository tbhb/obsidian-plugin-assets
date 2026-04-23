# Releasing

[release-please][release-please] drives the release pipeline on a single branch, `main`. Both stable and beta releases ship from that branch. The version string determines the channel. A `-beta.N` qualifier drives GitHub's prerelease flag and the npm `beta` dist-tag, while a plain version publishes stable.

[release-please]: https://github.com/googleapis/release-please-action

## Single-branch prerelease flow

Push conventional commits to `main`. release-please opens a release PR that bumps `package.json` and updates `CHANGELOG.md`. Merging creates a bare-semver tag and a GitHub release. The `publish-release` job then builds, attests, and publishes to npm with sigstore provenance.

### Stable vs beta

- **Stable release.** Normal `feat` or `fix` bumps under `bump-minor-pre-major: true` and `bump-patch-for-minor-pre-major: true`. Published to npm under the default `latest` dist-tag. The GitHub release stays unmarked.
- **Beta release.** Version carries a prerelease qualifier such as `0.1.0-beta.2`. Trigger via a `Release-As: 0.1.0-beta.2` footer on any qualifying commit. The package config sets `"prerelease": true`, so release-please flags the GitHub release as `prerelease: true` whenever the version carries a prerelease qualifier. Stable versions stay unflagged. The publish job detects the `-` in the tag and passes `--tag beta` to `npm publish`, so `npm install` keeps resolving to the highest stable version.

BRAT honors GitHub's `prerelease` flag for beta testers, which covers the user-visible staging channel without a separate branch.

## What triggers a release PR

Only `feat:`, `fix:`, and commits marked with a breaking change open a release PR. `chore:`, `docs:`, `refactor:`, `style:`, `test:`, `ci:`, and `build:` commits land without cutting a release. A `Release-As: x.y.z` footer on any commit type also triggers a release at the pinned version. Use that footer to cut a beta.

## Authentication

Publishing uses [npm trusted publishing][npm-trusted]. The registry exchanges the GitHub Actions OIDC token for a short-lived publish credential, and `--provenance` records the same identity on the package. Requesting `id-token: write` on the `publish-release` job lets sigstore sign the build attestation and lets npm verify the OIDC token. No `NPM_TOKEN` secret exists.

[npm-trusted]: https://docs.npmjs.com/trusted-publishers

The `release-please` job runs under a token minted from the `tbhb-releases` GitHub App. The workflow reads `RELEASE_BOT_APP_ID` as a repo variable and `RELEASE_BOT_PRIVATE_KEY` as a repo secret. An App-issued token bypasses GitHub's recursion-prevention rule so the release PR push triggers CI. It also bypasses the first-time-contributor workflow-approval gate. Downstream jobs use the built-in `GITHUB_TOKEN` and the OIDC token. No other setup needed.

## Why npm, not pnpm, runs the publish step

The pipeline uses pnpm for install, lint, typecheck, test, and build. Only the final publish step shells out to `npm`. The reason: npm trusted publishing needs a registry OIDC handshake that landed in npm 11.5.1. Node 22 ships with npm 10.9.2, and the `libnpmpublish` version bundled in current pnpm releases inherits the same gap, so `pnpm publish --provenance` signs the provenance statement but fails the registry upload with a 404. A global `npm install --global npm@latest` runs before `npm publish --provenance` to pull in the supported command-line tool. Don't swap the publish step back to `pnpm publish` until pnpm ships a fix. Treat a green sigstore log line as separate from a green registry response.

## Manual verification after a release

```bash
npm view obsidian-plugin-assets@<version> dist.shasum
npm view obsidian-plugin-assets@<version> .dist.attestations
```

The `provenance` field should match the Actions run that published the tag.

## What not to hand-edit

release-please owns the following files. Don't edit them by hand and don't create tags manually.

- `package.json` `version` field
- `CHANGELOG.md`
- `.github/release-please-manifest.json`
- Git tags
