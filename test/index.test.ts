import { describe, expect, it } from 'vitest';
import {
  AssetNotFoundError,
  AttestationFailedError,
  CacheCorruptError,
  NetworkFetchError,
  PluginAssetsError,
} from '../src/index.js';

describe('PluginAssetsError', () => {
  it('carries humanMessage and manualInstallUrl', () => {
    const err = new PluginAssetsError('technical detail', {
      humanMessage: 'Friendly message',
      manualInstallUrl: 'https://example.test/releases',
    });
    expect(err.message).toBe('technical detail');
    expect(err.humanMessage).toBe('Friendly message');
    expect(err.manualInstallUrl).toBe('https://example.test/releases');
    expect(err.name).toBe('PluginAssetsError');
  });

  it('leaves manualInstallUrl undefined when omitted', () => {
    const err = new PluginAssetsError('m', { humanMessage: 'h' });
    expect(err.manualInstallUrl).toBeUndefined();
  });

  it('propagates cause', () => {
    const cause = new Error('root');
    const err = new PluginAssetsError('wrapped', { humanMessage: 'h', cause });
    expect(err.cause).toBe(cause);
  });
});

describe('error subclasses', () => {
  const cases = [
    ['NetworkFetchError', NetworkFetchError],
    ['AttestationFailedError', AttestationFailedError],
    ['CacheCorruptError', CacheCorruptError],
    ['AssetNotFoundError', AssetNotFoundError],
  ] as const;

  for (const [name, Ctor] of cases) {
    it(`${name} extends PluginAssetsError and stamps its own name`, () => {
      const err = new Ctor('m', { humanMessage: 'h' });
      expect(err).toBeInstanceOf(PluginAssetsError);
      expect(err).toBeInstanceOf(Error);
      expect(err.name).toBe(name);
    });
  }
});
