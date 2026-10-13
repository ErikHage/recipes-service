const js = require('@eslint/js');
const stylistic = require('@stylistic/eslint-plugin');
const n = require('eslint-plugin-n');
const globals = require('globals');

module.exports = [
  {
    ignores: [
      'spec/helpers/**',
      'spec/coverage/**',
      'bin/**',
      'lib/helpers/logging.js',
    ],
  },
  js.configs.recommended,
  n.configs['flat/recommended-script'],
  stylistic.configs.customize({
    indent: 2,
    quotes: 'single',
    semi: true,
    commaDangle: 'always-multiline',
    braceStyle: '1tbs',
    arrowParens: false,
  }),
  {
    rules: {
      // carried over from airbnb-base and the old .eslintrc
      'no-console': 'error',
      'no-param-reassign': ['warn', {
        props: true,
        ignorePropertyModificationsFor: ['acc', 'accumulator', 'e', 'req', 'request', 'res', 'response'],
      }],
      'no-await-in-loop': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'n/global-require': 'error',
      // the services exit deliberately when they can't start
      'n/no-process-exit': 'off',
      '@stylistic/arrow-parens': 'off',
      '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
      '@stylistic/quote-props': ['error', 'as-needed'],
      '@stylistic/max-len': ['error', {
        code: 100, ignoreUrls: true, ignoreStrings: true, ignoreTemplateLiterals: true,
      }],
    },
  },
  {
    files: ['spec/**'],
    languageOptions: {
      globals: {
        ...globals.mocha,
        expect: 'readonly',
        sinon: 'readonly',
      },
    },
  },
];
