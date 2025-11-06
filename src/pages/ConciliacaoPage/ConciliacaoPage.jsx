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
      <div className="card-theme sticky top-0 z-10 border-b border-light-border dark:border-dark-border">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/financial')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
                  Conciliação Bancária
                </h1>
                <p className="mt-1 text-sm text-text-light-secondary dark:text-text-dark-secondary">
                  Importe extratos e reconcilie lançamentos automaticamente
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <ConciliacaoTab />
      </div>
    </div>
  );
};
export default ConciliacaoPage;
