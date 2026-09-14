const expoConfig = require('eslint-config-expo/flat');
const prettier = require('eslint-config-prettier');

module.exports = [
  ...expoConfig,
  prettier,
  {
    ignores: ['node_modules/**', 'coverage/**', 'dist/**', '.expo/**', 'android/**', 'ios/**'],
  },
  {
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'smart'],
      // Reanimated shared values are mutable handles by design; this rule reads every
      // `sharedValue.value = x` as an illegal render-time mutation, which it is not.
      'react-hooks/immutability': 'off',
    },
  },
  {
    // Build scripts run in Node, not in the app runtime.
    files: ['scripts/**/*.mjs', 'scripts/**/*.ts', '*.config.js', 'jest.config.js'],
    languageOptions: {
      globals: {
        Buffer: 'readonly',
        process: 'readonly',
        console: 'readonly',
        module: 'writable',
        require: 'readonly',
        __dirname: 'readonly',
      },
    },
    rules: { 'no-console': 'off' },
  },
  {
    // Jest globals for specs, mocks and setup files.
    files: ['**/__tests__/**', '**/__mocks__/**', 'jest.setup.js'],
    languageOptions: {
      globals: {
        jest: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
    // Specs deliberately use require() to re-resolve a module after jest.resetModules().
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
];
