import React from 'react';
import { Users, Trophy } from 'lucide-react';
import { Card } from '../../../atoms';
const RelatorioPerformanceProfissionais = ({ filters }) => {
  return (
    <div className="p-6">
      <div className="py-12 text-center">
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-orange-100 p-4 dark:bg-orange-900">
            <Users size={48} className="text-orange-600 dark:text-orange-400" />
          </div>
        </div>
        <h3 className="text-theme-primary dark:text-dark-text-primary mb-2 text-xl font-semibold">
          Performance dos Profissionais
        </h3>
        <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mb-6">
          Ranking e análise de desempenho dos barbeiros
        </p>

        <Card className="mx-auto max-w-md p-6">
          <Trophy
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
export default RelatorioPerformanceProfissionais;
