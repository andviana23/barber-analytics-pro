/**
 * @file ProtectedButton.jsx
 * @description Componente Atom - Botão com controle de permissões
 * @module Components/Atoms
 * @author Andrey Viana
 * @date 2025-10-24
 */

import React from 'react';
import PropTypes from 'prop-types';
import Button from './Button';
import useUserPermissions from '../../hooks/useUserPermissions';
import { hasRole } from '../../utils/permissions';

/**
 * Botão que renderiza condicionalmente baseado em permissões
 * Segue padrões do Design System e controle de acesso
 */
const ProtectedButton = ({
  requiredRoles = [],
  requiredPermission = null,
  fallback = null,
  children,
  ...buttonProps
}) => {
  const { user, loading } = useUserPermissions();

  // Aguarda carregamento do usuário
  if (loading) {
    return fallback;
  }

  // Verifica se usuário não está autenticado
  if (!user) {
    return fallback;
  }

  // Verifica permissão via nome (ex: 'VIEW_CASH_REGISTER')
  if (requiredPermission) {
    const { checkPermission } = useUserPermissions();
    if (!checkPermission(requiredPermission)) {
      return fallback;
    }
  }

  // Verifica permissão via roles
  if (requiredRoles.length > 0) {
    if (!hasRole(user, requiredRoles)) {
      return fallback;
    }
  }

  // Usuário tem permissão, renderiza o botão
  return <Button {...buttonProps}>{children}</Button>;
};

ProtectedButton.propTypes = {
  /** Perfis permitidos (array de strings) */
  requiredRoles: PropTypes.arrayOf(PropTypes.string),
  /** Nome da permissão requerida (ex: 'VIEW_CASH_REGISTER') */
  requiredPermission: PropTypes.string,
  /** Componente a renderizar se não tiver permissão */
  fallback: PropTypes.node,
  /** Conteúdo do botão */
  children: PropTypes.node.isRequired,
};

export default ProtectedButton;
