module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
    // Accessibility rules — catches missing ARIA roles, labels, etc.
    'plugin:jsx-a11y/recommended',
    // Must be last — disables ESLint rules that conflict with Prettier formatting
    'prettier',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  settings: { react: { version: '18.3' } },
  plugins: ['react-refresh', 'jsx-a11y'],
  overrides: [
    // Build config runs in Node
    { files: ['vite.config.js'], env: { node: true } },
  ],
  rules: {
    'react/jsx-no-target-blank': 'off',
    'react-refresh/only-export-components': [
      'warn',
      // Context modules export their provider plus its hook
      { allowConstantExport: true, allowExportNames: ['useUserContext', 'useBankrollContext', 'useThemeContext'] },
    ],
    // Warn on leftover console.log calls — use src/utils/logger.js instead
    'no-console': 'warn',
    // Catch variables declared but never used
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    // Props aren't typed with PropTypes in this project
    'react/prop-types': 'off',
  },
}
