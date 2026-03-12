module.exports = {
  root: true,
  env: { node: true, es2022: true },
  extends: [
    'eslint:recommended',
    // Must be last — disables ESLint rules that conflict with Prettier formatting
    'prettier',
  ],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  ignorePatterns: ['node_modules', 'dist'],
  rules: {
    // Warn on leftover console.log — use server/utils/logger.js instead
    'no-console': 'warn',
    // Catch unused variables (prefix with _ to intentionally ignore)
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    // Prefer const for variables that are never reassigned
    'prefer-const': 'error',
  },
}
