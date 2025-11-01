/**
 * ===================================================
 * Order Status Constants
 * ===================================================
 * Define constantes, transições, labels e estilos
 * para os status de comandas.
 *
 * Baseado em: docs/tarefas/comanda_status.md
 * Data: 28/10/2025
 * Autor: Agente Arquiteto
 * ===================================================
 */

/**
 * Enum de status de comandas
 * Sincronizado com o ENUM do PostgreSQL
 */
export const ORDER_STATUS = Object.freeze({
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  AWAITING_PAYMENT: 'AWAITING_PAYMENT',
  CLOSED: 'CLOSED',
  CANCELED: 'CANCELED',
});

/**
 * Labels amigáveis para exibição na UI
 */
export const ORDER_STATUS_LABELS = Object.freeze({
  [ORDER_STATUS.OPEN]: 'Aberta',
  [ORDER_STATUS.IN_PROGRESS]: 'Em Atendimento',
  [ORDER_STATUS.AWAITING_PAYMENT]: 'Aguardando Pagamento',
  [ORDER_STATUS.CLOSED]: 'Finalizada',
  [ORDER_STATUS.CANCELED]: 'Cancelada',
});

/**
 * Cores do Design System para cada status
 * Usado em badges, indicadores, etc.
 */
export const ORDER_STATUS_COLORS = Object.freeze({
  [ORDER_STATUS.OPEN]: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-300 dark:border-blue-700',
    dot: 'bg-blue-500',
  },
  [ORDER_STATUS.IN_PROGRESS]: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-700 dark:text-yellow-300',
    border: 'border-yellow-300 dark:border-yellow-700',
    dot: 'bg-yellow-500',
  },
  [ORDER_STATUS.AWAITING_PAYMENT]: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-300 dark:border-purple-700',
    dot: 'bg-purple-500',
  },
  [ORDER_STATUS.CLOSED]: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-300 dark:border-green-700',
    dot: 'bg-green-500',
  },
  [ORDER_STATUS.CANCELED]: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-300 dark:border-red-700',
    dot: 'bg-red-500',
  },
});

/**
 * Ícones do Lucide para cada status
 */
export const ORDER_STATUS_ICONS = Object.freeze({
  [ORDER_STATUS.OPEN]: 'FileText', // Comanda criada
  [ORDER_STATUS.IN_PROGRESS]: 'Scissors', // Atendimento em andamento
  [ORDER_STATUS.AWAITING_PAYMENT]: 'CreditCard', // Aguardando pagamento
  [ORDER_STATUS.CLOSED]: 'CheckCircle2', // Finalizada
  [ORDER_STATUS.CANCELED]: 'XCircle', // Cancelada
});

/**
 * Descrições detalhadas de cada status
 */
export const ORDER_STATUS_DESCRIPTIONS = Object.freeze({
  [ORDER_STATUS.OPEN]:
    'Comanda criada e aguardando início do atendimento. Pode adicionar itens.',
  [ORDER_STATUS.IN_PROGRESS]:
    'Atendimento em andamento. Profissional adicionando serviços/produtos.',
  [ORDER_STATUS.AWAITING_PAYMENT]:
    'Atendimento finalizado. Aguardando processamento do pagamento.',
  [ORDER_STATUS.CLOSED]:
    'Comanda finalizada e paga. Receita gerada no sistema.',
  [ORDER_STATUS.CANCELED]:
    'Comanda cancelada. Receita removida (estorno) se já estava paga.',
});

/**
 * ===================================================
 * Máquina de Estados - Transições Válidas
 * ===================================================
 */

/**
 * Define as transições válidas entre status
 * Estrutura: { statusAtual: [statusPermitidos] }
 */
export const ORDER_STATUS_TRANSITIONS = Object.freeze({
  [ORDER_STATUS.OPEN]: [
    ORDER_STATUS.IN_PROGRESS,
    ORDER_STATUS.AWAITING_PAYMENT,
    ORDER_STATUS.CANCELED,
  ],

  [ORDER_STATUS.IN_PROGRESS]: [
    ORDER_STATUS.AWAITING_PAYMENT,
    ORDER_STATUS.OPEN, // Volta para aberta se remover todos os itens
    ORDER_STATUS.CANCELED,
  ],

  [ORDER_STATUS.AWAITING_PAYMENT]: [
    ORDER_STATUS.CLOSED,
    ORDER_STATUS.IN_PROGRESS, // Volta para adicionar mais itens
    ORDER_STATUS.CANCELED,
  ],

  [ORDER_STATUS.CLOSED]: [
    ORDER_STATUS.CANCELED, // Permite estorno
  ],

  [ORDER_STATUS.CANCELED]: [
    // Status final, não permite transições
  ],
});

/**
 * Verifica se uma transição de status é válida
 *
 * @param {string} currentStatus - Status atual da comanda
 * @param {string} newStatus - Novo status desejado
 * @returns {boolean} - true se a transição é válida
 *
 * @example
 * isValidTransition(ORDER_STATUS.OPEN, ORDER_STATUS.IN_PROGRESS) // true
 * isValidTransition(ORDER_STATUS.CLOSED, ORDER_STATUS.OPEN) // false
 */
export const isValidTransition = (currentStatus, newStatus) => {
  // Validar que os status existem
  if (!ORDER_STATUS[currentStatus] || !ORDER_STATUS[newStatus]) {
    console.warn('Status inválido:', { currentStatus, newStatus });
    return false;
  }

  // Mesmo status = sempre válido (idempotência)
  if (currentStatus === newStatus) {
    return true;
  }

  const allowedTransitions = ORDER_STATUS_TRANSITIONS[currentStatus] || [];
  return allowedTransitions.includes(newStatus);
};

/**
 * Retorna a lista de próximos status válidos a partir do status atual
 *
 * @param {string} currentStatus - Status atual da comanda
 * @returns {string[]} - Array de status permitidos
 *
 * @example
 * getNextValidStatuses(ORDER_STATUS.OPEN)
 * // ['IN_PROGRESS', 'AWAITING_PAYMENT', 'CANCELED']
 */
export const getNextValidStatuses = currentStatus => {
  return ORDER_STATUS_TRANSITIONS[currentStatus] || [];
};

/**
 * ===================================================
 * Helpers de Validação
 * ===================================================
 */

/**
 * Verifica se uma comanda pode ser editada (adicionar/remover itens)
 *
 * @param {string} status - Status da comanda
 * @returns {boolean}
 */
export const canEditOrder = status => {
  return [ORDER_STATUS.OPEN, ORDER_STATUS.IN_PROGRESS].includes(status);
};

/**
 * Verifica se uma comanda pode ser fechada (processar pagamento)
 *
 * @param {string} status - Status da comanda
 * @returns {boolean}
 */
export const canCloseOrder = status => {
  return [
    ORDER_STATUS.OPEN,
    ORDER_STATUS.IN_PROGRESS,
    ORDER_STATUS.AWAITING_PAYMENT,
  ].includes(status);
};

/**
 * Verifica se uma comanda pode ser cancelada
 *
 * @param {string} status - Status da comanda
 * @returns {boolean}
 */
export const canCancelOrder = status => {
  // Pode cancelar tudo exceto comandas já canceladas
  return status !== ORDER_STATUS.CANCELED;
};

/**
 * Verifica se uma comanda está finalizada (terminal)
 *
 * @param {string} status - Status da comanda
 * @returns {boolean}
 */
export const isOrderFinalized = status => {
  return [ORDER_STATUS.CLOSED, ORDER_STATUS.CANCELED].includes(status);
};

/**
 * Verifica se uma comanda está ativa (não finalizada)
 *
 * @param {string} status - Status da comanda
 * @returns {boolean}
 */
export const isOrderActive = status => {
  return !isOrderFinalized(status);
};

/**
 * ===================================================
 * Helpers de UI
 * ===================================================
 */

/**
 * Retorna o objeto completo de estilo para um status
 *
 * @param {string} status - Status da comanda
 * @returns {object} - Objeto com bg, text, border, dot
 */
export const getStatusStyles = status => {
  return (
    ORDER_STATUS_COLORS[status] || {
      bg: 'bg-gray-100 dark:bg-gray-900/30',
      text: 'text-gray-700 dark:text-gray-300',
      border: 'border-gray-300 dark:border-gray-700',
      dot: 'bg-gray-500',
    }
  );
};

/**
 * Retorna o label formatado de um status
 *
 * @param {string} status - Status da comanda
 * @returns {string} - Label para exibição
 */
export const getStatusLabel = status => {
  return ORDER_STATUS_LABELS[status] || 'Status Desconhecido';
};

/**
 * Retorna o ícone de um status
 *
 * @param {string} status - Status da comanda
 * @returns {string} - Nome do ícone Lucide
 */
export const getStatusIcon = status => {
  return ORDER_STATUS_ICONS[status] || 'HelpCircle';
};

/**
 * ===================================================
 * Filtros e Queries
 * ===================================================
 */

/**
 * Status que devem aparecer na listagem de "Comandas Ativas"
 */
export const ACTIVE_ORDER_STATUSES = [
  ORDER_STATUS.OPEN,
  ORDER_STATUS.IN_PROGRESS,
  ORDER_STATUS.AWAITING_PAYMENT,
];

/**
 * Status que devem aparecer na listagem de "Histórico"
 */
export const FINALIZED_ORDER_STATUSES = [
  ORDER_STATUS.CLOSED,
  ORDER_STATUS.CANCELED,
];

/**
 * Retorna um filtro Supabase para comandas ativas
 *
 * @example
 * const { data } = await supabase
 *   .from('orders')
 *   .select('*')
 *   .in('status', ACTIVE_ORDER_STATUSES)
 */
export const getActiveOrdersFilter = () => ACTIVE_ORDER_STATUSES;

/**
 * Retorna um filtro Supabase para comandas finalizadas
 */
export const getFinalizedOrdersFilter = () => FINALIZED_ORDER_STATUSES;

/**
 * ===================================================
 * Validação de Status (para DTOs)
 * ===================================================
 */

/**
 * Valida se um status é válido
 *
 * @param {string} status - Status a validar
 * @returns {boolean}
 */
export const isValidStatus = status => {
  return Object.values(ORDER_STATUS).includes(status);
};

/**
 * Retorna todos os status possíveis como array
 *
 * @returns {string[]}
 */
export const getAllStatuses = () => {
  return Object.values(ORDER_STATUS);
};

/**
 * ===================================================
 * Compatibilidade com código legado
 * ===================================================
 */

/**
 * Mapeia status antigos (lowercase string) para novos (ENUM)
 * Usado durante a migração
 */
export const LEGACY_STATUS_MAP = Object.freeze({
  open: ORDER_STATUS.OPEN,
  closed: ORDER_STATUS.CLOSED,
  canceled: ORDER_STATUS.CANCELED,
  cancelled: ORDER_STATUS.CANCELED, // Typo comum
});

/**
 * Converte status legado para o novo formato
 *
 * @param {string} legacyStatus - Status no formato antigo
 * @returns {string} - Status no formato novo
 */
export const normalizeLegacyStatus = legacyStatus => {
  if (!legacyStatus) return ORDER_STATUS.OPEN;

  const normalized = legacyStatus.toLowerCase();
  return LEGACY_STATUS_MAP[normalized] || ORDER_STATUS.OPEN;
};

/**
 * ===================================================
 * Estatísticas e Análises
 * ===================================================
 */

/**
 * Ordena status por prioridade de exibição
 */
export const STATUS_DISPLAY_ORDER = [
  ORDER_STATUS.AWAITING_PAYMENT, // Prioridade máxima
  ORDER_STATUS.IN_PROGRESS,
  ORDER_STATUS.OPEN,
  ORDER_STATUS.CLOSED,
  ORDER_STATUS.CANCELED,
];

/**
 * Retorna a ordem de prioridade de um status
 *
 * @param {string} status - Status da comanda
 * @returns {number} - Índice de prioridade (menor = mais importante)
 */
export const getStatusPriority = status => {
  const index = STATUS_DISPLAY_ORDER.indexOf(status);
  return index === -1 ? 999 : index;
};

/**
 * ===================================================
 * Export Default (para imports mais limpos)
 * ===================================================
 */
export default {
  // Enums
  ORDER_STATUS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  ORDER_STATUS_ICONS,
  ORDER_STATUS_DESCRIPTIONS,
  ORDER_STATUS_TRANSITIONS,

  // Validações
  isValidTransition,
  getNextValidStatuses,
  canEditOrder,
  canCloseOrder,
  canCancelOrder,
  isOrderFinalized,
  isOrderActive,
  isValidStatus,
  getAllStatuses,

  // UI
  getStatusStyles,
  getStatusLabel,
  getStatusIcon,
  getStatusPriority,

  // Filtros
  ACTIVE_ORDER_STATUSES,
  FINALIZED_ORDER_STATUSES,
  getActiveOrdersFilter,
  getFinalizedOrdersFilter,

  // Legado
  normalizeLegacyStatus,
};
