import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'prisma/migrations'] },
  {
    files: ['**/*.ts'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.strict,
      ...tseslint.configs.stylistic,
      prettierConfig,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.node,
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: './tsconfig.json',
      },
    },
    rules: {
      // Custom rules per CLAUDE.md
      'no-console': 'warn',
      eqeqeq: 'error',
      'no-nested-ternary': 'error',
      'no-unneeded-ternary': 'error',
      'prefer-const': 'error',
      'no-return-assign': 'error',
      'prefer-template': 'error',
      'max-params': ['error', 3],
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],

      // Strict mode — no migration overrides for new backend code
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
    },
  },
  {
    files: ['**/__tests__/**/*.ts', '**/*.test.ts'],
    rules: {
      // Relax rules in test files
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-definitions': 'off',
    },
  },
  {
    // Express error handlers require exactly 4 parameters: (err, req, res, next)
    files: ['**/middleware/errorHandler.ts'],
    rules: {
      'max-params': 'off',
    },
  },
  {
    files: ['jest.config.ts', 'jest.setup.ts'],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: null,
      },
    },
  },
  {
    files: ['**/__tests__/**/*.ts', '**/*.test.ts'],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: null,
      },
    },
  },
);
