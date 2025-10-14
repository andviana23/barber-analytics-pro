import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  Calendar,
  Filter,
  RefreshCw,
  BarChart3,
  Clock,
  Scissors
} from 'lucide-react';
import { KPICard, ChartComponent, RankingProfissionais } from '../../molecules';
import { UnitSelector } from '../../atoms';
import { AnimatedPage, AnimatedCard, AnimatedList, AnimatedListItem, AnimatedButton } from '../../utils/animations';
import { 
  useDashboardKPIs, 
  useMonthlyEvolution, 
  useRankingProfissionais,
  useRevenueDistribution,
  useRecentBookings
} from '../../hooks';
import { useAudit } from '../../hooks';

export function DashboardPage() {
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [dateRange] = useState(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      start: startOfMonth,
      end: now
    };
  });

  // Hooks para buscar dados
  const { kpis, loading: kpisLoading, refetch: refetchKpis } = useDashboardKPIs(
    selectedUnit, 
    dateRange.start, 
    dateRange.end
  );
  
  const { data: monthlyData, loading: monthlyLoading } = useMonthlyEvolution(selectedUnit, 12);
  const { ranking, loading: rankingLoading } = useRankingProfissionais(selectedUnit, 10);
  const { distribution, loading: distributionLoading } = useRevenueDistribution(selectedUnit);
  const { bookings, loading: bookingsLoading } = useRecentBookings(selectedUnit, 10);
  
  // Hook de auditoria
  const { logPageView } = useAudit();

  // Log da visualização da página
  useEffect(() => {
    logPageView('dashboard', {
      unit_id: selectedUnit,
      date_range: dateRange
    });
  }, [logPageView, selectedUnit, dateRange]);

  // Função para atualizar todos os dados
  const handleRefresh = () => {
    refetchKpis();
  };

  return (
    <AnimatedPage className="space-y-6">
      {/* Header com filtros */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard Analítico
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Visão geral dos KPIs e performance - {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Seletor de unidade */}
          <div className="min-w-0">
            <UnitSelector 
              userId="current-user"
              onSelect={setSelectedUnit}
            />
          </div>

          {/* Botão de atualização */}
          <AnimatedButton
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            disabled={kpisLoading}
          >
            <RefreshCw className={`h-4 w-4 ${kpisLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </AnimatedButton>

          {/* Filtro (placeholder) */}
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            <Filter className="h-4 w-4" />
            Filtros
          </button>
        </div>
      </div>

      {/* Grid de KPIs principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnimatedCard index={0}>
          <KPICard
            title="Faturamento Total"
            value={kpis?.totalRevenue || 0}
            change={kpis?.revenueGrowth}
            icon={DollarSign}
            color="text-green-600"
            loading={kpisLoading}
          />
        </AnimatedCard>
        
        <AnimatedCard index={1}>
          <KPICard
          title="Lucro Líquido"
          value={kpis?.netProfit || 0}
          change={kpis?.profitMargin}
          icon={TrendingUp}
          color="text-blue-600"
          loading={kpisLoading}
          subtitle={`Margem: ${(kpis?.profitMargin || 0).toFixed(1)}%`}
          />
        </AnimatedCard>
        
        <AnimatedCard index={2}>
          <KPICard
          title="Ticket Médio"
          value={kpis?.averageTicket || 0}
          icon={BarChart3}
          color="text-purple-600"
          loading={kpisLoading}
          />
        </AnimatedCard>
        
        <AnimatedCard index={3}>
          <KPICard
            title="Atendimentos"
          value={kpis?.totalAttendances || 0}
          icon={Users}
          color="text-orange-600"
          loading={kpisLoading}
          subtitle="Total do período"
          />
        </AnimatedCard>
      </div>

      {/* Grid de gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de evolução mensal */}
        <ChartComponent
          type="line"
          data={monthlyData}
          title="Evolução Financeira Mensal"
          height={350}
          loading={monthlyLoading}
          config={{
            xDataKey: 'month',
            lines: [
              { dataKey: 'revenues', name: 'Receitas', stroke: '#10b981' },
              { dataKey: 'expenses', name: 'Despesas', stroke: '#ef4444' },
              { dataKey: 'profit', name: 'Lucro Líquido', stroke: '#3b82f6' }
            ]
          }}
        />

        {/* Gráfico de distribuição de receitas */}
        <ChartComponent
          type="pie"
          data={distribution}
          title="Distribuição de Receitas por Tipo"
          height={350}
          loading={distributionLoading}
          config={{
            dataKey: 'value',
            nameKey: 'name'
          }}
        />
      </div>

      {/* Grid de conteúdo secundário */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ranking de profissionais */}
        <RankingProfissionais
          data={ranking}
          title="Top Profissionais"
          loading={rankingLoading}
        />

        {/* Agendamentos recentes */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Atendimentos Recentes
              </h3>
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {bookings?.length || 0}
              </span>
            </div>
          </div>
          
          <div className="p-6">
            {bookingsLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, index) => (
                  <div key={index} className="flex items-center gap-4 animate-pulse">
                    <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="flex-1">
                      <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                      <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                    <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                ))}
              </div>
            ) : bookings?.length > 0 ? (
              <div className="space-y-4">
                {bookings.map((booking, index) => (
                  <div
                    key={booking.id || index}
                    className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-700"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Clock className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <span className="font-medium text-gray-900 dark:text-white text-sm">
                        {new Date(booking.date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {booking.service}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {booking.professional} • {booking.unit}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-900 dark:text-white">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(booking.value)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum atendimento recente</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ações rápidas */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Scissors className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Ações Rápidas
            </h3>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <AnimatedButton className="p-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-300 text-center group">
              <Users className="h-6 w-6 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">Novo Cliente</span>
            </AnimatedButton>
            <AnimatedButton className="p-4 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors duration-300 text-center group">
              <Calendar className="h-6 w-6 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">Agendar</span>
            </AnimatedButton>
            <AnimatedButton className="p-4 rounded-lg bg-yellow-600 text-white hover:bg-yellow-700 transition-colors duration-300 text-center group">
              <DollarSign className="h-6 w-6 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">Financeiro</span>
            </AnimatedButton>
            <AnimatedButton className="p-4 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors duration-300 text-center group">
              <BarChart3 className="h-6 w-6 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">Relatórios</span>
            </AnimatedButton>
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
}