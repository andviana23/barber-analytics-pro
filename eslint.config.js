import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import barberDesignSystem from './eslint-plugin-barber-design-system/index.js';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: { react: { version: '18.2' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'barber-design-system': barberDesignSystem,
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/jsx-no-target-blank': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'no-unused-vars': 'warn',
      'no-console': 'warn',

      // Design System Rules (CRÍTICO - bloqueia merge em CI/CD)
      'barber-design-system/no-hardcoded-colors': 'error',
      'barber-design-system/prefer-theme-classes': 'warn',
      'barber-design-system/no-inline-hex-colors': 'error',
    },
  },
  {
    // Exceções: arquivos de scripts/tooling não precisam seguir Design System
    files: ['scripts/**/*.js', 'eslint-plugin-barber-design-system/**/*.js'],
    rules: {
      'barber-design-system/no-hardcoded-colors': 'off',
      'barber-design-system/prefer-theme-classes': 'off',
      'barber-design-system/no-inline-hex-colors': 'off',
    },
  },
];
