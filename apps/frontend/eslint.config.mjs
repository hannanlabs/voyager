import globals from 'globals';
import tseslint from 'typescript-eslint';
import { fixupPluginRules } from '@eslint/compat';
import nextPlugin from '@next/eslint-plugin-next';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: ['.next/**', 'node_modules/**', 'dist/**', 'build/**', 'coverage/**'],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: new URL('.', import.meta.url),
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      'react-hooks': fixupPluginRules(reactHooksPlugin),
      '@next/next': nextPlugin,
    },
    extends: [...tseslint.configs.strictTypeChecked, prettier],
    rules: {
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
  },
  {
    files: [
      'app/**/page.tsx',
      'app/**/layout.tsx',
      'app/**/template.tsx',
      'app/**/error.tsx',
      'app/**/not-found.tsx',
      'pages/**/*.{ts,tsx}',
    ],
    rules: {
      'import/no-default-export': 'off',
    },
  },
  {
    files: ['**/*.config.{js,cjs,mjs,ts}', 'next.config.ts', 'postcss.config.*'],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
    },
  },
);
