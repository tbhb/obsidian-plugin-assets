/*
 * ESLint runs two tools in this config:
 *   - `typescript-eslint` supplies type-aware rules that Biome doesn't
 *     cover (no-unsafe-*, strict-boolean-expressions, restrict-plus-operands,
 *     restrict-template-expressions, etc.).
 *   - `eslint-plugin-sonarjs` contributes `sonarjs/cognitive-complexity` so
 *     functions that grow hard to reason about fail lint instead of review.
 *
 * Biome owns general-purpose lint + formatting + the type-aware rules it
 * already covers (no-floating-promises, no-misused-promises, no-explicit-any,
 * no-non-null-assertion, no-ts-ignore). See `biome.json`.
 *
 * `eslint-plugin-obsidianmd` will land with the first plugin directory
 * (example plugin or fixture plugin), since the plugin reads `manifest.json`
 * eagerly at import time and library code under `src/` has no manifest.
 */

import { globalIgnores } from 'eslint/config';
import sonarjs from 'eslint-plugin-sonarjs';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const typeAwareRules = {
  '@typescript-eslint/no-unsafe-assignment': 'error',
  '@typescript-eslint/no-unsafe-call': 'error',
  '@typescript-eslint/no-unsafe-member-access': 'error',
  '@typescript-eslint/no-unsafe-return': 'error',
  '@typescript-eslint/no-unsafe-argument': 'error',
  '@typescript-eslint/strict-boolean-expressions': 'error',
  '@typescript-eslint/ban-ts-comment': 'error',
  '@typescript-eslint/no-unnecessary-type-assertion': 'error',
  '@typescript-eslint/no-confusing-void-expression': 'error',
  '@typescript-eslint/restrict-plus-operands': 'error',
  '@typescript-eslint/restrict-template-expressions': 'error',
  '@typescript-eslint/require-await': 'error',
  // Biome owns no-explicit-any (see biome.json). Disable the ESLint variant
  // to keep a single source of truth.
  '@typescript-eslint/no-explicit-any': 'off',
} as const;

export default tseslint.config(
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      globals: {
        ...globals.node,
      },
      parserOptions: {
        projectService: {
          allowDefaultProject: [
            'eslint.config.mts',
            'vite.config.ts',
            'vitest.config.ts',
            'commitlint.config.js',
          ],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      sonarjs,
    },
    rules: {
      'sonarjs/cognitive-complexity': ['error', 15],
      ...typeAwareRules,
    },
  },
  // Root-level config files. These aren't in tsconfig.json's `include`, so
  // they fall through `allowDefaultProject` above. They run in Node.
  {
    files: ['vite.config.ts', 'vitest.config.ts', 'commitlint.config.js'],
    languageOptions: {
      parser: tseslint.parser,
      globals: {
        ...globals.node,
      },
      parserOptions: {
        projectService: {
          allowDefaultProject: [
            'eslint.config.mts',
            'vite.config.ts',
            'vitest.config.ts',
            'commitlint.config.js',
          ],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      sonarjs,
    },
    rules: {
      'sonarjs/cognitive-complexity': ['error', 15],
      ...typeAwareRules,
    },
  },
  {
    files: ['test/**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      globals: {
        ...globals.node,
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      sonarjs,
    },
    rules: {
      'sonarjs/cognitive-complexity': ['error', 15],
      ...typeAwareRules,
    },
  },
  // Mirror Biome's test-mock carve-out: fixture mocks intentionally use
  // looser patterns to mirror Obsidian's runtime API without pulling in the
  // full type surface. Dormant until a fixture plugin lands.
  {
    files: ['test/__mocks__/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
    },
  },
  globalIgnores(['node_modules', 'dist', 'coverage', '.husky']),
);
