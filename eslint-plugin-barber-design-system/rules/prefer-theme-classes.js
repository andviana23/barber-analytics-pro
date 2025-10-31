/**
 * Rule: prefer-theme-classes
 *
 * Detecta uso duplicado de classes dark: que podem ser substituídas
 * por classes utilitárias do Design System (.card-theme, .btn-theme-*, etc.)
 *
 * Exemplo:
 *   ❌ bg-light-surface dark:bg-dark-surface
 *   ✅ .card-theme
 */

// Padrões de substituição recomendada
const THEME_CLASS_REPLACEMENTS = {
  // Cards
  'bg-light-surface dark:bg-dark-surface': '.card-theme',
  'bg-white dark:bg-gray-800': '.card-theme',

  // Texto primário
  'text-light-text-primary dark:text-dark-text-primary': '.text-theme-primary',
  'text-gray-900 dark:text-white': '.text-theme-primary',

  // Texto secundário
  'text-light-text-secondary dark:text-dark-text-secondary':
    '.text-theme-secondary',
  'text-gray-600 dark:text-gray-400': '.text-theme-secondary',

  // Botões
  'bg-primary hover:bg-primary-dark': '.btn-theme-primary',
  'bg-light-surface dark:bg-dark-surface hover:bg-light-hover dark:hover:bg-dark-hover':
    '.btn-theme-secondary',

  // Inputs
  'bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border':
    '.input-theme',
};

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Recomenda uso de classes utilitárias do Design System em vez de repetir dark: classes',
      category: 'Design System',
      recommended: false,
    },
    messages: {
      preferThemeClass:
        'Considere usar "{{replacement}}" em vez de "{{original}}"',
    },
    fixable: null,
    schema: [],
  },

  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name.name !== 'className') {
          return;
        }

        let classNameValue = '';

        if (node.value?.type === 'Literal') {
          classNameValue = node.value.value;
        } else {
          return;
        }

        if (typeof classNameValue !== 'string') {
          return;
        }

        // Normalizar espaços múltiplos
        const normalized = classNameValue.replace(/\s+/g, ' ').trim();

        // Verificar se contém padrões que podem ser simplificados
        Object.entries(THEME_CLASS_REPLACEMENTS).forEach(
          ([pattern, replacement]) => {
            if (normalized.includes(pattern)) {
              context.report({
                node,
                messageId: 'preferThemeClass',
                data: {
                  original: pattern,
                  replacement,
                },
              });
            }
          }
        );
      },
    };
  },
};
