/**
 * @fileoverview KPICard Component
 * @module components/molecules/KPICard
 * @description Card de KPI reutilizável seguindo Design System
 *
 * @see CHECKLIST_IA_FINANCEIRA.md - Seção 8.4.1
 * @see docs/DESIGN_SYSTEM.md
 */

'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface KPICardProps {
  title: string;
  value: string | number;
  trend?: number; // Percentual de variação (ex: 5.2 para +5.2%)
  icon?: LucideIcon;
  target?: number; // Valor target (opcional)
  formatValue?: (value: number) => string; // Função para formatar valor
  className?: string;
}

/**
 * Componente KPICard
 *
 * Card de KPI seguindo Design System com suporte a dark mode
 */
export function KPICard({
  title,
  value,
  trend,
  icon: Icon,
  target,
  formatValue,
  className = '',
}: KPICardProps) {
  const formattedValue =
    typeof value === 'number' && formatValue ? formatValue(value) : String(value);

  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend > 0) return <TrendingUp className="h-4 w-4" />;
    if (trend < 0) return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  const getTrendColor = () => {
    if (!trend) return '';
    if (trend > 0)
      return 'text-feedback-light-success dark:text-feedback-dark-success';
    if (trend < 0) return 'text-feedback-light-error dark:text-feedback-dark-error';
    return 'text-theme-secondary';
  };

  const isTargetAchieved = target !== undefined && typeof value === 'number' && value >= target;

  return (
    <div
      className={`card-theme rounded-xl border p-6 transition-shadow hover:shadow-lg ${className}`}
    >
      <div className="mb-4 flex items-center justify-between">
        {Icon && (
          <div className="rounded-lg bg-light-bg p-2 dark:bg-dark-hover">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        )}
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-medium ${getTrendColor()}`}>
            {getTrendIcon()}
            <span>
              {trend > 0 ? '+' : ''}
              {trend.toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      <p className="text-theme-secondary text-sm font-medium">{title}</p>
      <p className="text-theme-primary mt-1 text-2xl font-bold">{formattedValue}</p>

      {target !== undefined && (
        <div className="mt-3 flex items-center justify-between border-t border-light-border pt-3 dark:border-dark-border">
          <span className="text-theme-secondary text-xs">Target</span>
          <div className="flex items-center gap-2">
            <span className="text-theme-primary text-sm font-semibold">
              {typeof target === 'number' && formatValue ? formatValue(target) : target}
            </span>
            {isTargetAchieved ? (
              <span className="rounded-full bg-feedback-light-success/10 px-2 py-0.5 text-xs font-medium text-feedback-light-success dark:bg-feedback-dark-success/10 dark:text-feedback-dark-success">
                ✅
              </span>
            ) : (
              <span className="text-theme-secondary text-xs">
                {typeof value === 'number' && target
                  ? `${((value / target) * 100).toFixed(0)}%`
                  : '-'}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

