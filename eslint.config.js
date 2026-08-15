// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPluginReact from 'eslint-plugin-react';
import eslintPluginReactHooks from 'eslint-plugin-react-hooks';
import eslintPluginReactRefresh from 'eslint-plugin-react-refresh';
import eslintPluginImportX from 'eslint-plugin-import-x';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '**/playwright-report/**',
      '**/test-results/**',
      '**/.husky/**',
      '**/.claude/**',
      '**/.vite/**',
      'scripts/**',
      'website/**',
      '*.config.{js,ts,cjs,mjs}',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2023,
        ...globals.node,
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
        projectService: {
          allowDefaultProject: ['*.config.*'],
          defaultProject: './tsconfig.json',
        },
        tsconfigRootDir: __dirname,
      },
    },
    settings: {
      react: { version: 'detect' },
    },
    plugins: {
      'react': eslintPluginReact,
      'react-hooks': eslintPluginReactHooks,
      'react-refresh': eslintPluginReactRefresh,
      'import-x': eslintPluginImportX,
    },
    rules: {
      ...eslintPluginReact.configs.recommended.rules,
      ...eslintPluginReact.configs['jsx-runtime'].rules,
      ...eslintPluginReactHooks.configs.recommended.rules,

      'react/prop-types': 'off',
      'react/display-name': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/jsx-curly-brace-presence': [
        'error',
        { props: 'never', children: 'never', propElementValues: 'always' },
      ],
      'react/self-closing-comp': 'error',

      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/consistent-type-exports': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'warn',
      '@typescript-eslint/no-empty-function': ['warn', { allow: ['arrowFunctions'] }],
      '@typescript-eslint/no-confusing-void-expression': ['error', { ignoreArrowShorthand: true }],
      '@typescript-eslint/no-import-type-side-effects': 'error',
      '@typescript-eslint/no-unsafe-enum-comparison': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-base-to-string': 'off',
      '@typescript-eslint/no-dynamic-delete': 'off',

      'no-restricted-globals': ['error', 'name', 'length', 'event'],
      'no-console': ['warn', { allow: ['warn', 'error', 'debug'] }],
      'object-shorthand': ['error', 'always'],
      'eqeqeq': ['error', 'smart'],

      'import-x/order': 'off',
      'import-x/no-cycle': 'off',
      'import-x/no-duplicates': 'off',
    },
  },
  {
    files: ['src/engine/**/*.{ts,tsx}'],
    ignores: ['src/engine/renderer/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'react', message: '引擎层禁止依赖 React。' },
            { name: 'react-dom', message: '引擎层禁止依赖 React DOM。' },
            { name: 'react-dom/client', message: '引擎层禁止依赖 React DOM。' },
            {
              name: '@react-three/fiber',
              message:
                '引擎层禁止依赖 R3F。请用纯 Three.js API，R3F 适配放 React 层 components/engine-adapters。',
            },
            { name: '@react-three/drei', message: '引擎层禁止依赖 drei。' },
            {
              name: 'three',
              message:
                '引擎层通用逻辑禁止直接依赖 three。图形相关类放入 src/engine/renderer，通过 src/engine/contract 类型与其他模块解耦。',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/engine/renderer/**/*.{ts,tsx}'],
    rules: {
      'react/no-unknown-property': [
        'error',
        {
          ignore: [
            'attach',
            'args',
            'vertexShader',
            'fragmentShader',
            'uniforms',
            'transparent',
            'depthWrite',
            'position',
            'color',
            'opacity',
            'side',
            'map',
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', 'src/test/**/*.{ts,tsx}'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
    },
  },
  {
    files: ['tests/e2e/**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
    },
  },
  eslintConfigPrettier,
);
