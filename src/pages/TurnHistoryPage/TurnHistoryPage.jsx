/**
 * @file TurnHistoryPage.jsx
 * @description Página de histórico da Lista da Vez com controle de acesso por perfil
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button } from '../../atoms';
import { LoadingSpinner } from '../../components/LoadingComponents/LoadingComponents';
import { useAuth } from '../../context/AuthContext';
import { useUnit } from '../../context/UnitContext';
import { useToast } from '../../context/ToastContext';
import { turnHistoryService } from '../../services/turnHistoryService';
import { supabase } from '../../services/supabase';
import { FiArrowLeft, FiCalendar, FiDownload } from 'react-icons/fi';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
const TurnHistoryPage = () => {
  const navigate = useNavigate();
  const {
    user,
    userRole
  } = useAuth();
  const {
    selectedUnit
  } = useUnit();
  const {
    showToast
  } = useToast();
  const [loading, setLoading] = useState(true);
  const [tableData, setTableData] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [totals, setTotals] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [currentProfessionalId, setCurrentProfessionalId] = useState(null);

  // Verificar se é barbeiro e obter seu ID
  useEffect(() => {
    const fetchProfessionalId = async () => {
      if (userRole === 'barbeiro' && user) {
        try {
          const {
            data,
            error
          } = await supabase.from('professionals').select('id').eq('user_id', user.id).single();
          if (error) throw error;
          setCurrentProfessionalId(data?.id);
        } catch (error) {
          console.error('Erro ao buscar ID do profissional:', error);
        }
      }
    };
    fetchProfessionalId();
  }, [user, userRole]);

  // Carregar dados do histórico
  useEffect(() => {
    const loadHistory = async () => {
      if (!selectedUnit?.id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const startDate = startOfMonth(new Date(selectedYear, selectedMonth - 1));
        const endDate = endOfMonth(new Date(selectedYear, selectedMonth - 1));
        const {
          tableData,
          professionals,
          totals,
          error
        } = await turnHistoryService.getDailyTableData(selectedUnit.id, format(startDate, 'yyyy-MM-dd'), format(endDate, 'yyyy-MM-dd'));
        if (error) throw new Error(error);

        // Se for barbeiro, filtrar apenas suas colunas
        if (userRole === 'barbeiro' && currentProfessionalId) {
          const {
            data: professional
          } = await supabase.from('professionals').select('name').eq('id', currentProfessionalId).single();
          if (professional) {
            const myName = professional.name;
            const filteredProfessionals = [myName];
            const filteredTableData = tableData.map(row => ({
              date: row.date,
              [myName]: row[myName] || 0,
              total: row[myName] || 0
            }));
            const filteredTotals = {
              date: 'Total',
              [myName]: totals[myName] || 0,
              total: totals[myName] || 0
            };
            setProfessionals(filteredProfessionals);
            setTableData(filteredTableData);
            setTotals(filteredTotals);
          }
        } else {
          setProfessionals(professionals);
          setTableData(tableData);
          setTotals(totals);
        }
      } catch (error) {
        console.error('Erro ao carregar histórico:', error);
        showToast({
          type: 'error',
          message: 'Erro ao carregar histórico'
        });
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, [selectedUnit, selectedMonth, selectedYear, userRole, currentProfessionalId, showToast]);

  // Função para formatar data
  const formatDate = dateString => {
    const date = new Date(dateString + 'T00:00:00');
    return format(date, "dd/MM/yyyy - EEE'.'", {
      locale: ptBR
    });
  };

  // Função para exportar CSV
  const handleExportCSV = () => {
    if (tableData.length === 0) {
      showToast({
        type: 'warning',
        message: 'Não há dados para exportar'
      });
      return;
    }
    const headers = ['Data', ...professionals, 'Total'];
    const rows = [headers.join(','), ...tableData.map(row => [formatDate(row.date), ...professionals.map(prof => row[prof] || 0), row.total].join(',')), ['TOTAL', ...professionals.map(prof => totals[prof] || 0), totals.total].join(',')];
    const csv = rows.join('\n');
    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;'
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `historico-lista-da-vez-${selectedMonth}-${selectedYear}.csv`;
    link.click();
    showToast({
      type: 'success',
      message: 'CSV exportado com sucesso!'
    });
  };

  // Calcular cor da célula baseado no valor
  const getCellColor = value => {
    if (value === 0) return '';
    if (value === 1) return 'bg-green-100 dark:bg-green-900/30';
    if (value === 2) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  };
  return <div className="p-6 space-y-6">
      {/* Header */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button onClick={() => navigate('/queue')} variant="secondary" className="flex items-center gap-2">
              <FiArrowLeft />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-theme-primary dark:text-dark-text-primary">
                Histórico da Lista da Vez
              </h1>
              <p className="text-sm text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
                {userRole === 'barbeiro' ? 'Visualize seu histórico de atendimentos' : 'Visualize o histórico completo de atendimentos'}
              </p>
            </div>
          </div>

          <Button onClick={handleExportCSV} variant="secondary" className="flex items-center gap-2" disabled={loading || tableData.length === 0}>
            <FiDownload />
            Exportar CSV
          </Button>
        </div>
      </Card>

      {/* Filtros */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <FiCalendar className="text-theme-secondary" />
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
              Mês:
            </label>
            <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} className="px-3 py-2 text-sm card-theme dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg">
              {Array.from({
              length: 12
            }, (_, i) => <option key={i + 1} value={i + 1}>
                  {format(new Date(2000, i), 'MMMM', {
                locale: ptBR
              })}
                </option>)}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
              Ano:
            </label>
            <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="px-3 py-2 text-sm card-theme dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg">
              {Array.from({
              length: 5
            }, (_, i) => {
              const year = new Date().getFullYear() - i;
              return <option key={year} value={year}>
                    {year}
                  </option>;
            })}
            </select>
          </div>
        </div>
      </Card>

      {/* Tabela */}
      <Card className="p-4">
        {loading ? <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div> : !selectedUnit ? <div className="text-center py-8 text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
            Selecione uma unidade para visualizar o histórico
          </div> : tableData.length === 0 ? <div className="text-center py-8 text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
            Nenhum dado encontrado para este período
          </div> : <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase card-theme dark:bg-dark-surface">
                <tr>
                  <th className="px-4 py-3 text-gray-700 dark:text-gray-300 dark:text-gray-600">
                    Dia
                  </th>
                  {professionals.map(prof => <th key={prof} className="px-4 py-3 text-center text-gray-700 dark:text-gray-300 dark:text-gray-600 card-theme dark:bg-dark-surface">
                      {prof}
                    </th>)}
                  <th className="px-4 py-3 text-center font-bold text-theme-primary dark:text-dark-text-primary bg-gray-200 dark:bg-gray-700">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, index) => <tr key={row.date} className="border-b dark:border-dark-border hover:bg-light-bg dark:bg-dark-bg dark:hover:bg-dark-surface">
                    <td className="px-4 py-3 font-medium text-theme-primary dark:text-dark-text-primary whitespace-nowrap">
                      {formatDate(row.date)}
                    </td>
                    {professionals.map(prof => <td key={prof} className={`px-4 py-3 text-center font-semibold ${getCellColor(row[prof])}`}>
                        {row[prof] || ''}
                      </td>)}
                    <td className="px-4 py-3 text-center font-bold text-theme-primary dark:text-dark-text-primary">
                      {row.total}
                    </td>
                  </tr>)}

                {/* Linha de Total */}
                <tr className="bg-gray-200 dark:bg-gray-700 font-bold">
                  <td className="px-4 py-3 text-theme-primary dark:text-dark-text-primary">
                    Total
                  </td>
                  {professionals.map(prof => <td key={prof} className="px-4 py-3 text-center text-theme-primary dark:text-dark-text-primary">
                      {totals[prof] || 0}
                    </td>)}
                  <td className="px-4 py-3 text-center text-theme-primary dark:text-dark-text-primary bg-gray-300 dark:bg-gray-600">
                    {totals.total || 0}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>}
      </Card>
    </div>;
};
export default TurnHistoryPage;