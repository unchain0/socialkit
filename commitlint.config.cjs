module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Existing PR history includes long bullet lines and a nonstandard "lint" type.
    // Keep subject rules strict; relax body width and allow historical "lint" type.
    'body-max-line-length': [0],
    'type-enum': [
      2,
      'always',
      ['build', 'chore', 'ci', 'docs', 'feat', 'fix', 'lint', 'perf', 'refactor', 'revert', 'style', 'test'],
    ],
  },
};
