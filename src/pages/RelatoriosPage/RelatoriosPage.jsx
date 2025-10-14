import React, { useState, useMemo } from 'react';
import { Card, Button } from '../../atoms';
import { 
  FileText, 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  Users, 
  Calendar,
  Download,
  Filter,
  ChevronLeft
} from 'lucide-react';

// Componente de filtros (será implementado em seguida)
import FiltrosRelatorio from './components/FiltrosRelatorio';

// Componentes de relatórios (serão implementados)
import RelatorioDREMensal from './components/RelatorioDREMensal';
import RelatorioComparativoUnidades from './components/RelatorioComparativoUnidades';
import RelatorioReceitaDespesa from './components/RelatorioReceitaDespesa';
import RelatorioPerformanceProfissionais from './components/RelatorioPerformanceProfissionais';
import RelatorioAnaliseAtendimentos from './components/RelatorioAnaliseAtendimentos';

const RelatoriosPage = () => {
  const [activeReport, setActiveReport] = useState('dre');
  const [filters, setFilters] = useState({
    periodo: {
      tipo: 'mes', // 'mes', 'trimestre', 'semestre', 'ano', 'custom'
      mes: new Date().getMonth() + 1,
      ano: new Date().getFullYear(),
      dataInicio: null,
      dataFim: null
    },
    unidade: 'todas', // 'todas', 'mangabeiras', 'nova-lima'
    profissional: 'todos' // 'todos' ou ID específico
  });

  // Definição dos tipos de relatórios disponíveis
  const reportTypes = useMemo(() => [
    {
      id: 'dre',
      title: 'DRE Mensal',
      description: 'Demonstração de Resultado do Exercício detalhada',
      icon: FileText,
      color: 'bg-blue-500',
      component: RelatorioDREMensal
    },
    {
      id: 'comparativo-unidades',
      title: 'Comparativo Unidades',
      description: 'Análise comparativa entre Mangabeiras e Nova Lima',
      icon: BarChart3,
      color: 'bg-green-500',
      component: RelatorioComparativoUnidades
    },
    {
      id: 'receita-despesa',
      title: 'Receita x Despesa',
      description: 'Evolução de receitas e despesas ao longo do tempo',
      icon: TrendingUp,
      color: 'bg-purple-500',
      component: RelatorioReceitaDespesa
    },
    {
      id: 'performance-profissionais',
      title: 'Performance Profissionais',
      description: 'Ranking e análise de desempenho dos barbeiros',
      icon: Users,
      color: 'bg-orange-500',
      component: RelatorioPerformanceProfissionais
    },
    {
      id: 'analise-atendimentos',
      title: 'Análise de Atendimentos',
      description: 'Padrões e tendências dos atendimentos realizados',
      icon: PieChart,
      color: 'bg-indigo-500',
      component: RelatorioAnaliseAtendimentos
    }
  ], []);

  // Relatório ativo baseado na seleção
  const currentReport = useMemo(() => 
    reportTypes.find(report => report.id === activeReport),
    [activeReport, reportTypes]
  );

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Relatórios Gerenciais
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Análises detalhadas e exportação de dados do sistema
            </p>
          </div>
          
          {/* Botões de ação */}
          <div className="flex items-center space-x-3">
            {activeReport && (
              <Button
                variant="secondary"
                onClick={() => setActiveReport(null)}
                className="flex items-center"
              >
                <ChevronLeft size={16} className="mr-1" />
                Voltar
              </Button>
            )}
            <Button className="flex items-center">
              <Download size={16} className="mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Sidebar com tipos de relatórios */}
        <div className="w-full lg:w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Tipos de Relatórios
            </h2>
            
            <div className="space-y-2">
              {reportTypes.map((report) => {
                const IconComponent = report.icon;
                const isActive = activeReport === report.id;
                
                return (
                  <button
                    key={report.id}
                    onClick={() => setActiveReport(report.id)}
                    className={`w-full text-left p-4 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 shadow-sm'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700 border-transparent'
                    } border`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${report.color} text-white flex-shrink-0`}>
                        <IconComponent size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-medium ${
                          isActive 
                            ? 'text-blue-900 dark:text-blue-100' 
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {report.title}
                        </h3>
                        <p className={`text-sm mt-1 ${
                          isActive 
                            ? 'text-blue-700 dark:text-blue-300' 
                            : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {report.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Conteúdo principal */}
        <div className="flex-1 min-w-0">
          {/* Filtros */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Filter size={20} className="text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Filtros
              </h3>
            </div>
            <FiltrosRelatorio 
              filters={filters} 
              onFiltersChange={handleFilterChange}
            />
          </div>

          {/* Área do relatório */}
          <div className="p-6">
            {currentReport ? (
              <div>
                {/* Header do relatório atual */}
                <div className="mb-6">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className={`p-2 rounded-lg ${currentReport.color} text-white`}>
                      <currentReport.icon size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {currentReport.title}
                    </h2>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    {currentReport.description}
                  </p>
                </div>

                {/* Componente do relatório */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                  <currentReport.component filters={filters} />
                </div>
              </div>
            ) : (
              <Card className="p-8 text-center">
                <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Selecione um Relatório
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Escolha um tipo de relatório na barra lateral para começar
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RelatoriosPage;