import React, { useState, useEffect } from 'react';
import {
  Download,
  FileText,
  Filter,
  TrendingUp,
  Calendar,
  User,
} from 'lucide-react';
import { Button } from '../atoms/Button/Button';
import CommissionSummaryCard from '../components/organisms/CommissionSummaryCard';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  exportCommissionsToCSV,
  exportCommissionsToPDF,
} from '../utils/exportCommissions';
import toast from 'react-hot-toast';

/**
 * 📊 CommissionReportPage
 *
 * Página completa de relatórios de comissões.
 *
 * Features:
 * - Resumo visual via CommissionSummaryCard
 * - Tabela detalhada com todos os itens de comissão
 * - Filtros avançados: profissional, período, status, comanda
 * - Exportação em CSV e PDF
 * - Agrupamento por profissional
 * - Cálculo de totais e médias
 *
 * @author Andrey Viana
 * @module pages/CommissionReportPage
 */
const CommissionReportPage = () => {
  // Estado de filtros
  const [filters, setFilters] = useState({
    professionalId: '',
    startDate: '',
    endDate: '',
    status: 'all', // all, paid, pending
    orderId: '',
  });

  // Estado de dados
  const [commissions, setCommissions] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // Estado de visualização
  const [groupByProfessional, setGroupByProfessional] = useState(false);

  /**
   * Busca profissionais da unidade
   */
  useEffect(() => {
    const fetchProfessionals = async () => {
      try {
        // TODO: Implementar busca de profissionais via hook/service
        // const { data } = await professionalService.getActiveProfessionals();
        // setProfessionals(data);

        // Mock temporário
        setProfessionals([
          { id: '1', name: 'João Silva' },
          { id: '2', name: 'Maria Santos' },
          { id: '3', name: 'Pedro Costa' },
        ]);
      } catch (error) {
        console.error('Erro ao buscar profissionais:', error);
        toast.error('Erro ao carregar profissionais');
      }
    };

    fetchProfessionals();
  }, []);

  /**
   * Busca comissões com base nos filtros
   */
  const fetchCommissions = async (appliedFilters = filters) => {
    setLoading(true);
    try {
      // TODO: Implementar via orderService.getCommissionReport()
      // const { data, error } = await orderService.getCommissionReport(appliedFilters);
      // if (error) throw new Error(error);
      // setCommissions(data);

      // Mock temporário
      const mockCommissions = [
        {
          id: '1',
          orderId: 'abc-123',
          orderNumber: '001',
          professionalId: '1',
          professionalName: 'João Silva',
          clientName: 'Cliente A',
          serviceName: 'Corte de Cabelo',
          quantity: 1,
          unitPrice: 50.0,
          commissionPercentage: 30,
          commissionValue: 15.0,
          status: 'paid',
          date: '2025-01-20',
          paymentDate: '2025-01-25',
        },
        {
          id: '2',
          orderId: 'abc-124',
          orderNumber: '002',
          professionalId: '1',
          professionalName: 'João Silva',
          clientName: 'Cliente B',
          serviceName: 'Barba',
          quantity: 1,
          unitPrice: 30.0,
          commissionPercentage: 30,
          commissionValue: 9.0,
          status: 'pending',
          date: '2025-01-22',
        },
        {
          id: '3',
          orderId: 'abc-125',
          orderNumber: '003',
          professionalId: '2',
          professionalName: 'Maria Santos',
          clientName: 'Cliente C',
          serviceName: 'Corte + Barba',
          quantity: 1,
          unitPrice: 80.0,
          commissionPercentage: 35,
          commissionValue: 28.0,
          status: 'paid',
          date: '2025-01-23',
          paymentDate: '2025-01-28',
        },
      ];

      setCommissions(mockCommissions);
    } catch (error) {
      console.error('Erro ao buscar comissões:', error);
      toast.error('Erro ao carregar comissões');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handler de atualização de filtros
   */
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  /**
   * Handler de aplicação de filtros
   */
  const handleApplyFilters = () => {
    fetchCommissions(filters);
  };

  /**
   * Handler de limpeza de filtros
   */
  const handleClearFilters = () => {
    const clearedFilters = {
      professionalId: '',
      startDate: '',
      endDate: '',
      status: 'all',
      orderId: '',
    };
    setFilters(clearedFilters);
    fetchCommissions(clearedFilters);
  };

  /**
   * Exporta comissões para CSV
   */
  const handleExportCSV = async () => {
    setExportLoading(true);
    try {
      await exportCommissionsToCSV(commissions, filters);
      toast.success('Relatório CSV gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      toast.error('Erro ao gerar relatório CSV');
    } finally {
      setExportLoading(false);
    }
  };

  /**
   * Exporta comissões para PDF
   */
  const handleExportPDF = async () => {
    setExportLoading(true);
    try {
      await exportCommissionsToPDF(commissions, filters);
      toast.success('Relatório PDF gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast.error('Erro ao gerar relatório PDF');
    } finally {
      setExportLoading(false);
    }
  };

  /**
   * Agrupa comissões por profissional
   */
  const groupedCommissions = () => {
    if (!groupByProfessional) return null;

    const grouped = commissions.reduce((acc, item) => {
      const key = item.professionalId;
      if (!acc[key]) {
        acc[key] = {
          professional: item.professionalName,
          items: [],
          total: 0,
          paid: 0,
          pending: 0,
        };
      }
      acc[key].items.push(item);
      acc[key].total += item.commissionValue;
      if (item.status === 'paid') {
        acc[key].paid += item.commissionValue;
      } else {
        acc[key].pending += item.commissionValue;
      }
      return acc;
    }, {});

    return Object.values(grouped);
  };

  /**
   * Calcula totais gerais
   */
  const calculateTotals = () => {
    return commissions.reduce(
      (acc, item) => {
        acc.total += item.commissionValue;
        if (item.status === 'paid') {
          acc.paid += item.commissionValue;
        } else {
          acc.pending += item.commissionValue;
        }
        acc.count++;
        return acc;
      },
      { total: 0, paid: 0, pending: 0, count: 0 }
    );
  };

  const totals = calculateTotals();

  // Carrega dados iniciais
  useEffect(() => {
    fetchCommissions();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-purple-600" />
              Relatório de Comissões
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Visualize e exporte comissões por profissional e período
            </p>
          </div>

          {/* Botões de Exportação */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleExportCSV}
              disabled={exportLoading || commissions.length === 0}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar CSV
            </Button>
            <Button
              variant="primary"
              onClick={handleExportPDF}
              disabled={exportLoading || commissions.length === 0}
              className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Exportar PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="mb-8">
        <CommissionSummaryCard
          professionals={professionals}
          onFetchCommissions={fetchCommissions}
          onExport={handleExportCSV}
          onViewDetails={() =>
            window.scrollTo({ top: 600, behavior: 'smooth' })
          }
        />
      </div>

      {/* Filtros Avançados */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Filtros Avançados
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Profissional */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <User className="w-4 h-4 inline mr-1" />
              Profissional
            </label>
            <select
              value={filters.professionalId}
              onChange={e =>
                handleFilterChange('professionalId', e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Todos</option>
              {professionals.map(prof => (
                <option key={prof.id} value={prof.id}>
                  {prof.name}
                </option>
              ))}
            </select>
          </div>

          {/* Data Início */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Data Início
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={e => handleFilterChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Data Fim */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Data Fim
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={e => handleFilterChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={e => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">Todas</option>
              <option value="paid">Pagas</option>
              <option value="pending">Pendentes</option>
            </select>
          </div>

          {/* Comanda */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nº Comanda
            </label>
            <input
              type="text"
              value={filters.orderId}
              onChange={e => handleFilterChange('orderId', e.target.value)}
              placeholder="Ex: 001"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-3 mt-4">
          <Button variant="primary" onClick={handleApplyFilters}>
            Aplicar Filtros
          </Button>
          <Button variant="outline" onClick={handleClearFilters}>
            Limpar
          </Button>
          <label className="flex items-center gap-2 ml-auto">
            <input
              type="checkbox"
              checked={groupByProfessional}
              onChange={e => setGroupByProfessional(e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Agrupar por profissional
            </span>
          </label>
        </div>
      </div>

      {/* Tabela de Comissões */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : commissions.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Nenhuma comissão encontrada com os filtros aplicados
            </p>
          </div>
        ) : groupByProfessional ? (
          /* Visualização Agrupada */
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {groupedCommissions().map((group, index) => (
              <div key={index} className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {group.professional}
                  </h3>
                  <div className="flex gap-4 text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Total:{' '}
                      <strong className="text-purple-600">
                        {formatCurrency(group.total)}
                      </strong>
                    </span>
                    <span className="text-green-600">
                      Pagas: {formatCurrency(group.paid)}
                    </span>
                    <span className="text-orange-600">
                      Pendentes: {formatCurrency(group.pending)}
                    </span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                          Data
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                          Comanda
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                          Cliente
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                          Serviço
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300">
                          Valor
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300">
                          %
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300">
                          Comissão
                        </th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {group.items.map(item => (
                        <tr
                          key={item.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            {formatDate(item.date)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            #{item.orderNumber}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            {item.clientName}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            {item.serviceName}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                            {formatCurrency(item.unitPrice)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-400">
                            {item.commissionPercentage}%
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-purple-600">
                            {formatCurrency(item.commissionValue)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                item.status === 'paid'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                              }`}
                            >
                              {item.status === 'paid' ? 'Paga' : 'Pendente'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Visualização Normal */
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Comanda
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Profissional
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Serviço
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    %
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Comissão
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {commissions.map(item => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {formatDate(item.date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      #{item.orderNumber}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {item.professionalName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {item.clientName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {item.serviceName}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-600 dark:text-gray-400">
                      {item.commissionPercentage}%
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-semibold text-purple-600">
                      {formatCurrency(item.commissionValue)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          item.status === 'paid'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                        }`}
                      >
                        {item.status === 'paid' ? 'Paga' : 'Pendente'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer com Totais */}
        {commissions.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-t border-gray-200 dark:border-gray-600">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total de {totals.count} {totals.count === 1 ? 'item' : 'itens'}
              </div>
              <div className="flex gap-6 text-sm font-semibold">
                <span className="text-gray-900 dark:text-white">
                  Total:{' '}
                  <span className="text-purple-600">
                    {formatCurrency(totals.total)}
                  </span>
                </span>
                <span className="text-green-600">
                  Pagas: {formatCurrency(totals.paid)}
                </span>
                <span className="text-orange-600">
                  Pendentes: {formatCurrency(totals.pending)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommissionReportPage;
