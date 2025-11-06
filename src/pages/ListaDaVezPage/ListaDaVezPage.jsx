import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, UnitSelector } from '../../atoms';
import { useListaDaVez } from '../../hooks/useListaDaVez';
import { useToast } from '../../context/ToastContext';
import {
  FiRefreshCw,
  FiCalendar,
  FiDownload,
  FiUsers,
  FiTrendingUp,
  FiClock,
  FiAward,
} from 'react-icons/fi';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

// Registrar componentes do Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

/**
 * CORES PARA BARBEIROS
 * Paleta premium inspirada no design system
 */
const BARBER_COLORS = [
  '#3B82F6',
  // Azul
  '#EF4444',
  // Vermelho
  '#F59E0B',
  // Amarelo/Laranja
  '#10B981',
  // Verde
  '#8B5CF6',
  // Roxo
  '#EC4899',
  // Rosa
  '#06B6D4',
  // Ciano
  '#F97316', // Laranja escuro
];
const ListaDaVezPage = () => {
  const navigate = useNavigate();
  const {
    turnList,
    stats,
    loading,
    error,
    selectedUnit,
    addPoint,
    initializeTurnList,
    loadTurnList,
    refresh,
  } = useListaDaVez();

  // Estados locais
  const [processingBarber, setProcessingBarber] = useState(null);

  // Calcular estatísticas
  const totalBarbers = turnList.length;
  const totalPoints = turnList.reduce((sum, b) => sum + b.points, 0);
  const averagePoints =
    totalBarbers > 0 ? (totalPoints / totalBarbers).toFixed(1) : 0;

  /**
   * Adicionar ponto a um barbeiro
   */
  const handleAddPoint = async barberId => {
    try {
      setProcessingBarber(barberId);
      await addPoint(barberId);
      showToast('Ponto adicionado com sucesso!', 'success');
    } catch (err) {
      showToast(`Erro: ${err.message}`, 'error');
    } finally {
      setProcessingBarber(null);
    }
  };

  /**
   * Inicializar lista da vez
   */
  const handleInitialize = async () => {
    if (!selectedUnit?.id) {
      showToast('Selecione uma unidade primeiro', 'warning');
      return;
    }
    try {
      await initializeTurnList(selectedUnit.id);
      showToast('Lista inicializada com sucesso!', 'success');
    } catch (err) {
      showToast(`Erro ao inicializar: ${err.message}`, 'error');
    }
  };

  /**
   * Atualizar dados
   */
  const handleRefresh = async () => {
    try {
      await refresh();
      showToast('Dados atualizados!', 'success');
    } catch (err) {
      showToast(`Erro ao atualizar: ${err.message}`, 'error');
    }
  };

  /**
   * Preparar dados para o gráfico
   */
  const getChartData = () => {
    if (totalPoints === 0) {
      return {
        labels: ['Sem dados'],
        datasets: [
          {
            data: [1],
            backgroundColor: ['#E5E7EB'],
            borderColor: ['#D1D5DB'],
            borderWidth: 2,
          },
        ],
      };
    }
    return {
      labels: turnList.map(b => b.professionalName),
      datasets: [
        {
          data: turnList.map(b => b.points),
          backgroundColor: turnList.map(
            (_, idx) => BARBER_COLORS[idx % BARBER_COLORS.length]
          ),
          borderColor: turnList.map(
            (_, idx) => BARBER_COLORS[idx % BARBER_COLORS.length]
          ),
          borderWidth: 2,
        },
      ],
    };
  };
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: context => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const percentage =
              totalPoints > 0 ? ((value / totalPoints) * 100).toFixed(1) : 0;
            return `${label}: ${value} atendimentos (${percentage}%)`;
          },
        },
      },
    },
  };
  return (
    <div className="min-h-screen space-y-6 bg-light-bg p-6 dark:bg-dark-bg dark:bg-dark-surface">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-theme-primary dark:text-dark-text-primary text-3xl font-bold">
            Lista da Vez
          </h1>
          <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mt-1 text-sm">
            Gerencie a ordem de atendimento dos barbeiros
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleRefresh}
            variant="secondary"
            disabled={loading}
            className="flex items-center gap-2"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
            Atualizar
          </Button>

          <Button
            onClick={() => navigate('/queue/history')}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <FiCalendar />
            Ver Histórico
          </Button>

          <Button
            onClick={() => {
              /* TODO: Implementar exportação */
            }}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <FiDownload />
            Exportar
          </Button>
        </div>
      </div>

      {/* Seletor de Unidade */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <label className="text-theme-secondary whitespace-nowrap text-sm font-medium">
            Unidade:
          </label>
          <UnitSelector />
        </div>
      </Card>

      {/* Indicadores Superiores */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900/20">
              <FiUsers className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm">
                Total de Barbeiros
              </p>
              <p className="text-theme-primary dark:text-dark-text-primary text-2xl font-bold">
                {totalBarbers}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-3 dark:bg-green-900/20">
              <FiTrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm">
                Total de Atendimentos
              </p>
              <p className="text-theme-primary dark:text-dark-text-primary text-2xl font-bold">
                {totalPoints}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 p-3 dark:bg-purple-900/20">
              <FiAward className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm">
                Média de Atendimentos
              </p>
              <p className="text-theme-primary dark:text-dark-text-primary text-2xl font-bold">
                {averagePoints}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-100 p-3 dark:bg-orange-900/20">
              <FiClock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm">
                Última Atualização
              </p>
              <p className="text-theme-primary dark:text-dark-text-primary text-sm font-medium">
                {new Date().toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Conteúdo Principal */}
      {!selectedUnit?.id ? (
        <Card className="p-12 text-center">
          <FiUsers className="text-light-text-muted dark:text-dark-text-muted mx-auto mb-4 h-16 w-16" />
          <h3 className="text-theme-primary dark:text-dark-text-primary mb-2 text-lg font-semibold">
            Selecione uma Unidade
          </h3>
          <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
            Escolha uma unidade acima para visualizar a lista da vez
          </p>
        </Card>
      ) : turnList.length === 0 ? (
        <Card className="p-12 text-center">
          <FiUsers className="text-light-text-muted dark:text-dark-text-muted mx-auto mb-4 h-16 w-16" />
          <h3 className="text-theme-primary dark:text-dark-text-primary mb-2 text-lg font-semibold">
            Nenhuma lista encontrada
          </h3>
          <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mb-6">
            Inicialize a lista para esta unidade
          </p>
          <Button onClick={handleInitialize} disabled={loading}>
            {loading ? 'Inicializando...' : '+ Inicializar Lista'}
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Lista de Barbeiros (2/3) */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <h2 className="text-theme-primary dark:text-dark-text-primary mb-4 text-xl font-bold">
                Ordem de Atendimento
              </h2>

              <div className="space-y-2">
                {turnList.map((barber, index) => {
                  const isFirst = index === 0;
                  const percentage =
                    totalPoints > 0
                      ? ((barber.points / totalPoints) * 100).toFixed(1)
                      : '0.0';
                  const color = BARBER_COLORS[index % BARBER_COLORS.length];
                  const isProcessing =
                    processingBarber === barber.professionalId;
                  return (
                    <div
                      key={barber.id}
                      className={`flex items-center gap-3 rounded-lg border-l-4 p-3 transition-all ${isFirst ? 'border-green-800 bg-green-600 text-white dark:bg-green-700' : 'border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-800'} ${isProcessing ? 'opacity-50' : ''} `}
                      style={{
                        borderLeftColor: isFirst ? '#065F46' : color,
                      }}
                    >
                      {/* Posição */}
                      <div className="w-10 flex-shrink-0 text-center">
                        <span
                          className={`text-xl font-bold ${isFirst ? 'text-white' : 'text-gray-900 dark:text-white'}`}
                        >
                          {barber.position}°
                        </span>
                      </div>

                      {/* Nome */}
                      <div className="min-w-0 flex-1">
                        <h3
                          className={`truncate text-base font-semibold ${isFirst ? 'text-white' : 'text-gray-900 dark:text-white'}`}
                        >
                          {barber.professionalName}
                        </h3>
                        {isFirst && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-100">
                            🔹 PRÓXIMO NA VEZ
                          </span>
                        )}
                      </div>

                      {/* Pontos */}
                      <div className="px-3 text-center">
                        <p
                          className={`text-xl font-bold ${isFirst ? 'text-white' : 'text-gray-900 dark:text-white'}`}
                        >
                          {barber.points}
                        </p>
                        <p
                          className={`text-xs ${isFirst ? 'text-green-100' : 'text-gray-500 dark:text-gray-400'}`}
                        >
                          atendimentos
                        </p>
                      </div>

                      {/* Percentual */}
                      <div className="px-3 text-center">
                        <p
                          className={`text-base font-semibold ${isFirst ? 'text-white' : 'text-gray-900 dark:text-white'}`}
                        >
                          {percentage}%
                        </p>
                        <p
                          className={`text-xs ${isFirst ? 'text-green-100' : 'text-gray-500 dark:text-gray-400'}`}
                        >
                          participação
                        </p>
                      </div>

                      {/* Botão +1 */}
                      <Button
                        onClick={() => handleAddPoint(barber.professionalId)}
                        disabled={loading || isProcessing}
                        size="sm"
                        className={`flex-shrink-0 ${isFirst ? 'border-green-900 bg-green-800 font-bold text-white shadow-lg hover:bg-green-900' : 'border-blue-600 bg-blue-600 font-semibold text-white hover:bg-blue-700'} `}
                      >
                        {isProcessing ? '...' : '+1'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Gráfico de Distribuição (1/3) */}
          <div className="lg:col-span-1">
            <Card className="h-full p-6">
              <h2 className="text-theme-primary dark:text-dark-text-primary mb-4 text-xl font-bold">
                Distribuição de Atendimentos
              </h2>

              <div
                className="flex items-center justify-center"
                style={{
                  height: '300px',
                }}
              >
                <Doughnut data={getChartData()} options={chartOptions} />
              </div>

              {/* Legenda */}
              <div className="mt-6 space-y-2">
                {turnList.map((barber, index) => {
                  const percentage =
                    totalPoints > 0
                      ? ((barber.points / totalPoints) * 100).toFixed(1)
                      : '0.0';
                  const color = BARBER_COLORS[index % BARBER_COLORS.length];
                  return (
                    <div
                      key={barber.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{
                            backgroundColor: color,
                          }}
                        />
                        <span className="text-theme-secondary truncate text-sm">
                          {barber.professionalName}
                        </span>
                      </div>
                      <span className="text-theme-primary dark:text-dark-text-primary text-sm font-semibold">
                        {percentage}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Mensagem de Erro */}
      {error && (
        <Card className="border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-red-800 dark:text-red-200">⚠️ {error}</p>
        </Card>
      )}
    </div>
  );
};
export default ListaDaVezPage;
