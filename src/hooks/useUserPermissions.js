/**
 * @file useUserPermissions.js
 * @description Hook para gerenciar permissões do usuário logado
 * @module Hooks
 * @author Andrey Viana
 * @date 2025-10-24
 */

import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
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
  hasPermission,
  getRoleName,
} from '../utils/permissions';

/**
 * Hook para controle de permissões do usuário logado
 *
 * @returns {Object} Objeto com permissões e informações do usuário
 */
const useUserPermissions = () => {
  const { user, loading } = useAuth();

  // Memoiza permissões para evitar recálculos desnecessários
  const permissions = useMemo(() => {
    if (!user) {
      return {
        // Caixa
        canManageCashRegister: false,
        canOpenCashRegister: false,
        canCloseCashRegister: false,

        // Comandas
        canCreateOrder: false,
        canViewAllOrders: false,
        canCloseOrder: false,
        canCancelOrder: false,

        // Serviços
        canManageServices: false,
        canCreateService: false, // Alias para compatibilidade

        // Perfis
        isAdmin: false,
        isGerente: false,
        isRecepcionista: false,
        isProfissional: false,

        // Dados do usuário
        role: null,
        roleName: 'Não autenticado',
        userId: null,
        unitId: null,
      };
    }

    // 🔧 CORREÇÃO: Transformar objeto user do Supabase para formato esperado
    // O Supabase retorna user.user_metadata.role mas permissions.js espera user.role
    const userMetadataRole = user.user_metadata?.role || user.role;

    // 🔧 Normalizar role: "admin" → "administrador" para compatibilidade
    const normalizedRole =
      userMetadataRole === 'admin' ? 'administrador' : userMetadataRole;

    const transformedUser = {
      ...user,
      role: normalizedRole,
      id: user.id,
      professional_id: user.professional_id,
      unit_id: user.unit_id,
    };

    return {
      // Caixa
      canManageCashRegister: canManageCashRegister(transformedUser),
      canOpenCashRegister: canOpenCashRegister(transformedUser),
      canCloseCashRegister: canCloseCashRegister(transformedUser),

      // Comandas
      canCreateOrder: canCreateOrder(transformedUser),
      canViewAllOrders: canViewAllOrders(transformedUser),
      canCloseOrder: canCloseOrder(transformedUser),
      canCancelOrder: canCancelOrder(transformedUser),

      // Serviços
      canManageServices: canManageServices(transformedUser),
      canCreateService: canManageServices(transformedUser), // Alias para compatibilidade

      // Perfis
      isAdmin: isAdmin(transformedUser),
      isGerente: isGerente(transformedUser),
      isRecepcionista: isRecepcionista(transformedUser),
      isProfissional: isProfissional(transformedUser),

      // Dados do usuário
      role: normalizedRole,
      roleName: getRoleName(normalizedRole),
      userId: user.id,
      unitId: user.unit_id,
      professionalId: user.professional_id,
    };
  }, [user]);

  /**
   * Verifica se usuário tem uma permissão específica
   *
   * @param {string} permission - Nome da permissão
   * @returns {boolean}
   */
  const checkPermission = permission => {
    return hasPermission(user, permission);
  };

  /**
   * Verifica se usuário tem uma role específica
   *
   * @param {string} role - Nome da role ('admin', 'gerente', 'recepcionista', 'profissional')
   * @returns {boolean}
   */
  const hasRole = role => {
    if (!user || !user.role) return false;
    return user.role.toLowerCase() === role.toLowerCase();
  };

  return {
    ...permissions,
    hasPermission: checkPermission,
    hasRole,
    checkPermission, // Mantém retrocompatibilidade
    user: user
      ? {
          ...user,
          role: permissions.role, // Usa o role normalizado
        }
      : null,
    loading,
    isAuthenticated: !!user,
  };
};

export default useUserPermissions;
