/*
 * Vault fixture helper for integration tests.
 *
 * Each call copies the checked-in `test/fixtures/vault` tree into a fresh
 * tmpdir and installs the canonical plugin manifest from
 * `test/fixtures/plugin/manifest.json` under
 * `<tmpdir>/.obsidian/plugins/<id>/manifest.json`, so the fixture plugin
 * looks like a real installed plugin from the vault's point of view.
 *
 * Call `cleanup()` in `afterEach` to remove the tmpdir.
 */

import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import type { PluginManifest } from 'obsidian';

// Vitest runs from the project root. Resolve fixtures against cwd so the
// helper doesn't depend on `import.meta.url`, which Vitest 4's module
// evaluator doesn't always surface as a `file://` URL.
const VAULT_FIXTURE_ROOT = resolve(process.cwd(), 'test/fixtures/vault');
const PLUGIN_FIXTURE_ROOT = resolve(process.cwd(), 'test/fixtures/plugin');
const PLUGIN_MANIFEST_PATH = join(PLUGIN_FIXTURE_ROOT, 'manifest.json');

export interface VaultFixture {
  readonly path: string;
  readonly pluginDir: string;
  readonly manifest: PluginManifest;
  cleanup(): void;
}

export function copyFixtureToTmp(): VaultFixture {
  const dir = mkdtempSync(join(tmpdir(), 'obsidian-plugin-assets-vault-'));
  cpSync(VAULT_FIXTURE_ROOT, dir, { recursive: true });

  const manifest = JSON.parse(readFileSync(PLUGIN_MANIFEST_PATH, 'utf8')) as PluginManifest;
  const pluginDir = join(dir, '.obsidian', 'plugins', manifest.id);
  mkdirSync(pluginDir, { recursive: true });
  writeFileSync(join(pluginDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  return {
    path: dir,
    pluginDir,
    manifest,
    cleanup: () => {
      rmSync(dir, { recursive: true, force: true });
    },
  };
}
