import js from '@eslint/js'
import { plugin as shadcn } from '@shadcn/lint'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'storybook-static']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: { shadcn },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],
      'react-refresh/only-export-components': [
        'error',
        { allowConstantExport: true, allowExportNames: ['meta'] },
      ],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'shadcn/no-raw-colors': 'warn',
    },
  },
  {
    // Published Fluid helpers intentionally colocate providers, hooks, and tokens.
    files: ['src/lib/shape-context.tsx', 'src/lib/size-context.tsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
])
