/*
 * Fixture plugin used by integration tests.
 *
 * Extends Obsidian's `Plugin` base class and consumes
 * `obsidian-plugin-assets` via the library's source tree. Integration
 * tests drive this fixture against the copied vault to confirm the
 * harness, the library, and the plugin wire together end-to-end.
 */

import { Plugin } from 'obsidian';
import { PluginAssetsError } from '../../../../src/index.js';

export class PluginAssetsFixturePlugin extends Plugin {
  override onload(): void {
    // No real side effects yet. The library ships no runtime behavior, so
    // onload just marks the lifecycle hook as reachable under test.
  }

  createProbeError(): PluginAssetsError {
    return new PluginAssetsError('probe', {
      humanMessage: 'Fixture probe — the library is reachable from the fixture plugin.',
    });
  }
}
