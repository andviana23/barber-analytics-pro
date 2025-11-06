import React from 'react';
import PropTypes from 'prop-types';
import { Loader2 } from 'lucide-react';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon: Icon,
  className = '',
  ...props
}) => {
  const baseClasses =
    'font-medium rounded-lg transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2';

  const variants = {
    primary: 'bg-primary hover:bg-primary-hover text-white',
    secondary:
      'bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-text-light-primary dark:text-text-dark-primary hover:bg-primary/10 hover:border-primary/20',
    success:
      'bg-feedback-light-success dark:bg-feedback-dark-success hover:opacity-90 text-white',
    error:
      'bg-feedback-light-error dark:bg-feedback-dark-error hover:opacity-90 text-white',
    danger:
      'bg-feedback-light-error dark:bg-feedback-dark-error hover:opacity-90 text-white',
    warning:
      'bg-feedback-light-warning dark:bg-feedback-dark-warning hover:opacity-90 text-white',
    ghost:
      'text-text-light-primary dark:text-text-dark-primary hover:bg-primary/10',
    outline:
      'border-2 border-primary text-primary hover:bg-primary hover:text-white',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
    xl: 'h-6 w-6',
  };

  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;
  const isDisabled = disabled || loading;

  // Filtrar apenas atributos válidos para button
  const validButtonProps = {};
  const validButtonAttributes = [
    'type',
    'id',
    'name',
    'value',
    'disabled',
    'onClick',
    'onFocus',
    'onBlur',
    'onKeyDown',
    'onKeyUp',
    'title',
    'aria-label',
    'aria-describedby',
    'aria-expanded',
    'aria-haspopup',
    'autoFocus',
    'tabIndex',
    'form',
    'formAction',
    'formMethod',
    'formNoValidate',
    'formTarget',
  ];

  Object.keys(props).forEach(key => {
    if (validButtonAttributes.includes(key)) {
      validButtonProps[key] = props[key];
    }
  });

  return (
    <button className={classes} disabled={isDisabled} {...validButtonProps}>
      {loading ? (
        <Loader2 className={`${iconSizes[size]} animate-spin`} />
      ) : (
        Icon && <Icon className={iconSizes[size]} />
      )}
      {children}
    </button>
  );
};

Button.propTypes = {
  /** Conteúdo do botão (texto ou elementos JSX) */
  children: PropTypes.node.isRequired,

  /** Variante visual do botão */
  variant: PropTypes.oneOf([
    'primary',
    'secondary',
    'success',
    'error',
    'danger',
    'warning',
    'ghost',
    'outline',
  ]),

  /** Tamanho do botão */
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),

  /** Se o botão está desabilitado */
  disabled: PropTypes.bool,

  /** Se o botão está em estado de carregamento */
  loading: PropTypes.bool,

  /** Componente de ícone do Lucide React ou similar */
  icon: PropTypes.elementType,

  /** Classes CSS adicionais */
  className: PropTypes.string,

  /** Tipo do botão HTML */
  type: PropTypes.oneOf(['button', 'submit', 'reset']),

  /** Callback executado ao clicar no botão */
  onClick: PropTypes.func,

  /** ID do elemento HTML */
  id: PropTypes.string,

  /** Nome do botão para formulários */
  name: PropTypes.string,

  /** Valor do botão para formulários */
  value: PropTypes.string,

  /** Texto de acessibilidade */
  'aria-label': PropTypes.string,

  /** Descrição detalhada para acessibilidade */
  'aria-describedby': PropTypes.string,

  /** Indica se o botão controla um elemento expandido */
  'aria-expanded': PropTypes.bool,

  /** Indica se o botão controla um popup */
  'aria-haspopup': PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.oneOf(['menu', 'listbox', 'tree', 'grid', 'dialog']),
  ]),
};

Button.defaultProps = {
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false,
  icon: null,
  className: '',
  type: 'button',
  onClick: undefined,
  id: undefined,
  name: undefined,
  value: undefined,
  'aria-label': undefined,
  'aria-describedby': undefined,
  'aria-expanded': undefined,
  'aria-haspopup': undefined,
};

export { Button };
