import React from 'react';
import { motion } from 'framer-motion';
import {
  FileX,
  Search,
  Users,
  Calendar,
  DollarSign,
  BarChart3,
  Settings,
  Wifi,
  AlertCircle,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { AnimatedButton } from '../../utils/animations';
const emptyStateIcons = {
  data: FileX,
  search: Search,
  users: Users,
  calendar: Calendar,
  finance: DollarSign,
  reports: BarChart3,
  settings: Settings,
  connection: Wifi,
  error: AlertCircle,
};
const emptyStateVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};
const illustrationVariants = {
  initial: {
    scale: 0.8,
    opacity: 0,
  },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      delay: 0.2,
      duration: 0.6,
      ease: 'backOut',
    },
  },
};
export function EmptyState({
  type = 'data',
  title,
  description,
  actionLabel,
  onAction,
  icon: CustomIcon,
  illustration,
  size = 'medium',
  className = '',
}) {
  const Icon = CustomIcon || emptyStateIcons[type];
  const sizeClasses = {
    small: {
      container: 'py-8 px-4',
      icon: 'w-12 h-12',
      title: 'text-lg',
      description: 'text-sm',
      button: 'px-4 py-2 text-sm',
    },
    medium: {
      container: 'py-12 px-6',
      icon: 'w-16 h-16',
      title: 'text-xl',
      description: 'text-base',
      button: 'px-6 py-3',
    },
    large: {
      container: 'py-16 px-8',
      icon: 'w-20 h-20',
      title: 'text-2xl',
      description: 'text-lg',
      button: 'px-8 py-4',
    },
  };
  const classes = sizeClasses[size];
  return (
    <motion.div
      variants={emptyStateVariants}
      initial="initial"
      animate="animate"
      className={`mx-auto flex max-w-md flex-col items-center text-center ${classes.container} ${className} `}
    >
      {/* Icon ou Illustration */}
      <motion.div
        variants={illustrationVariants}
        className={`mb-6 flex items-center justify-center rounded-full ${classes.icon} border-2 border-light-border bg-light-bg dark:border-dark-border dark:bg-dark-bg`}
      >
        {illustration ? (
          <div className="text-4xl">{illustration}</div>
        ) : (
          <Icon
            className={`${classes.icon} text-text-light-secondary dark:text-text-dark-secondary`}
          />
        )}
      </motion.div>

      {/* Title */}
      {title && (
        <h3
          className={`mb-2 font-semibold text-text-light-primary dark:text-text-dark-primary ${classes.title} `}
        >
          {title}
        </h3>
      )}

      {/* Description */}
      {description && (
        <p
          className={`mb-6 leading-relaxed text-text-light-secondary dark:text-text-dark-secondary ${classes.description} `}
        >
          {description}
        </p>
      )}

      {/* Action Button */}
      {actionLabel && onAction && (
        <AnimatedButton
          onClick={onAction}
          className={`flex items-center gap-2 rounded-lg bg-primary font-medium text-white transition-colors duration-200 hover:bg-primary-hover ${classes.button} `}
        >
          <Plus className="h-4 w-4" />
          {actionLabel}
        </AnimatedButton>
      )}
    </motion.div>
  );
}

// Estados específicos pré-configurados
export function NoDataState({
  title,
  description,
  onRefresh,
  onAdd,
  addLabel = 'Adicionar',
}) {
  return (
    <div className="space-y-4">
      <EmptyState
        type="data"
        title={title || 'Nenhum dado encontrado'}
        description={
          description ||
          'Não há informações disponíveis para exibir no momento.'
        }
        illustration="📊"
        size="medium"
      />
      <div className="flex justify-center gap-3">
        {onRefresh && (
          <AnimatedButton
            onClick={onRefresh}
            className="flex items-center gap-2 rounded-lg border border-light-border px-4 py-2 transition-colors hover:bg-light-bg dark:border-dark-border dark:hover:bg-dark-bg"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </AnimatedButton>
        )}
        {onAdd && (
          <AnimatedButton
            onClick={onAdd}
            className="text-dark-text-primary flex items-center gap-2 rounded-lg bg-primary px-4 py-2 transition-colors hover:bg-primary-hover"
          >
            <Plus className="h-4 w-4" />
            {addLabel}
          </AnimatedButton>
        )}
      </div>
    </div>
  );
}
export function SearchEmptyState({ query, onClear }) {
  return (
    <EmptyState
      type="search"
      title="Nenhum resultado encontrado"
      description={`Não encontramos nada para "${query}". Tente ajustar sua busca ou usar outros termos.`}
      actionLabel="Limpar busca"
      onAction={onClear}
      illustration="🔍"
      size="medium"
    />
  );
}
export function ErrorState({
  title = 'Algo deu errado',
  description = 'Ocorreu um erro ao carregar os dados. Tente novamente.',
  onRetry,
  onSupport,
}) {
  return (
    <div className="space-y-4">
      <EmptyState
        type="error"
        title={title}
        description={description}
        illustration="⚠️"
        size="medium"
      />
      <div className="flex justify-center gap-3">
        {onRetry && (
          <AnimatedButton
            onClick={onRetry}
            className="text-dark-text-primary flex items-center gap-2 rounded-lg bg-primary px-4 py-2 transition-colors hover:bg-primary-hover"
          >
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </AnimatedButton>
        )}
        {onSupport && (
          <AnimatedButton
            onClick={onSupport}
            className="flex items-center gap-2 rounded-lg border border-light-border px-4 py-2 transition-colors hover:bg-light-bg dark:border-dark-border dark:hover:bg-dark-bg"
          >
            Suporte
          </AnimatedButton>
        )}
      </div>
    </div>
  );
}
export function LoadingState({ message = 'Carregando...' }) {
  return (
    <motion.div
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      className="flex flex-col items-center justify-center py-12"
    >
      <motion.div
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear',
        }}
        className="mb-4 h-8 w-8 rounded-full border-2 border-primary border-t-transparent"
      />
      <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
        {message}
      </p>
    </motion.div>
  );
}
