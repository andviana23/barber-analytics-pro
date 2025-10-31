/**
 * Rule: no-hardcoded-colors
 *
 * Detecta uso de cores hardcoded do Tailwind (bg-white, text-gray-*, etc.)
 * que não suportam dark mode automaticamente.
 *
 * Sugere: Usar tokens do Design System (.card-theme, .text-theme-*, etc.)
 */

// Padrões de classes proibidas
const HARDCODED_COLOR_PATTERNS = [
  // Backgrounds
  /\bbg-white\b/,
  /\bbg-gray-\d+\b/,
  /\bbg-slate-\d+\b/,
  /\bbg-zinc-\d+\b/,
  /\bbg-neutral-\d+\b/,

  // Text colors
  /\btext-gray-\d+\b/,
  /\btext-slate-\d+\b/,
  /\btext-zinc-\d+\b/,
  /\btext-neutral-\d+\b/,
  /\btext-black\b/,
  /\btext-white\b/,

  // Borders
  /\bborder-gray-\d+\b/,
  /\bborder-slate-\d+\b/,
  /\bborder-white\b/,

  // Rings
  /\bring-gray-\d+\b/,
  /\bring-white\b/,
];

// Mapeamento de sugestões
const SUGGESTIONS_MAP = {
  'bg-white': 'bg-light-surface dark:bg-dark-surface ou .card-theme',
  'bg-gray-50': 'bg-light-bg dark:bg-dark-bg',
  'bg-gray-100': 'bg-light-surface dark:bg-dark-surface',
  'bg-gray-900': 'bg-dark-surface dark:bg-dark-surface',

  'text-gray-900':
    'text-theme-primary ou text-light-text-primary dark:text-dark-text-primary',
  'text-gray-600':
    'text-theme-secondary ou text-light-text-secondary dark:text-dark-text-secondary',
  'text-gray-500': 'text-theme-secondary',
  'text-gray-400': 'text-light-text-muted dark:text-dark-text-muted',
  'text-white': 'text-dark-text-primary (em contexto dark)',
  'text-black': 'text-light-text-primary (em contexto light)',

  'border-gray-200': 'border-light-border dark:border-dark-border',
  'border-gray-300': 'border-light-border dark:border-dark-border',
  'border-gray-700': 'border-dark-border',
  'border-white': 'border-light-surface dark:border-dark-surface',
};

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Proíbe uso de cores hardcoded do Tailwind sem suporte a dark mode',
      category: 'Design System',
      recommended: true,
    },
    messages: {
      hardcodedColor:
        'Evite usar "{{className}}" - não suporta dark mode. Sugestão: {{suggestion}}',
    },
    fixable: null, // Não há fix automático (requer análise de contexto)
    schema: [], // Sem opções
  },

  create(context) {
    return {
      JSXAttribute(node) {
        // Detectar apenas atributo "className"
        if (node.name.name !== 'className') {
          return;
        }

        // Obter valor do className
        let classNameValue = '';

        if (node.value?.type === 'Literal') {
          // className="bg-white text-gray-900"
          classNameValue = node.value.value;
        } else if (node.value?.type === 'JSXExpressionContainer') {
          // className={`bg-white ${...}`} - não analisar expressões complexas
          return;
        }

        if (typeof classNameValue !== 'string') {
          return;
        }

        // Verificar cada classe individualmente
        const classes = classNameValue.split(/\s+/);

        classes.forEach(className => {
          // Testar contra todos os padrões
          const isHardcoded = HARDCODED_COLOR_PATTERNS.some(pattern =>
            pattern.test(className)
          );

          if (isHardcoded) {
            const suggestion =
              SUGGESTIONS_MAP[className] ||
              'Use tokens do Design System (.card-theme, .text-theme-*, etc.)';

            context.report({
              node,
              messageId: 'hardcodedColor',
              data: {
                className,
                suggestion,
              },
            });
          }
        });
      },
    };
  },
};
