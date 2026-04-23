/**
 * Typed errors surfaced by `fetchAsset` and companion utilities.
 *
 * Every error carries a `humanMessage` suitable for Obsidian's `Notice` and
 * an optional `manualInstallUrl` pointing at the GitHub release page, so
 * plugin authors can guide users through a fallback path without needing
 * to construct their own copy.
 */

export interface PluginAssetsErrorOptions {
  humanMessage: string;
  manualInstallUrl?: string;
  cause?: unknown;
}

export class PluginAssetsError extends Error {
  readonly humanMessage: string;
  readonly manualInstallUrl: string | undefined;

  constructor(message: string, options: PluginAssetsErrorOptions) {
    super(message, { cause: options.cause });
    this.name = new.target.name;
    this.humanMessage = options.humanMessage;
    this.manualInstallUrl = options.manualInstallUrl;
  }
}

export class NetworkFetchError extends PluginAssetsError {}
export class AttestationFailedError extends PluginAssetsError {}
export class CacheCorruptError extends PluginAssetsError {}
export class AssetNotFoundError extends PluginAssetsError {}
