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
  Plus
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
  error: AlertCircle
};

const emptyStateVariants = {
  initial: {
    opacity: 0,
    y: 20
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut'
    }
  }
};

const illustrationVariants = {
  initial: {
    scale: 0.8,
    opacity: 0
  },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      delay: 0.2,
      duration: 0.6,
      ease: 'backOut'
    }
  }
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
  className = ''
}) {
  const Icon = CustomIcon || emptyStateIcons[type];
  
  const sizeClasses = {
    small: {
      container: 'py-8 px-4',
      icon: 'w-12 h-12',
      title: 'text-lg',
      description: 'text-sm',
      button: 'px-4 py-2 text-sm'
    },
    medium: {
      container: 'py-12 px-6',
      icon: 'w-16 h-16',
      title: 'text-xl',
      description: 'text-base',
      button: 'px-6 py-3'
    },
    large: {
      container: 'py-16 px-8',
      icon: 'w-20 h-20',
      title: 'text-2xl',
      description: 'text-lg',
      button: 'px-8 py-4'
    }
  };

  const classes = sizeClasses[size];

  return (
    <motion.div
      variants={emptyStateVariants}
      initial="initial"
      animate="animate"
      className={`
        flex flex-col items-center text-center max-w-md mx-auto
        ${classes.container} ${className}
      `}
    >
      {/* Icon ou Illustration */}
      <motion.div
        variants={illustrationVariants}
        className={`
          flex items-center justify-center rounded-full mb-6
          ${classes.icon}
          bg-light-bg dark:bg-dark-bg
          border-2 border-light-border dark:border-dark-border
        `}
      >
        {illustration ? (
          <div className="text-4xl">{illustration}</div>
        ) : (
          <Icon className={`${classes.icon} text-text-light-secondary dark:text-text-dark-secondary`} />
        )}
      </motion.div>

      {/* Title */}
      {title && (
        <h3 className={`
          font-semibold text-text-light-primary dark:text-text-dark-primary mb-2
          ${classes.title}
        `}>
          {title}
        </h3>
      )}

      {/* Description */}
      {description && (
        <p className={`
          text-text-light-secondary dark:text-text-dark-secondary mb-6 leading-relaxed
          ${classes.description}
        `}>
          {description}
        </p>
      )}

      {/* Action Button */}
      {actionLabel && onAction && (
        <AnimatedButton
          onClick={onAction}
          className={`
            bg-primary hover:bg-primary-hover text-white font-medium rounded-lg
            transition-colors duration-200 flex items-center gap-2
            ${classes.button}
          `}
        >
          <Plus className="w-4 h-4" />
          {actionLabel}
        </AnimatedButton>
      )}
    </motion.div>
  );
}

// Estados específicos pré-configurados
export function NoDataState({ title, description, onRefresh, onAdd, addLabel = "Adicionar" }) {
  return (
    <div className="space-y-4">
      <EmptyState
        type="data"
        title={title || "Nenhum dado encontrado"}
        description={description || "Não há informações disponíveis para exibir no momento."}
        illustration="📊"
        size="medium"
      />
      <div className="flex justify-center gap-3">
        {onRefresh && (
          <AnimatedButton
            onClick={onRefresh}
            className="flex items-center gap-2 px-4 py-2 border border-light-border dark:border-dark-border rounded-lg hover:bg-light-bg dark:hover:bg-dark-bg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </AnimatedButton>
        )}
        {onAdd && (
          <AnimatedButton
            onClick={onAdd}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
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
  title = "Algo deu errado",
  description = "Ocorreu um erro ao carregar os dados. Tente novamente.",
  onRetry,
  onSupport
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
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Tentar novamente
          </AnimatedButton>
        )}
        {onSupport && (
          <AnimatedButton
            onClick={onSupport}
            className="flex items-center gap-2 px-4 py-2 border border-light-border dark:border-dark-border rounded-lg hover:bg-light-bg dark:hover:bg-dark-bg transition-colors"
          >
            Suporte
          </AnimatedButton>
        )}
      </div>
    </div>
  );
}

export function LoadingState({ message = "Carregando..." }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-12"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full mb-4"
      />
      <p className="text-text-light-secondary dark:text-text-dark-secondary text-sm">
        {message}
      </p>
    </motion.div>
  );
}