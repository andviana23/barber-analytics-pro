import React from 'react';
import { motion } from 'framer-motion';

// Componente de loading aprimorado com acessibilidade
export function LoadingSpinner({
  size = 'md',
  color = 'primary',
  text = 'Carregando...',
  fullScreen = false,
  className = '',
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };
  const colorClasses = {
    primary: 'border-blue-600',
    secondary: 'border-gray-600',
    success: 'border-green-600',
    warning: 'border-yellow-600',
    error: 'border-red-600',
  };
  const spinner = (
    <div className="flex flex-col items-center justify-center space-y-3">
      {/* Spinner animado */}
      <motion.div
        className={`
          border-2 border-gray-200 dark:border-gray-700 border-t-transparent 
          ${sizeClasses[size]} ${colorClasses[color]} rounded-full
        `}
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear',
        }}
        aria-hidden="true"
      />

      {/* Texto com suporte a screen reader */}
      <div
        className="text-sm text-theme-secondary dark:text-gray-300 dark:text-gray-600 font-medium"
        role="status"
        aria-live="polite"
      >
        {text}
      </div>

      {/* Elemento invisível para screen readers */}
      <span className="sr-only">Conteúdo carregando, aguarde por favor</span>
    </div>
  );
  if (fullScreen) {
    return (
      <motion.div
        initial={{
          opacity: 0,
        }}
        animate={{
          opacity: 1,
        }}
        exit={{
          opacity: 0,
        }}
        className={`
          fixed inset-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm
          flex items-center justify-center ${className}
        `}
        role="dialog"
        aria-modal="true"
        aria-labelledby="loading-title"
      >
        <div id="loading-title" className="sr-only">
          Carregando conteúdo da aplicação
        </div>
        {spinner}
      </motion.div>
    );
  }
  return (
    <div className={`flex items-center justify-center p-4 ${className}`}>
      {spinner}
    </div>
  );
}

// Skeleton loader para conteúdo
export function SkeletonLoader({
  lines = 3,
  className = '',
  showAvatar = false,
  showButton = false,
}) {
  return (
    <div className={`animate-pulse space-y-4 ${className}`} aria-hidden="true">
      {showAvatar && (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/6" />
          </div>
        </div>
      )}

      <div className="space-y-2">
        {Array.from({
          length: lines,
        }).map((_, index) => (
          <div
            key={index}
            className={`
              h-4 bg-gray-200 dark:bg-gray-700 rounded
              ${index === lines - 1 ? 'w-3/4' : 'w-full'}
            `}
          />
        ))}
      </div>

      {showButton && (
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32" />
      )}

      <span className="sr-only">Conteúdo sendo carregado</span>
    </div>
  );
}

// Loading state para cards
export function CardSkeleton({ className = '' }) {
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}
    >
      <SkeletonLoader lines={3} showButton={true} />
    </div>
  );
}

// Loading state para tabelas
export function TableSkeleton({ rows = 5, columns = 4, className = '' }) {
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="border-b border-light-border dark:border-dark-border p-4">
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
          }}
        >
          {Array.from({
            length: columns,
          }).map((_, index) => (
            <div
              key={index}
              className="h-4 bg-gray-200 dark:bg-gray-700 rounded"
            />
          ))}
        </div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {Array.from({
          length: rows,
        }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-4">
            <div
              className="grid gap-4"
              style={{
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
              }}
            >
              {Array.from({
                length: columns,
              }).map((_, colIndex) => (
                <div
                  key={colIndex}
                  className={`
                    h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse
                    ${colIndex === 0 ? 'w-3/4' : 'w-full'}
                  `}
                  style={{
                    animationDelay: `${(rowIndex * columns + colIndex) * 0.1}s`,
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <span className="sr-only">Carregando dados da tabela</span>
    </div>
  );
}

// Progress bar com acessibilidade
export function ProgressBar({
  progress = 0,
  max = 100,
  label = 'Progresso',
  showPercentage = true,
  className = '',
}) {
  const percentage = Math.min(100, Math.max(0, (progress / max) * 100));
  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
          {label}
        </span>
        {showPercentage && (
          <span className="text-sm text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
            {Math.round(percentage)}%
          </span>
        )}
      </div>

      <div
        className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={`${label}: ${Math.round(percentage)}% concluído`}
      >
        <motion.div
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
          initial={{
            width: 0,
          }}
          animate={{
            width: `${percentage}%`,
          }}
          transition={{
            duration: 0.5,
            ease: 'easeOut',
          }}
        />
      </div>
    </div>
  );
}

// Loading overlay para formulários
export function FormLoadingOverlay({ isVisible, message = 'Processando...' }) {
  if (!isVisible) return null;
  return (
    <motion.div
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      exit={{
        opacity: 0,
      }}
      className="absolute inset-0 card-theme/80 dark:bg-dark-surface/80 backdrop-blur-sm z-10 flex items-center justify-center"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center space-y-3">
        <LoadingSpinner />
        <span className="text-sm font-medium text-theme-secondary dark:text-gray-300 dark:text-gray-600">
          {message}
        </span>
      </div>
    </motion.div>
  );
}

// Hook para gerenciar estados de loading
export function useLoadingState(initialState = false) {
  const [isLoading, setIsLoading] = React.useState(initialState);
  const [loadingMessage, setLoadingMessage] = React.useState('');
  const startLoading = (message = 'Carregando...') => {
    setLoadingMessage(message);
    setIsLoading(true);
  };
  const stopLoading = () => {
    setIsLoading(false);
    setLoadingMessage('');
  };
  const withLoading = async (asyncFunction, message = 'Processando...') => {
    try {
      startLoading(message);
      const result = await asyncFunction();
      return result;
    } finally {
      stopLoading();
    }
  };
  return {
    isLoading,
    loadingMessage,
    startLoading,
    stopLoading,
    withLoading,
  };
}
export default {
  LoadingSpinner,
  SkeletonLoader,
  CardSkeleton,
  TableSkeleton,
  ProgressBar,
  FormLoadingOverlay,
  useLoadingState,
};
