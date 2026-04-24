/**
 * obsidian-plugin-assets
 *
 * Verified fetch, cache, and resolve layer for Obsidian plugins that ship
 * release-sourced assets. The runtime lands incrementally; see the design
 * sketch (`obsidian-plugin-assets.md` in the sandbox vault) for the target
 * API surface.
 */

export type { PluginAssetsErrorOptions } from './errors.js';
export {
  AssetNotFoundError,
  AttestationFailedError,
  CacheCorruptError,
  NetworkFetchError,
  PluginAssetsError,
} from './errors.js';
