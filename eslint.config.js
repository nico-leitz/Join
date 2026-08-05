// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const jsdoc = require('eslint-plugin-jsdoc');
const tsdoc = require('eslint-plugin-tsdoc');

module.exports = defineConfig([
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'node_modules/**',
    ],
  },
  {
    files: ['src/**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
      jsdoc.configs['flat/recommended-tsdoc-error'],
    ],
    plugins: {
      tsdoc,
    },
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],

      // Maximum 400 physical lines, including comments and blank lines.
      'max-lines': [
        'error',
        {
          max: 400,
          skipBlankLines: false,
          skipComments: false,
        },
      ],

      // Maximum 14 lines per function.
      'max-lines-per-function': [
        'error',
        {
          max: 14,
          skipBlankLines: true,
          skipComments: true,
          IIFEs: true,
        },
      ],

      // Validate TSDoc syntax.
      'tsdoc/syntax': 'error',

      // Require documentation for important TypeScript declarations.
      'jsdoc/require-jsdoc': [
        'error',
        {
          require: {
            ArrowFunctionExpression: false,
            ClassDeclaration: true,
            ClassExpression: false,
            FunctionDeclaration: true,
            FunctionExpression: false,
            MethodDefinition: true,
          },
          contexts: [
            'TSInterfaceDeclaration',
            'TSTypeAliasDeclaration',
            'TSEnumDeclaration',
            'TSMethodSignature',
          ],
          exemptEmptyConstructors: true,
          exemptEmptyFunctions: false,
        },
      ],

      // Require complete documentation.
      'jsdoc/require-description': 'error',
      'jsdoc/check-param-names': 'error',
      'jsdoc/require-param': 'error',
      'jsdoc/require-param-description': 'error',
      'jsdoc/require-returns': 'error',
      'jsdoc/require-returns-description': 'error',
    },
  },
  {
    files: ['src/**/*.html'],
    extends: [
      angular.configs.templateRecommended,
      angular.configs.templateAccessibility,
    ],
    rules: {},
  },
]);