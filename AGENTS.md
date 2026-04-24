# AGENTS.md

Guidance for AI coding agents working in this repository. The package ships as a small npm library that Obsidian plugins consume at load time to fetch, verify, and cache release-sourced assets.

## Quickstart

Run these commands on a fresh clone:

```bash
pnpm install          # install dependencies + init husky hooks
pnpm typecheck        # tsc --noEmit on src + test
pnpm test             # vitest run, all three tiers
pnpm build            # vite build, emits dist/ with rolled-up types
```

Run the full gate before pushing:

```bash
pnpm lint:all && pnpm typecheck && pnpm build && pnpm test:coverage && pnpm test:integration && pnpm test:property
```

The pre-commit hook runs `nano-staged`. The pre-push hook runs the full gate. Never bypass with `--no-verify`.

## Repository layout

```text
src/
└── index.ts                # public exports
test/
└── index.test.ts           # one test file per coverage-tracked source module
.github/
├── workflows/ci.yml        # Lint, Build, Test, Documentation jobs
├── workflows/mutation.yml  # Stryker mutation tests with incremental cache
├── workflows/release.yml   # release-please + build + attest + npm publish
├── release-please-config.json
├── release-please-manifest.json
└── dependabot.yml
scripts/
└── stryker-changed.mjs     # diff-scoped mutation run for local and agent use
```

Config lives at the repo root: `biome.json`, `eslint.config.mts`, `.dependency-cruiser.cjs`, `.jscpd.json`, `.knip.json`, `.cspell.json` + `cspell-words.txt`, `.rumdl.toml`, `.vale.ini` + `.vale/`, `.yamllint.yaml` + `.yamllintignore`, `.commitlintrc.ts`, `stryker.config.json`, `vite.config.ts`, `vitest.config.ts`, `vitest.stryker.config.ts`, and `tsconfig.json`.

## Commands reference

```bash
pnpm dev              # vite build --watch
pnpm build            # vite build, emits dist/ with rolled-up types
pnpm test             # vitest run, all projects
pnpm test:watch       # vitest in watch mode
pnpm test:unit        # vitest run --project=unit
pnpm test:integration # vitest run --project=integration
pnpm test:property    # vitest run --project=property
pnpm test:coverage    # vitest run --project=unit --coverage, enforces 100% thresholds
pnpm test:mutation    # stryker run, full mutation pass with incremental reuse
pnpm test:mutation:changed # stryker scoped to src diff vs STRYKER_BASE (default origin/main)
pnpm typecheck        # tsc --noEmit on src + test
pnpm format           # biome format --write
pnpm format:markdown  # rumdl fmt .
pnpm lint             # biome lint + eslint
pnpm lint:deps        # dependency-cruiser on src + test
pnpm lint:jscpd       # jscpd copy-paste detection
pnpm lint:knip        # knip — unused files, exports, deps
pnpm lint:markdown    # rumdl check
pnpm lint:prose       # vale
pnpm lint:spelling    # cspell
pnpm lint:yaml        # yamllint --strict
pnpm lint:actions     # actionlint
pnpm lint:all         # every lint above, one command
pnpm depcruise:graph  # mermaid module graph -> dependency-graph.mmd
pnpm vale:sync        # download vale style packages
```

## Code style

- Two-space indentation everywhere, enforced by Biome. Single quotes, semicolons, trailing commas, 100-char line width. See `biome.json`.
- ESLint runs on `src/**/*.ts` and `test/**/*.ts`, with `typescript-eslint`'s type-aware rules applied to both for checks Biome doesn't cover.
- `eslint-plugin-sonarjs` contributes `sonarjs/cognitive-complexity` at the default threshold of 15. Prefer extracting helper functions over raising the threshold.
- [dependency-cruiser][depcruise] guards the module graph via `.dependency-cruiser.cjs`. It forbids runtime circular dependencies, orphan modules, unresolvable imports, dev-dependency imports from `src/`, duplicate dependency-type declarations, and `src/` depending on `test/`. Cycles composed only of `import type` edges pass, since those edges vanish after tsc emits.
- [Knip][knip] catches unused files, exports, and dependencies via `.knip.json`. Its Vite and Vitest plugins auto-discover entries from `vite.config.ts` and `vitest.config.ts`, so the config only declares the project glob plus a small `ignoreBinaries` list for external tools that npm scripts call: `actionlint`, `rumdl`, `vale`, and `yamllint`. `fast-check` sits in `ignoreDependencies` because property tests import `fc` through `@fast-check/vitest`, which declares `fast-check` as a peer dependency, so no file imports the package directly.
- [jscpd][jscpd] fails the lint gate on any duplicate token block across `src/` and `test/`. Config lives at `.jscpd.json` with threshold 0, `minTokens: 50`, and `minLines: 5`. Prefer extracting helpers over raising the threshold.
- Strict TypeScript with ES2022 target, `noUncheckedIndexedAccess`, and `isolatedModules`.
- Avoid default exports.

[depcruise]: https://github.com/sverweij/dependency-cruiser
[jscpd]: https://github.com/kucherenko/jscpd
[knip]: https://knip.dev/

## Build shape

The library ships as an ECMAScript module, no CommonJS fallback. `vite build` emits `dist/index.js` plus a rolled-up `dist/index.d.ts` via `vite-plugin-dts`. Every runtime dependency stays external so consuming bundlers can tree-shake the result inside `main.js`. The target bundle budget sits around 5 to 10 KB after gzip.

## Testing

- Vitest 4 split into three projects by directory under `test/`. The `unit` and `integration` tiers run in `jsdom`. The `property` tier runs in `node`.
- Coverage thresholds sit at 100% for statements, branches, functions, and lines. Don't lower them or add `/* v8 ignore */` comments without a clear rationale.
- `pnpm test:coverage` runs the `unit` project only. The `integration` and `property` tiers run as separate CI steps and separate pre-push steps so fuzzed property iterations can't cover branches that deterministic unit cases miss, which would hide real coverage gaps.
- Integration tests that need GitHub release fixtures should mock the network boundary (`msw` or `nock`) rather than hitting the real API.
- Property tests use [fast-check][fast-check] via [`@fast-check/vitest`][fast-check-vitest], which exposes `test.prop` and `it.prop` helpers. The default seed policy stays in place. fast-check prints the seed on failure, so reproducing a counterexample takes a single rerun with the printed seed. Save new property suites under `test/property/` rather than the unit tier so coverage metrics stay tied to deterministic unit cases.

[fast-check]: https://fast-check.dev/
[fast-check-vitest]: https://github.com/dubzzz/fast-check/tree/main/packages/vitest

## Mutation testing

[Stryker 9][stryker] gates every module in `src/` at 100% mutation score. Coverage proves a line ran. Mutation testing proves a test would fail if that line changed. Treat survivors the way you'd treat coverage gaps. Fix the tests, or restructure the source so the survivor moves into a pure function whose output a test can pin by equality.

- The Vitest runner reads `vitest.stryker.config.ts`, which narrows execution to the unit project. Integration fixtures and property iterations stay out of mutation runs.
- Scope: `mutate: src/**/*.ts`, no carve-outs.
- The break threshold sits at 100 for every source file. Don't lower it without a concrete reason and a follow-up task to restore it.
- Module-level `export const` and re-export bindings can survive a static-import `expect(X).toBe(...)` assertion when the Vitest worker caches the module before Stryker sets the active mutant. Test them through a runtime path that re-reads the binding, a method call that returns the value, or a constructor that reads an option. Or force re-evaluation with `vi.resetModules()` plus `await import(...)`.
- Stryker directive comments suppress mutant classes that don't belong under mutation testing. Write `// Stryker disable <MutatorName>` on the line before the source to suppress, and `// Stryker restore <MutatorName>` on the line before the source that resumes instrumentation. Scope them as narrowly as possible.
- `pnpm test:mutation` runs the full pass. `reports/stryker-incremental.json` lets repeated runs reuse prior results, so later invocations finish in seconds.
- `pnpm test:mutation:changed` scopes `--mutate` to `src/*.ts` changed against `origin/main`. Override the base with `STRYKER_BASE=origin/beta pnpm test:mutation:changed`. Use this during feature work for fast feedback on the files you just edited.
- Pre-push doesn't run mutation testing. The `mutation.yml` CI workflow enforces the break threshold on every pull request and every `main` push. It caches the incremental report per ref with a fallback to `main`.

[stryker]: https://stryker-mutator.io/

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
  - `pre-push` runs `pnpm lint:all && pnpm typecheck && pnpm build && pnpm test:coverage && pnpm test:integration && pnpm test:property && pnpm danger:local`
- Never use `--no-verify`. Fix the underlying failure.
- Work on a feature branch, open a PR, and merge via squash.

## Release process

- release-please runs in single-branch mode on `main`. See `RELEASING.md` for the full guide.
- Push conventional commits to `main`. release-please opens a release PR that bumps `package.json` and updates `CHANGELOG.md`. Merging creates a bare-semver tag and a GitHub release. A follow-up job builds, attests via SLSA provenance, and publishes to npm with `--provenance`.
- Stable vs beta comes from the version string, not the branch. A regular `feat`/`fix` bumps under `bump-minor-pre-major` and publishes under `latest`. A `Release-As: x.y.z-beta.N` footer on any commit forces a prerelease. release-please's `prerelease` config option, once enabled, stays on for every release regardless of the version qualifier, so the `release.yml` workflow flips the GitHub prerelease flag itself. It edits the release to `prerelease=true` when the tag contains a semver qualifier and leaves stable tags unflagged. The publish step also passes `--tag beta` to `npm publish` for qualifier tags.
- Only `feat:`, `fix:`, and commits with breaking changes trigger a release PR on their own. `chore:`, `docs:`, `refactor:`, `style:`, `test:`, `ci:`, and `build:` commits land without opening one, unless they carry a `Release-As:` footer.
- Don't hand-edit `package.json` `version` or `CHANGELOG.md`. Don't create tags manually. release-please owns those files.

## Rules at a glance

- Run the full gate before pushing.
- Add new technical terms to `cspell-words.txt` and the Vale vocabulary.
- Write reference-style markdown links with definitions at the bottom of the paragraph.
- Avoid em-dashes, passive voice, and italicized copulas in prose.
- Keep paragraphs on one line. No hard wrap.
- Don't force-push to `main`.
- Don't bypass hooks.
- Don't hand-edit release-managed files.

## Further reading

- `README.md` for the user-facing overview
- `DEVELOPMENT.md` for the human developer guide
- `RELEASING.md` for the release pipeline and verification
- `AI_DISCLOSURE.md` for the AI disclosure statement
- `CHANGELOG.md` for release history
