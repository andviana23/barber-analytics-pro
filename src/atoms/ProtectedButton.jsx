import React from 'react';
import PropTypes from 'prop-types';
import useUserPermissions from '../hooks/useUserPermissions';
import { Tooltip } from './Tooltip/Tooltip';

/**
 * ProtectedButton - Botão com controle de acesso por perfil
 *
 * Componente atom que renderiza botão apenas se o usuário tiver as permissões necessárias.
 * Segue Design System com variantes temáticas e estados.
 *
 * @component
 * @example
 * ```jsx
 * <ProtectedButton
 *   requiredRoles={['gerente', 'admin']}
 *   onClick={handleCadastrarServico}
 *   variant="primary"
 * >
 *   Novo Serviço
 * </ProtectedButton>
 * ```
 */
const ProtectedButton = ({
  children,
  onClick,
  requiredRoles = [],
  requiredPermissions = [],
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  type = 'button',
  className = '',
  showTooltipWhenHidden = true,
  tooltipMessage = 'Você não tem permissão para esta ação',
  icon: Icon,
  iconPosition = 'left',
  fullWidth = false,
  ...props
}) => {
  const { hasRole, hasPermission, user } = useUserPermissions();

  // Verifica se tem pelo menos uma das roles necessárias
  const hasRequiredRole =
    requiredRoles.length === 0 || requiredRoles.some(role => hasRole(role));

  // Verifica se tem todas as permissões necessárias
  const hasRequiredPermissions =
    requiredPermissions.length === 0 ||
    requiredPermissions.every(permission => hasPermission(permission));

  // Usuário tem acesso?
  const hasAccess = hasRequiredRole && hasRequiredPermissions;

  // Classes base do botão
  const baseClasses = `
    inline-flex items-center justify-center
    font-medium rounded-md
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    ${fullWidth ? 'w-full' : ''}
  `;

  // Classes de tamanho
  const sizeClasses = {
    xs: 'px-2.5 py-1.5 text-xs gap-1',
    sm: 'px-3 py-2 text-sm gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-5 py-3 text-base gap-2',
    xl: 'px-6 py-3.5 text-base gap-2.5',
  };

  // Classes de variante
  const variantClasses = {
    primary: `
      btn-theme-primary
      bg-primary hover:bg-primary-hover
      text-white
      focus:ring-primary/50
      shadow-sm hover:shadow-md
    `,
    secondary: `
      btn-theme-secondary
      bg-light-surface dark:bg-dark-surface
      border border-light-border dark:border-dark-border
      text-theme-primary
      hover:bg-light-bg dark:hover:bg-dark-bg
      focus:ring-primary/30
    `,
    danger: `
      bg-red-600 hover:bg-red-700
      text-white
      focus:ring-red-500/50
      shadow-sm hover:shadow-md
    `,
    success: `
      bg-green-600 hover:bg-green-700
      text-white
      focus:ring-green-500/50
      shadow-sm hover:shadow-md
    `,
    ghost: `
      text-theme-primary
      hover:bg-light-bg dark:hover:bg-dark-bg
      focus:ring-primary/30
    `,
    outline: `
      border-2 border-primary
      text-primary
      hover:bg-primary hover:text-white
      focus:ring-primary/30
    `,
  };

  // Loading spinner
  const LoadingSpinner = () => (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  // Renderiza o botão
  const ButtonContent = () => (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading || !hasAccess}
      className={`
        ${baseClasses}
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
      aria-label={typeof children === 'string' ? children : undefined}
      aria-busy={loading}
      {...props}
    >
      {loading && <LoadingSpinner />}

      {!loading && Icon && iconPosition === 'left' && (
        <Icon className="w-4 h-4" aria-hidden="true" />
      )}

      {children}

      {!loading && Icon && iconPosition === 'right' && (
        <Icon className="w-4 h-4" aria-hidden="true" />
      )}
    </button>
  );

  // Se não tem acesso e não deve mostrar, retorna null
  if (!hasAccess && !showTooltipWhenHidden) {
    return null;
  }

  // Se não tem acesso mas deve mostrar tooltip
  if (!hasAccess && showTooltipWhenHidden) {
    return (
      <Tooltip content={tooltipMessage} position="top">
        <div className="inline-block">
          <ButtonContent />
        </div>
      </Tooltip>
    );
  }

  // Tem acesso, renderiza normalmente
  return <ButtonContent />;
};

ProtectedButton.propTypes = {
  /** Conteúdo do botão */
  children: PropTypes.node.isRequired,
  /** Função chamada ao clicar */
  onClick: PropTypes.func,
  /** Array de roles necessárias (usuário precisa de pelo menos uma) */
  requiredRoles: PropTypes.arrayOf(
    PropTypes.oneOf(['admin', 'gerente', 'recepcionista', 'profissional'])
  ),
  /** Array de permissões necessárias (usuário precisa de todas) */
  requiredPermissions: PropTypes.arrayOf(PropTypes.string),
  /** Variante visual do botão */
  variant: PropTypes.oneOf([
    'primary',
    'secondary',
    'danger',
    'success',
    'ghost',
    'outline',
  ]),
  /** Tamanho do botão */
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  /** Se o botão está desabilitado */
  disabled: PropTypes.bool,
  /** Se está em estado de loading */
  loading: PropTypes.bool,
  /** Tipo do botão HTML */
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  /** Classes CSS adicionais */
  className: PropTypes.string,
  /** Se deve mostrar tooltip quando escondido */
  showTooltipWhenHidden: PropTypes.bool,
  /** Mensagem do tooltip quando sem permissão */
  tooltipMessage: PropTypes.string,
  /** Ícone do botão (componente) */
  icon: PropTypes.elementType,
  /** Posição do ícone */
  iconPosition: PropTypes.oneOf(['left', 'right']),
  /** Se o botão deve ocupar largura total */
  fullWidth: PropTypes.bool,
};

export default ProtectedButton;
