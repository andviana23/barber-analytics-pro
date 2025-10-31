/**
 * Rule: no-inline-hex-colors
 *
 * Detecta uso de cores hexadecimais inline via Tailwind arbitrary values.
 * Exemplo: bg-[#FFFFFF], text-[#1A1F2C], border-[#E4E8EE]
 *
 * Sugere: Usar tokens do Design System ou adicionar ao tailwind.config.js
 */

// Padrão de detecção: bg-[#...], text-[#...], border-[#...], etc.
const HEX_INLINE_PATTERN =
  /\b(bg|text|border|ring|shadow|from|to|via)-\[#[0-9A-Fa-f]{3,8}\]/;

// Mapeamento de cores conhecidas para sugestões
const HEX_TO_TOKEN_MAP = {
  '#FFFFFF': 'bg-light-surface ou .card-theme',
  '#ffffff': 'bg-light-surface ou .card-theme',
  '#fff': 'bg-light-surface ou .card-theme',

  '#1A1F2C': 'text-theme-primary',
  '#1a1f2c': 'text-theme-primary',

  '#667085': 'text-theme-secondary',

  '#F6F8FA': 'bg-light-bg',
  '#f6f8fa': 'bg-light-bg',

  '#E4E8EE': 'border-light-border',
  '#e4e8ee': 'border-light-border',

  '#1E8CFF': 'bg-primary',
  '#1e8cff': 'bg-primary',

  '#0072E0': 'bg-primary-dark (hover)',
  '#0072e0': 'bg-primary-dark (hover)',
};

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Proíbe uso de cores hexadecimais inline via Tailwind arbitrary values',
      category: 'Design System',
      recommended: true,
    },
    messages: {
      inlineHex:
        'Evite usar cor hexadecimal inline "{{className}}". Sugestão: {{suggestion}}',
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

        // Verificar cada classe
        const classes = classNameValue.split(/\s+/);

        classes.forEach(className => {
          if (HEX_INLINE_PATTERN.test(className)) {
            // Tentar extrair o valor hex
            const hexMatch = className.match(/#[0-9A-Fa-f]{3,8}/);
            const hexValue = hexMatch ? hexMatch[0] : null;

            const suggestion =
              hexValue && HEX_TO_TOKEN_MAP[hexValue]
                ? HEX_TO_TOKEN_MAP[hexValue]
                : 'Adicione a cor ao tailwind.config.js ou use tokens do Design System';

            context.report({
              node,
              messageId: 'inlineHex',
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
