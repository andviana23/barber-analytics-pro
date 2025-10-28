/**
 * @file permissions.js
 * @description Utilitários para controle de permissões e acesso
 * @module Utils
 * @author Andrey Viana
 * @date 2025-10-24
 */

/**
 * Perfis de usuário do sistema
 */
export const ROLES = {
  ADMIN: 'administrador',
  GERENTE: 'gerente',
  RECEPCIONISTA: 'recepcionista',
  PROFISSIONAL: 'profissional',
  BARBEIRO: 'barbeiro', // Alias para profissional
};

/**
 * Permissões por funcionalidade
 */
export const PERMISSIONS = {
  // Caixa
  VIEW_CASH_REGISTER: [ROLES.RECEPCIONISTA, ROLES.GERENTE, ROLES.ADMIN],
  OPEN_CASH_REGISTER: [ROLES.RECEPCIONISTA, ROLES.GERENTE, ROLES.ADMIN],
  CLOSE_CASH_REGISTER: [ROLES.RECEPCIONISTA, ROLES.GERENTE, ROLES.ADMIN],

  // Comandas
  CREATE_ORDER: [
    ROLES.RECEPCIONISTA,
    ROLES.GERENTE,
    ROLES.ADMIN,
    ROLES.PROFISSIONAL,
    ROLES.BARBEIRO,
  ],
  VIEW_ALL_ORDERS: [ROLES.RECEPCIONISTA, ROLES.GERENTE, ROLES.ADMIN],
  VIEW_OWN_ORDERS: [ROLES.PROFISSIONAL, ROLES.BARBEIRO],
  CLOSE_ORDER: [ROLES.RECEPCIONISTA, ROLES.GERENTE, ROLES.ADMIN],
  CANCEL_ORDER: [ROLES.GERENTE, ROLES.ADMIN],

  // Serviços
  VIEW_SERVICES: [
    ROLES.RECEPCIONISTA,
    ROLES.GERENTE,
    ROLES.ADMIN,
    ROLES.PROFISSIONAL,
    ROLES.BARBEIRO,
  ],
  CREATE_SERVICE: [ROLES.GERENTE, ROLES.ADMIN],
  EDIT_SERVICE: [ROLES.GERENTE, ROLES.ADMIN],
  DELETE_SERVICE: [ROLES.GERENTE, ROLES.ADMIN],

  // Comissões
  VIEW_ALL_COMMISSIONS: [ROLES.GERENTE, ROLES.ADMIN],
  VIEW_OWN_COMMISSIONS: [ROLES.PROFISSIONAL, ROLES.BARBEIRO],

  // Financeiro
  VIEW_FINANCIAL: [ROLES.GERENTE, ROLES.ADMIN],
  MANAGE_REVENUES: [ROLES.GERENTE, ROLES.ADMIN],
  MANAGE_EXPENSES: [ROLES.GERENTE, ROLES.ADMIN],
};

/**
 * Verifica se usuário tem um dos perfis especificados
 *
 * @param {Object} user - Objeto do usuário
 * @param {string|string[]} roles - Perfil ou array de perfis permitidos
 * @returns {boolean}
 */
export const hasRole = (user, roles) => {
  if (!user || !user.role) return false;

  const userRole = user.role.toLowerCase();
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return allowedRoles.some(role => role.toLowerCase() === userRole);
};

/**
 * Verifica se usuário tem permissão para uma funcionalidade
 *
 * @param {Object} user - Objeto do usuário
 * @param {string} permission - Nome da permissão (chave de PERMISSIONS)
 * @returns {boolean}
 */
export const hasPermission = (user, permission) => {
  if (!user || !permission) return false;

  const allowedRoles = PERMISSIONS[permission];
  if (!allowedRoles) {
    console.warn(`[Permissions] Permissão desconhecida: ${permission}`);
    return false;
  }

  return hasRole(user, allowedRoles);
};

/**
 * Verifica se usuário pode gerenciar caixa
 *
 * @param {Object} user - Objeto do usuário
 * @returns {boolean}
 */
export const canManageCashRegister = user => {
  return hasPermission(user, 'VIEW_CASH_REGISTER');
};

/**
 * Verifica se usuário pode abrir caixa
 *
 * @param {Object} user - Objeto do usuário
 * @returns {boolean}
 */
export const canOpenCashRegister = user => {
  return hasPermission(user, 'OPEN_CASH_REGISTER');
};

/**
 * Verifica se usuário pode fechar caixa
 *
 * @param {Object} user - Objeto do usuário
 * @returns {boolean}
 */
export const canCloseCashRegister = user => {
  return hasPermission(user, 'CLOSE_CASH_REGISTER');
};

/**
 * Verifica se usuário pode gerenciar serviços
 *
 * @param {Object} user - Objeto do usuário
 * @returns {boolean}
 */
export const canManageServices = user => {
  return hasPermission(user, 'CREATE_SERVICE');
};

/**
 * Verifica se usuário pode criar comandas
 *
 * @param {Object} user - Objeto do usuário
 * @returns {boolean}
 */
export const canCreateOrder = user => {
  return hasPermission(user, 'CREATE_ORDER');
};

/**
 * Verifica se usuário pode visualizar todas as comandas
 *
 * @param {Object} user - Objeto do usuário
 * @returns {boolean}
 */
export const canViewAllOrders = user => {
  return hasPermission(user, 'VIEW_ALL_ORDERS');
};

/**
 * Verifica se usuário pode fechar comandas
 *
 * @param {Object} user - Objeto do usuário
 * @returns {boolean}
 */
export const canCloseOrder = user => {
  return hasPermission(user, 'CLOSE_ORDER');
};

/**
 * Verifica se usuário pode cancelar comandas
 *
 * @param {Object} user - Objeto do usuário
 * @returns {boolean}
 */
export const canCancelOrder = user => {
  return hasPermission(user, 'CANCEL_ORDER');
};

/**
 * Verifica se usuário é administrador
 *
 * @param {Object} user - Objeto do usuário
 * @returns {boolean}
 */
export const isAdmin = user => {
  return hasRole(user, ROLES.ADMIN);
};

/**
 * Verifica se usuário é gerente
 *
 * @param {Object} user - Objeto do usuário
 * @returns {boolean}
 */
export const isGerente = user => {
  return hasRole(user, ROLES.GERENTE);
};

/**
 * Verifica se usuário é recepcionista
 *
 * @param {Object} user - Objeto do usuário
 * @returns {boolean}
 */
export const isRecepcionista = user => {
  return hasRole(user, ROLES.RECEPCIONISTA);
};

/**
 * Verifica se usuário é profissional/barbeiro
 *
 * @param {Object} user - Objeto do usuário
 * @returns {boolean}
 */
export const isProfissional = user => {
  return hasRole(user, [ROLES.PROFISSIONAL, ROLES.BARBEIRO]);
};

/**
 * Retorna nome amigável do perfil
 *
 * @param {string} role - Perfil do usuário
 * @returns {string}
 */
export const getRoleName = role => {
  const roleNames = {
    [ROLES.ADMIN]: 'Administrador',
    [ROLES.GERENTE]: 'Gerente',
    [ROLES.RECEPCIONISTA]: 'Recepcionista',
    [ROLES.PROFISSIONAL]: 'Profissional',
    [ROLES.BARBEIRO]: 'Barbeiro',
  };

  return roleNames[role?.toLowerCase()] || 'Não definido';
};

/**
 * Filtra lista de comandas baseado nas permissões do usuário
 *
 * @param {Array} orders - Lista de comandas
 * @param {Object} user - Objeto do usuário
 * @returns {Array}
 */
export const filterOrdersByPermission = (orders, user) => {
  if (!user || !orders) return [];

  // Gerente e Admin veem todas
  if (canViewAllOrders(user)) {
    return orders;
  }

  // Profissional vê apenas as suas
  if (isProfissional(user)) {
    return orders.filter(
      order =>
        order.professional_id === user.id ||
        order.professional_id === user.professional_id
    );
  }

  return [];
};

export default {
  ROLES,
  PERMISSIONS,
  hasRole,
  hasPermission,
  canManageCashRegister,
  canOpenCashRegister,
  canCloseCashRegister,
  canManageServices,
  canCreateOrder,
  canViewAllOrders,
  canCloseOrder,
  canCancelOrder,
  isAdmin,
  isGerente,
  isRecepcionista,
  isProfissional,
  getRoleName,
  filterOrdersByPermission,
};
