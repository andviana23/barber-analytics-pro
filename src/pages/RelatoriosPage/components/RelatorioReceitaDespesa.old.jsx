import React from 'react';
import { TrendingUp, DollarSign } from 'lucide-react';
import { Card } from '../../../atoms';
const RelatorioReceitaDespesa = ({ filters }) => {
  return (
    <div className="p-6">
      <div className="text-center py-12">
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-purple-100 dark:bg-purple-900 rounded-full">
            <TrendingUp
              size={48}
              className="text-purple-600 dark:text-purple-400"
            />
          </div>
        </div>
        <h3 className="text-xl font-semibold text-theme-primary dark:text-dark-text-primary mb-2">
          Relatório Receita x Despesa
        </h3>
        <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mb-6">
          Evolução de receitas e despesas ao longo do tempo
        </p>

        <Card className="p-6 max-w-md mx-auto">
          <DollarSign
            className="mx-auto mb-4 text-light-text-muted dark:text-dark-text-muted"
            size={32}
          />
          <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
            Componente em desenvolvimento...
          </p>
          <p className="text-sm text-light-text-muted dark:text-dark-text-muted dark:text-theme-secondary mt-2">
            Período:{' '}
            {filters.periodo.tipo === 'mes'
              ? `${filters.periodo.mes}/${filters.periodo.ano}`
              : 'Período selecionado'}
          </p>
        </Card>
      </div>
    </div>
  );
};
export default RelatorioReceitaDespesa;
