/**
 * @file ConciliacaoPage.jsx
 * @description Página dedicada para Conciliação Bancária
 * @module Pages
 * @author Barber Analytics Pro Team
 * @date 2025-10-26
 */

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../atoms/Button/Button';
import ConciliacaoTab from '../FinanceiroAdvancedPage/ConciliacaoTab';

/**
 * ConciliacaoPage - Página de Conciliação Bancária
 *
 * Features:
 * - Importação de extratos bancários (Excel/CSV)
 * - Reconciliação automática de lançamentos
 * - Reconciliação manual de transações não identificadas
 * - Visualização de matches e estatísticas
 * - Proteção por permissões (apenas Admin e Gerente)
 * - Design System compliance
 * - Dark mode support
 * - Responsive layout
 *
 * @page
 */
const ConciliacaoPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-light-surface dark:bg-dark-surface border-b border-light-border dark:border-dark-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/financial')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
                  Conciliação Bancária
                </h1>
                <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mt-1">
                  Importe extratos e reconcilie lançamentos automaticamente
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <ConciliacaoTab />
      </div>
    </div>
  );
};

export default ConciliacaoPage;
