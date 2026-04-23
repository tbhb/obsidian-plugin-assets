/*
 * Biome handles general lint and formatting — see `biome.json`.
 *
 * ESLint runs typescript-eslint's type-aware rules over `src/` for checks
 * Biome doesn't cover (no-floating-promises, no-misused-promises, and other
 * rules that need the TypeScript type-checker).
 */

import { globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
      parserOptions: {
        projectService: {
          allowDefaultProject: ['eslint.config.mts'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    extends: [...tseslint.configs.recommendedTypeChecked],
  },
  globalIgnores([
    'node_modules',
    'dist',
    'coverage',
    'vite.config.ts',
    'vitest.config.ts',
    'commitlint.config.js',
    'test',
    '.husky',
  ]),
);
