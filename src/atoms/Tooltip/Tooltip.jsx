import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const tooltipVariants = {
  initial: {
    opacity: 0,
    scale: 0.8,
    y: -10,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
      duration: 0.2,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: -10,
    transition: {
      duration: 0.1,
    },
  },
};

export function Tooltip({
  children,
  content,
  position = 'top',
  delay = 300,
  className = '',
  disabled = false,
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState(null);

  const handleMouseEnter = () => {
    if (disabled) return;

    const id = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    setTimeoutId(id);
  };

  const handleMouseLeave = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setIsVisible(false);
  };

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-800 dark:border-t-gray-200',
    bottom:
      'bottom-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-gray-800 dark:border-b-gray-200',
    left: 'left-full top-1/2 transform -translate-y-1/2 border-t-4 border-b-4 border-l-4 border-t-transparent border-b-transparent border-l-gray-800 dark:border-l-gray-200',
    right:
      'right-full top-1/2 transform -translate-y-1/2 border-t-4 border-b-4 border-r-4 border-t-transparent border-b-transparent border-r-gray-800 dark:border-r-gray-200',
  };

  if (!content) return children;

  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      <AnimatePresence>
        {isVisible && (
          <motion.div
            variants={tooltipVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={`
              absolute z-50 px-3 py-2 text-sm font-medium text-white bg-gray-800 dark:bg-gray-200 dark:text-gray-800 
              rounded-lg shadow-lg whitespace-nowrap pointer-events-none
              ${positionClasses[position]}
            `}
          >
            {content}
            {/* Arrow */}
            <div className={`absolute w-0 h-0 ${arrowClasses[position]}`} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Tooltip para atalhos de teclado
export function KeyboardShortcut({ keys, description, className = '' }) {
  return (
    <Tooltip
      content={
        <div className="flex items-center gap-2">
          <span>{description}</span>
          <div className="flex items-center gap-1">
            {keys.map((key, index) => (
              <React.Fragment key={key}>
                <kbd className="px-2 py-1 text-xs bg-gray-600 dark:bg-gray-300 dark:text-gray-800 rounded border">
                  {key}
                </kbd>
                {index < keys.length - 1 && (
                  <span className="text-gray-400">+</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      }
      className={className}
    >
      {/* O children será o elemento que recebe o tooltip */}
    </Tooltip>
  );
}

// Tooltip para informações contextuais
export function InfoTooltip({ title, description, children, className = '' }) {
  return (
    <Tooltip
      content={
        <div className="max-w-xs">
          {title && <div className="font-semibold mb-1">{title}</div>}
          <div className="text-xs opacity-90">{description}</div>
        </div>
      }
      className={className}
    >
      {children}
    </Tooltip>
  );
}

// Tooltip para status/badges
export function StatusTooltip({ status, details, children, className = '' }) {
  const statusColors = {
    success: 'text-green-400',
    warning: 'text-yellow-400',
    error: 'text-red-400',
    info: 'text-blue-400',
  };

  return (
    <Tooltip
      content={
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${statusColors[status]?.replace('text-', 'bg-')}`}
          />
          <span>{details}</span>
        </div>
      }
      className={className}
    >
      {children}
    </Tooltip>
  );
}

// Hook para controlar tooltips programaticamente
export function useTooltip() {
  const [tooltips, setTooltips] = useState({});

  const showTooltip = (id, content, position = { x: 0, y: 0 }) => {
    setTooltips(prev => ({
      ...prev,
      [id]: { content, position, visible: true },
    }));
  };

  const hideTooltip = id => {
    setTooltips(prev => ({
      ...prev,
      [id]: { ...prev[id], visible: false },
    }));
  };

  const hideAllTooltips = () => {
    setTooltips({});
  };

  return {
    tooltips,
    showTooltip,
    hideTooltip,
    hideAllTooltips,
  };
}
