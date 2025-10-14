import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext();

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

const toastTypes = {
  success: {
    icon: CheckCircle,
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    iconColor: 'text-green-600 dark:text-green-400',
    textColor: 'text-green-800 dark:text-green-200'
  },
  error: {
    icon: XCircle,
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    iconColor: 'text-red-600 dark:text-red-400',
    textColor: 'text-red-800 dark:text-red-200'
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    textColor: 'text-yellow-800 dark:text-yellow-200'
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    iconColor: 'text-blue-600 dark:text-blue-400',
    textColor: 'text-blue-800 dark:text-blue-200'
  }
};

const toastVariants = {
  initial: {
    opacity: 0,
    x: 300,
    scale: 0.8
  },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30
    }
  },
  exit: {
    opacity: 0,
    x: 300,
    scale: 0.8,
    transition: {
      duration: 0.2
    }
  }
};

function Toast({ id, type, title, message, onRemove, duration = 5000 }) {
  const config = toastTypes[type];
  const Icon = config.icon;

  React.useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, onRemove, duration]);

  return (
    <motion.div
      layout
      variants={toastVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`
        flex items-start gap-3 p-4 rounded-lg border shadow-lg max-w-sm w-full
        ${config.bgColor} ${config.borderColor}
      `}
    >
      <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${config.iconColor}`} />
      <div className="flex-1 min-w-0">
        {title && (
          <p className={`text-sm font-medium ${config.textColor}`}>
            {title}
          </p>
        )}
        {message && (
          <p className={`text-sm mt-1 ${config.textColor} opacity-90`}>
            {message}
          </p>
        )}
      </div>
      <button
        onClick={() => onRemove(id)}
        className={`flex-shrink-0 p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${config.iconColor}`}
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            {...toast}
            onRemove={onRemove}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showSuccess = useCallback((title, message) => {
    addToast({ type: 'success', title, message });
  }, [addToast]);

  const showError = useCallback((title, message) => {
    addToast({ type: 'error', title, message });
  }, [addToast]);

  const showWarning = useCallback((title, message) => {
    addToast({ type: 'warning', title, message });
  }, [addToast]);

  const showInfo = useCallback((title, message) => {
    addToast({ type: 'info', title, message });
  }, [addToast]);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Função genérica showToast para compatibilidade com componentes existentes
  const showToast = useCallback(({ type, message, description }) => {
    switch (type) {
      case 'success':
        showSuccess(message, description);
        break;
      case 'error':
        showError(message, description);
        break;
      case 'warning':
        showWarning(message, description);
        break;
      case 'info':
        showInfo(message, description);
        break;
      default:
        showInfo(message, description);
    }
  }, [showSuccess, showError, showWarning, showInfo]);

  const value = {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showToast,
    clearAllToasts,
    toasts
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

// Hook para operações assíncronas com toast
export function useToastActions() {
  const { showSuccess, showError, showWarning, showInfo, showToast } = useToast();

  const handleAsyncAction = useCallback(async (
    asyncFn,
    {
      loadingMessage = 'Processando...',
      successMessage = 'Operação concluída com sucesso!',
      errorMessage = 'Ocorreu um erro. Tente novamente.'
    } = {}
  ) => {
    try {
      showInfo('Aguarde', loadingMessage);
      const result = await asyncFn();
      showSuccess('Sucesso', successMessage);
      return result;
    } catch (error) {
      showError('Erro', errorMessage);
      throw error;
    }
  }, [showSuccess, showError, showInfo]);

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showToast,
    handleAsyncAction
  };
}