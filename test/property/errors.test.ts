import { fc, test } from '@fast-check/vitest';
import { describe, expect } from 'vitest';
import {
  AssetNotFoundError,
  AttestationFailedError,
  CacheCorruptError,
  NetworkFetchError,
  PluginAssetsError,
} from '../../src/index.js';

const subclasses = [
  ['NetworkFetchError', NetworkFetchError],
  ['AttestationFailedError', AttestationFailedError],
  ['CacheCorruptError', CacheCorruptError],
  ['AssetNotFoundError', AssetNotFoundError],
] as const;

describe('PluginAssetsError (property)', () => {
  test.prop([fc.string(), fc.string()])(
    'preserves message and humanMessage verbatim',
    (message, humanMessage) => {
      const err = new PluginAssetsError(message, { humanMessage });
      expect(err.message).toBe(message);
      expect(err.humanMessage).toBe(humanMessage);
    },
  );

  test.prop([fc.string()])('round-trips a provided manualInstallUrl', (url) => {
    const err = new PluginAssetsError('m', { humanMessage: 'h', manualInstallUrl: url });
    expect(err.manualInstallUrl).toBe(url);
  });

  test.prop([fc.string()])(
    'leaves manualInstallUrl undefined when the option is omitted',
    (message) => {
      const err = new PluginAssetsError(message, { humanMessage: 'h' });
      expect(err.manualInstallUrl).toBeUndefined();
    },
  );

  test.prop([fc.anything()])('propagates any cause verbatim', (cause) => {
    const err = new PluginAssetsError('m', { humanMessage: 'h', cause });
    expect(err.cause).toBe(cause);
  });

  test.prop([fc.string()])('leaves cause undefined when the option is omitted', (message) => {
    const err = new PluginAssetsError(message, { humanMessage: 'h' });
    expect(err.cause).toBeUndefined();
  });
});

describe.each(subclasses)('%s (property)', (name, Ctor) => {
  test.prop([fc.string(), fc.string()])(
    'extends PluginAssetsError and stamps its own name',
    (message, humanMessage) => {
      const err = new Ctor(message, { humanMessage });
      expect(err).toBeInstanceOf(PluginAssetsError);
      expect(err).toBeInstanceOf(Error);
      expect(err.name).toBe(name);
      expect(err.message).toBe(message);
      expect(err.humanMessage).toBe(humanMessage);
    },
  );
});
