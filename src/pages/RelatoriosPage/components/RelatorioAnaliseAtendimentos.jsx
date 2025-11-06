import React from 'react';
import { PieChart, Clock } from 'lucide-react';
import { Card } from '../../../atoms';
const RelatorioAnaliseAtendimentos = ({ filters }) => {
  return (
    <div className="p-6">
      <div className="py-12 text-center">
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-indigo-100 p-4 dark:bg-indigo-900">
            <PieChart
              size={48}
              className="text-indigo-600 dark:text-indigo-400"
            />
          </div>
        </div>
        <h3 className="text-theme-primary dark:text-dark-text-primary mb-2 text-xl font-semibold">
          Análise de Atendimentos
        </h3>
        <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mb-6">
          Padrões e tendências dos atendimentos realizados
        </p>

        <Card className="mx-auto max-w-md p-6">
          <Clock
            className="text-light-text-muted dark:text-dark-text-muted mx-auto mb-4"
            size={32}
          />
          <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
            Componente em desenvolvimento...
          </p>
          <p className="text-light-text-muted dark:text-dark-text-muted dark:text-theme-secondary mt-2 text-sm">
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
export default RelatorioAnaliseAtendimentos;
