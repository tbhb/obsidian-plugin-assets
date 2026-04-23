# AGENTS.md

Guidance for AI coding agents working in this repository. The package ships as a small npm library that Obsidian plugins consume at load time to fetch, verify, and cache release-sourced assets.

## Quickstart

Run these commands on a fresh clone:

```bash
pnpm install          # install dependencies + init husky hooks
pnpm typecheck        # tsc --noEmit on src + test configs
pnpm test             # vitest, 100% coverage gate
pnpm build            # typecheck + vite build to dist/
```

Run the full gate before pushing:

```bash
pnpm lint:all && pnpm typecheck && pnpm build && pnpm test:coverage
```

The pre-commit hook runs `nano-staged`. The pre-push hook runs typecheck and tests. Never bypass with `--no-verify`.

## Design source

The authoritative design sketch lives in the sandbox vault at `obsidian-plugin-assets.md`. Consult it for the target API shape, trust model, and caching strategy before adding any runtime surface. Update the sketch if the design shifts in code.

## Repository layout

```text
src/
└── index.ts                # public exports (stub only until design lands)
test/
└── index.test.ts           # one test file per coverage-tracked source module
.github/
├── workflows/ci.yml        # Lint, Build, Test, Documentation jobs
├── workflows/release.yml   # release-please + build + attest + npm publish
├── release-please-config.json
├── release-please-config.beta.json
├── release-please-manifest.json
└── dependabot.yml
```

Config lives at the repo root: `biome.json`, `eslint.config.mts`, `cspell.json` + `cspell-words.txt`, `.rumdl.toml`, `.vale.ini` + `.vale/`, `.yamllint.yaml` + `.yamllintignore`, `commitlint.config.js`, `vite.config.ts`, `vitest.config.ts`, plus both `tsconfig.json` and `tsconfig.test.json`.

## Commands reference

```bash
pnpm dev              # vite build --watch
pnpm build            # tsc --noEmit + vite build (emits dist/)
pnpm test             # vitest run
pnpm test:watch       # vitest in watch mode
pnpm test:coverage    # vitest run --coverage, enforces 100% thresholds
pnpm typecheck        # tsc on src and test tsconfigs
pnpm format           # biome format --write
pnpm format:markdown  # rumdl fmt .
pnpm lint             # biome lint + eslint
pnpm lint:markdown    # rumdl check
pnpm lint:prose       # vale
pnpm lint:spelling    # cspell
pnpm lint:yaml        # yamllint --strict
pnpm lint:actions     # actionlint
pnpm lint:all         # every lint above, one command
pnpm vale:sync        # download vale style packages
```

## Code style

- Two-space indentation everywhere, enforced by Biome. Single quotes, semicolons, trailing commas, 100-char line width. See `biome.json`.
- ESLint runs `typescript-eslint`'s type-aware rules over `src/**/*.ts` for checks Biome doesn't cover.
- Strict TypeScript with ES2022 target, `noUncheckedIndexedAccess`, and `isolatedModules`.
- Avoid default exports.

## Build shape

The library ships as an ECMAScript module, no CommonJS fallback. `vite build` emits `dist/index.js` plus a rolled-up `dist/index.d.ts` via `vite-plugin-dts`. Every runtime dependency stays external so consuming bundlers can tree-shake the result inside `main.js`. The target bundle budget sits around 5 to 10 KB after gzip.

## Testing

- Vitest 4 with the `node` environment.
- Coverage thresholds sit at 100% for statements, branches, functions, and lines. Don't lower them or add `/* v8 ignore */` comments without a clear rationale.
- Integration tests that need GitHub release fixtures should mock the network boundary (`msw` or `nock`) rather than hitting the real API.

## Documentation linting

Every markdown, YAML, and workflow file ships through a gate before landing:

- `rumdl` for markdown structure
- `vale` for prose style. Enforces sentence case, active voice, contractions, short parentheticals, and concrete word choice
- `cspell` for spelling, backed by `cspell-words.txt`
- `yamllint` for YAML
- `actionlint` for GitHub Actions workflows

Add new technical terms to `cspell-words.txt` and to `.vale/config/vocabularies/obsidian-plugin-assets/accept.txt` when Vale flags them as spelling errors. Avoid em-dashes entirely, use commas or periods. Vale flags long parentheticals over 25 characters, so break them into separate sentences. Write each paragraph on a single line without hard wrapping. Use reference-style links with definitions at the bottom of their containing paragraph or section.

## Git workflow

- Conventional commits via commitlint. Header under 100 characters. Body and footer under 120 characters per line.
- husky hooks, installed automatically by `pnpm install`:
  - `pre-commit` runs `nano-staged` across the staged files
  - `commit-msg` runs commitlint
  - `pre-push` runs `pnpm typecheck && pnpm test`
- Never use `--no-verify`. Fix the underlying failure.
- Work on a feature branch, open a PR, and merge via squash.

## Release process

- release-please handles versioning, tagging, and release creation. Configs live under `.github/`. See `RELEASING.md` for the full guide.
- Stable channel: push conventional commits to `main`. release-please opens a release PR that bumps `package.json` and updates `CHANGELOG.md`. Merging creates a bare-semver tag like `1.2.0`, with no `v` prefix, and a GitHub release. A follow-up job builds, attests via SLSA provenance, and publishes to npm with `--provenance`.
- Beta channel: push to the `beta` branch. Same flow, but driven by `.github/release-please-config.beta.json`. Produces `1.2.0-beta.1`-style tags marked as pre-releases; the publish step tags them `beta` on npm so stable consumers keep resolving to the latest stable.
- Only `feat:`, `fix:`, and commits with breaking changes trigger a release PR. `chore:`, `docs:`, `refactor:`, `style:`, `test:`, `ci:`, and `build:` commits land without opening one.
- Don't hand-edit `package.json` `version` or `CHANGELOG.md`. Don't create tags manually. release-please owns those files.

## Rules at a glance

- Run the full gate before pushing.
- Add new technical terms to `cspell-words.txt` and the Vale vocabulary.
- Write reference-style markdown links with definitions at the bottom of the paragraph.
- Avoid em-dashes, passive voice, and italicized copulas in prose.
- Keep paragraphs on one line. No hard wrap.
- Don't force-push to `main` or `beta`.
- Don't bypass hooks.
- Don't hand-edit release-managed files.

## Further reading

- `README.md` for the user-facing overview
- `DEVELOPMENT.md` for the human developer guide
- `RELEASING.md` for the release pipeline and verification
- `AI_DISCLOSURE.md` for the AI disclosure statement
- `CHANGELOG.md` for release history
