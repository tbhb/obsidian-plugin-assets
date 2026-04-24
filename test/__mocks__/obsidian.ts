/*
 * Minimal runtime stub of the `obsidian` module for Vitest.
 *
 * The real `obsidian` npm package is a types-only shim with no runtime main,
 * so importing it under Vitest throws. This stub provides just enough of the
 * public API for unit and integration tests to import, instantiate, and drive
 * plugin code. Grow the surface as the library (and fixture plugin) start
 * using more of the Obsidian API.
 */

import { readFileSync, statSync } from 'node:fs';
import { access, mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { vi } from 'vitest';

const registries = {
  notices: [] as Notice[],
};

export function __resetObsidianMocks(): void {
  registries.notices.length = 0;
}

export function __getNotices(): Notice[] {
  return [...registries.notices];
}

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  minAppVersion: string;
  description: string;
  author: string;
  authorUrl?: string;
  isDesktopOnly?: boolean;
}

export interface DataAdapter {
  read(path: string): Promise<string>;
  write(path: string, data: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  remove(path: string): Promise<void>;
  mkdir(path: string): Promise<void>;
}

export class TAbstractFile {
  path = '';
  name = '';
}
export class TFile extends TAbstractFile {
  basename = '';
  extension = '';
}
export class TFolder extends TAbstractFile {
  children: TAbstractFile[] = [];
}

export class Vault {
  adapter?: DataAdapter;
  getFileByPath = vi.fn((_path: string) => null as TFile | null);
  getFolderByPath = vi.fn((_path: string) => null as TFolder | null);
  getAbstractFileByPath = vi.fn((_path: string) => null as TAbstractFile | null);
  // `async` keeps the return type aligned with Obsidian's real Promise-
  // returning signature. No body to await.
  // eslint-disable-next-line @typescript-eslint/require-await
  read = vi.fn(async (_file: TFile) => '');
}

class FilesystemDataAdapter implements DataAdapter {
  constructor(private readonly rootPath: string) {}

  async read(path: string): Promise<string> {
    return await readFile(join(this.rootPath, path), 'utf8');
  }

  async write(path: string, data: string): Promise<void> {
    const absolute = join(this.rootPath, path);
    await mkdir(dirname(absolute), { recursive: true });
    await writeFile(absolute, data, 'utf8');
  }

  async exists(path: string): Promise<boolean> {
    try {
      await access(join(this.rootPath, path));
      return true;
    } catch {
      return false;
    }
  }

  async remove(path: string): Promise<void> {
    await unlink(join(this.rootPath, path));
  }

  async mkdir(path: string): Promise<void> {
    await mkdir(join(this.rootPath, path), { recursive: true });
  }
}

// Factory for integration tests. Returns a Vault whose lookup, read, and
// `DataAdapter` methods hit a real directory on disk so plugin code can
// drive against a vault fixture copied to a tmpdir.
export function createFilesystemVault(rootPath: string): Vault {
  const vault = new Vault();
  vault.adapter = new FilesystemDataAdapter(rootPath);

  const statAt = (relPath: string) => {
    try {
      return statSync(join(rootPath, relPath));
    } catch {
      return null;
    }
  };

  vault.getFileByPath = vi.fn((path: string) => {
    const stats = statAt(path);
    return stats?.isFile() === true ? makeTFile(path) : null;
  });

  vault.getFolderByPath = vi.fn((path: string) => {
    const stats = statAt(path);
    return stats?.isDirectory() === true ? makeTFolder(path) : null;
  });

  vault.getAbstractFileByPath = vi.fn((path: string) => {
    const stats = statAt(path);
    if (stats?.isFile() === true) return makeTFile(path);
    if (stats?.isDirectory() === true) return makeTFolder(path);
    return null;
  });

  vault.read = vi.fn(
    // eslint-disable-next-line @typescript-eslint/require-await
    async (file: TFile) => readFileSync(join(rootPath, file.path), 'utf8'),
  );

  return vault;
}

function makeTFile(path: string): TFile {
  const file = new TFile();
  file.path = path;
  const lastSlash = path.lastIndexOf('/');
  const name = lastSlash >= 0 ? path.slice(lastSlash + 1) : path;
  file.name = name;
  const dot = name.lastIndexOf('.');
  if (dot > 0) {
    file.basename = name.slice(0, dot);
    file.extension = name.slice(dot + 1);
  } else {
    file.basename = name;
    file.extension = '';
  }
  return file;
}

function makeTFolder(path: string): TFolder {
  const folder = new TFolder();
  folder.path = path;
  const lastSlash = path.lastIndexOf('/');
  folder.name = lastSlash >= 0 ? path.slice(lastSlash + 1) : path;
  return folder;
}

export class App {
  vault: Vault;

  constructor() {
    this.vault = new Vault();
  }
}

export class Plugin {
  app: App;
  manifest: PluginManifest;

  constructor(app: App, manifest: PluginManifest) {
    this.app = app;
    this.manifest = manifest;
  }

  // When the Vault has a `DataAdapter` (as set by `createFilesystemVault`),
  // load/save routes through `.obsidian/plugins/{manifest.id}/data.json` on
  // disk so integration tests can round-trip settings. Without an adapter,
  // the stubs return null / no-op so unit tests that don't wire an adapter
  // stay unaffected.
  loadData = vi.fn(async (): Promise<unknown> => {
    const adapter = this.app.vault.adapter;
    if (!adapter) return null;
    const path = `.obsidian/plugins/${this.manifest.id}/data.json`;
    if (!(await adapter.exists(path))) return null;
    return JSON.parse(await adapter.read(path)) as unknown;
  });

  saveData = vi.fn(async (data: unknown) => {
    const adapter = this.app.vault.adapter;
    if (!adapter) return;
    const dir = `.obsidian/plugins/${this.manifest.id}`;
    await adapter.mkdir(dir);
    await adapter.write(`${dir}/data.json`, JSON.stringify(data, null, 2));
  });

  register = vi.fn();
  registerEvent = vi.fn();
  registerInterval = vi.fn((handle: number) => handle);

  onload(): Promise<void> | void {
    // Subclass override point.
  }

  onunload(): void {
    // Subclass override point.
  }
}

export class Notice {
  hide = vi.fn();
  constructor(public message: string) {
    registries.notices.push(this);
  }
}
