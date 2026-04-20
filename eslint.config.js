const tsPlugin = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const reactPlugin = require('eslint-plugin-react');
const reactHooksPlugin = require('eslint-plugin-react-hooks');

const files = ['flamerelay/static/js/**/*.{ts,tsx}'];

module.exports = [
  {
    ignores: ['node_modules/**', 'flamerelay/static/webpack_bundles/**'],
  },
  // typescript-eslint flat config — registers parser + plugin, avoids legacy structuredClone path
  ...tsPlugin.configs['flat/recommended'].map((config) => ({
    ...config,
    files,
  })),
  // React plugins + rules
  {
    files,
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/no-danger': 'error',
    },
  },
];
