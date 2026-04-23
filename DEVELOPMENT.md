# Development

A human-oriented companion to [`AGENTS.md`](AGENTS.md). Use this as the starting point when you clone the repo for the first time.

## Prerequisites

- Node 22.22.0. The pin lives in `.node-version` and `engines` in `package.json`.
- pnpm 10 or newer. The version sits in `packageManager` in `package.json`.

## First-time setup

```bash
pnpm install
```

That installs dependencies and wires up husky hooks through the `prepare` script. No extra steps.

## Day-to-day loop

```bash
pnpm dev          # rebuild dist/ on file change
pnpm test:watch   # vitest in watch mode
```

The watchers cover the public API surface. Run `pnpm lint:all && pnpm typecheck && pnpm build && pnpm test:coverage` before pushing. Husky runs typecheck and tests on `pre-push`, so a clean push confirms the gate.

## Publishing

Don't publish by hand. The `release` workflow handles it end-to-end once release-please cuts a tag. See [`RELEASING.md`](RELEASING.md).
