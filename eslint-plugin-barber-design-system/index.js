/**
 * ESLint Plugin: Barber Design System
 *
 * Garante conformidade com as regras do Design System do Barber Analytics Pro.
 * Detecta violações de cores hardcoded, hex inline, e falta de suporte a dark mode.
 *
 * @author Andrey Viana
 * @version 1.0.0
 */

const noHardcodedColors = require('./rules/no-hardcoded-colors');
const preferThemeClasses = require('./rules/prefer-theme-classes');
const noInlineHexColors = require('./rules/no-inline-hex-colors');

module.exports = {
  meta: {
    name: 'eslint-plugin-barber-design-system',
    version: '1.0.0',
  },

  rules: {
    'no-hardcoded-colors': noHardcodedColors,
    'prefer-theme-classes': preferThemeClasses,
    'no-inline-hex-colors': noInlineHexColors,
  },

  configs: {
    recommended: {
      plugins: ['barber-design-system'],
      rules: {
        'barber-design-system/no-hardcoded-colors': 'error',
        'barber-design-system/prefer-theme-classes': 'warn',
        'barber-design-system/no-inline-hex-colors': 'error',
      },
    },
    strict: {
      plugins: ['barber-design-system'],
      rules: {
        'barber-design-system/no-hardcoded-colors': 'error',
        'barber-design-system/prefer-theme-classes': 'error',
        'barber-design-system/no-inline-hex-colors': 'error',
      },
    },
  },
};
