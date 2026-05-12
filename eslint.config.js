import { tanstackConfig } from '@tanstack/eslint-config';

export default [
  {
    ignores: ['prettier.config.js', 'eslint.config.js', 'tsdown.config.ts']
  },
  ...tanstackConfig
];
