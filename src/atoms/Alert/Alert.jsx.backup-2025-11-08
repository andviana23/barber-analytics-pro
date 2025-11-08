import React from 'react';
import { Info, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';

/**
 * Alert - Componente de feedback visual
 *
 * 🎯 DESIGN SYSTEM COMPLIANCE 100%
 * - Tokens de cores do Design System
 * - 4 tipos: info, success, warning, error
 * - Ícones Lucide React
 * - Dark mode nativo
 * - Acessibilidade (role="alert")
 * - Responsivo
 *
 * @component
 * @param {Object} props
 * @param {'info'|'success'|'warning'|'error'} props.type - Tipo do alert
 * @param {string} props.message - Mensagem principal *
 * @param {string} props.title - Título opcional (bold)
 * @param {React.Component} props.icon - Ícone customizado (sobrescreve padrão)
 */
export const Alert = ({ type = 'info', message, title, icon: CustomIcon }) => {
  // Mapeamento de tipos para configurações visuais
  const configs = {
    info: {
      Icon: Info,
      bgLight: 'bg-blue-50',
      bgDark: 'dark:bg-blue-900/20',
      borderLight: 'border-blue-200',
      borderDark: 'dark:border-blue-800',
      textLight: 'text-blue-800',
      textDark: 'dark:text-blue-200',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    success: {
      Icon: CheckCircle,
      bgLight: 'bg-green-50',
      bgDark: 'dark:bg-green-900/20',
      borderLight: 'border-green-200',
      borderDark: 'dark:border-green-800',
      textLight: 'text-green-800',
      textDark: 'dark:text-green-200',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    warning: {
      Icon: AlertTriangle,
      bgLight: 'bg-yellow-50',
      bgDark: 'dark:bg-yellow-900/20',
      borderLight: 'border-yellow-200',
      borderDark: 'dark:border-yellow-800',
      textLight: 'text-yellow-800',
      textDark: 'dark:text-yellow-200',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
    },
    error: {
      Icon: AlertCircle,
      bgLight: 'bg-red-50',
      bgDark: 'dark:bg-red-900/20',
      borderLight: 'border-red-200',
      borderDark: 'dark:border-red-800',
      textLight: 'text-red-800',
      textDark: 'dark:text-red-200',
      iconColor: 'text-red-600 dark:text-red-400',
    },
  };

  const config = configs[type] || configs.info;
  const Icon = CustomIcon || config.Icon;

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-lg border p-4 ${config.bgLight} ${config.bgDark} ${config.borderLight} ${config.borderDark} ${config.textLight} ${config.textDark} `}
    >
      {/* Ícone */}
      <Icon className={`mt-0.5 h-5 w-5 flex-shrink-0 ${config.iconColor}`} />

      {/* Conteúdo */}
      <div className="flex-1 space-y-1">
        {title && (
          <p className="text-sm font-semibold leading-tight">{title}</p>
        )}
        <p
          className={`text-sm leading-relaxed ${title ? '' : 'leading-tight'}`}
        >
          {message}
        </p>
      </div>
    </div>
  );
};
