import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({
    baseDirectory: import.meta.dirname
});

const eslintConfig = [
    ...compat.extends('next/core-web-vitals'),
    {
        ignores: ['node_modules/**', '.next/**', 'out/**', 'scripts/**', 'netlify/**', 'css/**']
    },
    {
        rules: {
            // Keep the codebase free of dead code and accidental globals.
            'no-unused-vars': 'warn',
            'no-console': 'off'
        }
    }
];

export default eslintConfig;