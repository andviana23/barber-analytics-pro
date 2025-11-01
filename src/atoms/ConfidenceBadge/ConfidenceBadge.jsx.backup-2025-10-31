import React from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, XCircle } from 'lucide-react';

/**
 * Badge de confiança para reconciliação bancária
 *
 * @param {number} confidence - Score de confiança (0-100)
 * @param {string} size - Tamanho do badge ('sm' | 'md' | 'lg')
 */
const ConfidenceBadge = ({ confidence, size = 'md' }) => {
  // Determina nível de confiança e estilo visual
  const getConfidenceLevel = score => {
    if (score >= 95) {
      return {
        label: 'Exato',
        color:
          'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
        icon: CheckCircle,
        iconColor: 'text-green-600 dark:text-green-400',
      };
    }
    if (score >= 85) {
      return {
        label: 'Alto',
        color:
          'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
        icon: AlertCircle,
        iconColor: 'text-blue-600 dark:text-blue-400',
      };
    }
    if (score >= 70) {
      return {
        label: 'Médio',
        color:
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
        icon: AlertTriangle,
        iconColor: 'text-yellow-600 dark:text-yellow-400',
      };
    }
    return {
      label: 'Baixo',
      color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      icon: XCircle,
      iconColor: 'text-red-600 dark:text-red-400',
    };
  };

  const level = getConfidenceLevel(confidence);
  const Icon = level.icon;

  // Tamanhos responsivos
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${level.color} ${sizeClasses[size]}`}
      data-testid="confidence-badge"
      data-confidence={confidence}
      data-level={level.label.toLowerCase()}
    >
      <Icon size={iconSizes[size]} className={level.iconColor} />
      <span>{level.label}</span>
      <span className="opacity-75">({confidence}%)</span>
    </div>
  );
};

export default ConfidenceBadge;
