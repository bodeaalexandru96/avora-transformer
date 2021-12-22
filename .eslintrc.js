module.exports = {
    env: {
        browser: true,
        es6: true,
        node: true,
    },
    extends: [
        'airbnb-base',
        'eslint:recommended',
    ],
    globals: {
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly',
    },
    parserOptions: {
        ecmaVersion: 2018,
        sourceType: 'module',
    },
    ignorePatterns: ['**/tests/unit/*.js'],
    rules: {
        'no-console': 'off',
        'import/named': 'off',
        'no-unused-expressions': 'off',
        'no-shadow': 'off',
        'no-debugger': 'off',
        'no-case-declarations': 'off',
        'no-useless-escape': 'off',
        'no-param-reassign': 'off',
        'prefer-destructuring': 'off',
        'class-methods-use-this': 'off',
        radix: 'off',
        'max-len': [1, 185, 4],
        indent: ['warn', 4, { SwitchCase: 1 }],
        'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 1 }],
        'no-trailing-spaces': ['error', { skipBlankLines: true }],
        'no-plusplus': ['error', { allowForLoopAfterthoughts: true }],
        'arrow-body-style': 'off',
        'no-use-before-define': 'off',
        'newline-per-chained-call': 'off',
        'object-curly-newline': ['error', {
            ObjectPattern: { minProperties: 10 },
        }],
        'import/extensions': ['error', 'ignorePackages', {
            js: 'never',
            jsx: 'never',
        }],
        'import/no-extraneous-dependencies': ['error', { devDependencies: ['**/*.test.js', '**/*.spec.js', '**/*.stories.js'] }],
    },
};
