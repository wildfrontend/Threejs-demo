import { FlatCompat } from '@eslint/eslintrc';
import unusedImports from 'eslint-plugin-unused-imports';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends('next/core-web-vitals'),
  {
    plugins: {
      'unused-imports': unusedImports,
    },

    rules: {
      'react/jsx-sort-props': 'warn',
      'no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'warn',
    },
  },
];

export default eslintConfig;
