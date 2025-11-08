import React, { useState, useEffect } from 'react';
import { Download, FileText, Filter, TrendingUp, Calendar, User } from 'lucide-react';
import { Button } from '../atoms/Button/Button';
import CommissionSummaryCard from '../components/organisms/CommissionSummaryCard';
import { formatCurrency, formatDate } from '../utils/formatters';
import { exportCommissionsToCSV, exportCommissionsToPDF } from '../utils/exportCommissions';
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
    status: 'all',
    // all, paid, pending
    orderId: ''
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
        setProfessionals([{
          id: '1',
          name: 'João Silva'
        }, {
          id: '2',
          name: 'Maria Santos'
        }, {
          id: '3',
          name: 'Pedro Costa'
        }]);
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
      const mockCommissions = [{
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
        paymentDate: '2025-01-25'
      }, {
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
        date: '2025-01-22'
      }, {
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
        paymentDate: '2025-01-28'
      }];
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
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
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
      orderId: ''
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
          pending: 0
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
    return commissions.reduce((acc, item) => {
      acc.total += item.commissionValue;
      if (item.status === 'paid') {
        acc.paid += item.commissionValue;
      } else {
        acc.pending += item.commissionValue;
      }
      acc.count++;
      return acc;
    }, {
      total: 0,
      paid: 0,
      pending: 0,
      count: 0
    });
  };
  const totals = calculateTotals();

  // Carrega dados iniciais
  useEffect(() => {
    fetchCommissions();
  }, []);
  return <div className="min-h-screen bg-gradient-light p-6 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-theme-primary dark:text-dark-text-primary flex items-center gap-3 text-3xl font-bold">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              Relatório de Comissões
            </h1>
            <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mt-2">
              Visualize e exporte comissões por profissional e período
            </p>
          </div>

          {/* Botões de Exportação */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleExportCSV} disabled={exportLoading || commissions.length === 0} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
            <Button variant="primary" onClick={handleExportPDF} disabled={exportLoading || commissions.length === 0} className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Exportar PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="mb-8">
        <CommissionSummaryCard professionals={professionals} onFetchCommissions={fetchCommissions} onExport={handleExportCSV} onViewDetails={() => window.scrollTo({
        top: 600,
        behavior: 'smooth'
      })} />
      </div>

      {/* Filtros Avançados */}
      <div className="card-theme mb-6 rounded-xl p-6 shadow-md dark:bg-dark-surface">
        <div className="mb-4 flex items-center gap-2">
          <Filter className="h-5 w-5 text-purple-600" />
          <h2 className="text-theme-primary dark:text-dark-text-primary text-lg font-semibold">
            Filtros Avançados
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {/* Profissional */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 dark:text-theme-secondary">
              <User className="mr-1 inline h-4 w-4" />
              Profissional
            </label>
            <select value={filters.professionalId} onChange={e => handleFilterChange('professionalId', e.target.value)} className="card-theme text-theme-primary dark:text-dark-text-primary w-full rounded-lg border border-light-border px-3 py-2 focus:ring-2 focus:ring-purple-500 dark:border-dark-border dark:bg-gray-700">
              <option value="">Todos</option>
              {professionals.map(prof => <option key={prof.id} value={prof.id}>
                  {prof.name}
                </option>)}
            </select>
          </div>

          {/* Data Início */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 dark:text-theme-secondary">
              <Calendar className="mr-1 inline h-4 w-4" />
              Data Início
            </label>
            <input type="date" value={filters.startDate} onChange={e => handleFilterChange('startDate', e.target.value)} className="card-theme text-theme-primary dark:text-dark-text-primary w-full rounded-lg border border-light-border px-3 py-2 focus:ring-2 focus:ring-purple-500 dark:border-dark-border dark:bg-gray-700" />
          </div>

          {/* Data Fim */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 dark:text-theme-secondary">
              <Calendar className="mr-1 inline h-4 w-4" />
              Data Fim
            </label>
            <input type="date" value={filters.endDate} onChange={e => handleFilterChange('endDate', e.target.value)} className="card-theme text-theme-primary dark:text-dark-text-primary w-full rounded-lg border border-light-border px-3 py-2 focus:ring-2 focus:ring-purple-500 dark:border-dark-border dark:bg-gray-700" />
          </div>

          {/* Status */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 dark:text-theme-secondary">
              Status
            </label>
            <select value={filters.status} onChange={e => handleFilterChange('status', e.target.value)} className="card-theme text-theme-primary dark:text-dark-text-primary w-full rounded-lg border border-light-border px-3 py-2 focus:ring-2 focus:ring-purple-500 dark:border-dark-border dark:bg-gray-700">
              <option value="all">Todas</option>
              <option value="paid">Pagas</option>
              <option value="pending">Pendentes</option>
            </select>
          </div>

          {/* Comanda */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 dark:text-theme-secondary">
              Nº Comanda
            </label>
            <input type="text" value={filters.orderId} onChange={e => handleFilterChange('orderId', e.target.value)} placeholder="Ex: 001" className="card-theme text-theme-primary dark:text-dark-text-primary w-full rounded-lg border border-light-border px-3 py-2 focus:ring-2 focus:ring-purple-500 dark:border-dark-border dark:bg-gray-700" />
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="mt-4 flex gap-3">
          <Button variant="primary" onClick={handleApplyFilters}>
            Aplicar Filtros
          </Button>
          <Button variant="outline" onClick={handleClearFilters}>
            Limpar
          </Button>
          <label className="ml-auto flex items-center gap-2">
            <input type="checkbox" checked={groupByProfessional} onChange={e => setGroupByProfessional(e.target.checked)} className="h-4 w-4 rounded text-purple-600 focus:ring-purple-500" />
            <span className="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-600 dark:text-theme-secondary">
              Agrupar por profissional
            </span>
          </label>
        </div>
      </div>

      {/* Tabela de Comissões */}
      <div className="card-theme overflow-hidden rounded-xl shadow-md dark:bg-dark-surface">
        {loading ? <div className="flex items-center justify-center py-12">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-purple-600"></div>
          </div> : commissions.length === 0 ? <div className="py-12 text-center">
            <FileText className="text-light-text-muted dark:text-dark-text-muted mx-auto mb-4 h-16 w-16" />
            <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
              Nenhuma comissão encontrada com os filtros aplicados
            </p>
          </div> : groupByProfessional /* Visualização Agrupada */ ? <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {groupedCommissions().map((group, index) => <div key={index} className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-theme-primary dark:text-dark-text-primary text-lg font-semibold">
                    {group.professional}
                  </h3>
                  <div className="flex gap-4 text-sm">
                    <span className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
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
                    <thead className="bg-light-bg dark:bg-dark-bg dark:bg-gray-700">
                      <tr>
                        <th className="text-theme-secondary px-4 py-2 text-left text-xs font-medium dark:text-gray-300 dark:text-gray-600 dark:text-theme-secondary">
                          Data
                        </th>
                        <th className="text-theme-secondary px-4 py-2 text-left text-xs font-medium dark:text-gray-300 dark:text-gray-600 dark:text-theme-secondary">
                          Comanda
                        </th>
                        <th className="text-theme-secondary px-4 py-2 text-left text-xs font-medium dark:text-gray-300 dark:text-gray-600 dark:text-theme-secondary">
                          Cliente
                        </th>
                        <th className="text-theme-secondary px-4 py-2 text-left text-xs font-medium dark:text-gray-300 dark:text-gray-600 dark:text-theme-secondary">
                          Serviço
                        </th>
                        <th className="text-theme-secondary px-4 py-2 text-right text-xs font-medium dark:text-gray-300 dark:text-gray-600 dark:text-theme-secondary">
                          Valor
                        </th>
                        <th className="text-theme-secondary px-4 py-2 text-right text-xs font-medium dark:text-gray-300 dark:text-gray-600 dark:text-theme-secondary">
                          %
                        </th>
                        <th className="text-theme-secondary px-4 py-2 text-right text-xs font-medium dark:text-gray-300 dark:text-gray-600 dark:text-theme-secondary">
                          Comissão
                        </th>
                        <th className="text-theme-secondary px-4 py-2 text-center text-xs font-medium dark:text-gray-300 dark:text-gray-600 dark:text-theme-secondary">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {group.items.map(item => <tr key={item.id} className="hover:bg-light-bg dark:bg-dark-bg dark:hover:bg-gray-700">
                          <td className="text-theme-primary dark:text-dark-text-primary px-4 py-3 text-sm">
                            {formatDate(item.date)}
                          </td>
                          <td className="text-theme-primary dark:text-dark-text-primary px-4 py-3 text-sm">
                            #{item.orderNumber}
                          </td>
                          <td className="text-theme-primary dark:text-dark-text-primary px-4 py-3 text-sm">
                            {item.clientName}
                          </td>
                          <td className="text-theme-primary dark:text-dark-text-primary px-4 py-3 text-sm">
                            {item.serviceName}
                          </td>
                          <td className="text-theme-primary dark:text-dark-text-primary px-4 py-3 text-right text-sm">
                            {formatCurrency(item.unitPrice)}
                          </td>
                          <td className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted px-4 py-3 text-right text-sm">
                            {item.commissionPercentage}%
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-semibold text-purple-600">
                            {formatCurrency(item.commissionValue)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`rounded-full px-2 py-1 text-xs font-medium ${item.status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'}`}>
                              {item.status === 'paid' ? 'Paga' : 'Pendente'}
                            </span>
                          </td>
                        </tr>)}
                    </tbody>
                  </table>
                </div>
              </div>)}
          </div> /* Visualização Normal */ : <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-light-bg dark:bg-dark-bg dark:bg-gray-700">
                <tr>
                  <th className="text-theme-secondary px-6 py-3 text-left text-xs font-medium uppercase dark:text-gray-300 dark:text-gray-600 dark:text-theme-secondary">
                    Data
                  </th>
                  <th className="text-theme-secondary px-6 py-3 text-left text-xs font-medium uppercase dark:text-gray-300 dark:text-gray-600 dark:text-theme-secondary">
                    Comanda
                  </th>
                  <th className="text-theme-secondary px-6 py-3 text-left text-xs font-medium uppercase dark:text-gray-300 dark:text-gray-600 dark:text-theme-secondary">
                    Profissional
                  </th>
                  <th className="text-theme-secondary px-6 py-3 text-left text-xs font-medium uppercase dark:text-gray-300 dark:text-gray-600 dark:text-theme-secondary">
                    Cliente
                  </th>
                  <th className="text-theme-secondary px-6 py-3 text-left text-xs font-medium uppercase dark:text-gray-300 dark:text-gray-600 dark:text-theme-secondary">
                    Serviço
                  </th>
                  <th className="text-theme-secondary px-6 py-3 text-right text-xs font-medium uppercase dark:text-gray-300 dark:text-gray-600 dark:text-theme-secondary">
                    Valor
                  </th>
                  <th className="text-theme-secondary px-6 py-3 text-right text-xs font-medium uppercase dark:text-gray-300 dark:text-gray-600 dark:text-theme-secondary">
                    %
                  </th>
                  <th className="text-theme-secondary px-6 py-3 text-right text-xs font-medium uppercase dark:text-gray-300 dark:text-gray-600 dark:text-theme-secondary">
                    Comissão
                  </th>
                  <th className="text-theme-secondary px-6 py-3 text-center text-xs font-medium uppercase dark:text-gray-300 dark:text-gray-600 dark:text-theme-secondary">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {commissions.map(item => <tr key={item.id} className="hover:bg-light-bg dark:bg-dark-bg dark:hover:bg-gray-700">
                    <td className="text-theme-primary dark:text-dark-text-primary px-6 py-4 text-sm">
                      {formatDate(item.date)}
                    </td>
                    <td className="text-theme-primary dark:text-dark-text-primary px-6 py-4 text-sm">
                      #{item.orderNumber}
                    </td>
                    <td className="text-theme-primary dark:text-dark-text-primary px-6 py-4 text-sm">
                      {item.professionalName}
                    </td>
                    <td className="text-theme-primary dark:text-dark-text-primary px-6 py-4 text-sm">
                      {item.clientName}
                    </td>
                    <td className="text-theme-primary dark:text-dark-text-primary px-6 py-4 text-sm">
                      {item.serviceName}
                    </td>
                    <td className="text-theme-primary dark:text-dark-text-primary px-6 py-4 text-right text-sm">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted px-6 py-4 text-right text-sm">
                      {item.commissionPercentage}%
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-purple-600">
                      {formatCurrency(item.commissionValue)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${item.status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'}`}>
                        {item.status === 'paid' ? 'Paga' : 'Pendente'}
                      </span>
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>}

        {/* Footer com Totais */}
        {commissions.length > 0 && <div className="border-t border-light-border bg-light-bg px-6 py-4 dark:border-dark-border dark:bg-dark-bg dark:bg-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm">
                Total de {totals.count} {totals.count === 1 ? 'item' : 'itens'}
              </div>
              <div className="flex gap-6 text-sm font-semibold">
                <span className="text-theme-primary dark:text-dark-text-primary">
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
          </div>}
      </div>
    </div>;
};
export default CommissionReportPage;