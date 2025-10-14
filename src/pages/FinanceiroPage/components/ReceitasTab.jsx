import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  DollarSign,
  TrendingUp,
  Calendar,
  User,
  Building2
} from 'lucide-react';
import { Button, Input } from '../../../atoms';
import financeiroService from '../../../services/financeiroService';
import NovaReceitaModal from './NovaReceitaModal';
import EditarReceitaModal from './EditarReceitaModal';

const TIPOS_RECEITA = [
  { value: 'servico', label: 'Serviço', color: 'bg-blue-100 text-blue-800' },
  { value: 'produto', label: 'Produto', color: 'bg-green-100 text-green-800' },
  { value: 'assinatura', label: 'Assinatura', color: 'bg-purple-100 text-purple-800' },
  { value: 'outros', label: 'Outros', color: 'bg-gray-100 text-gray-800' }
];

export default function ReceitasTab({ filters }) {
  const [receitas, setReceitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showNovaReceitaModal, setShowNovaReceitaModal] = useState(false);
  const [showEditarModal, setShowEditarModal] = useState(false);
  const [receitaSelecionada, setReceitaSelecionada] = useState(null);

  // Estatísticas
  const [estatisticas, setEstatisticas] = useState({
    total: 0,
    totalMes: 0,
    crescimento: 0
  });

  const fetchReceitas = useCallback(async () => {
    try {
      setLoading(true);
      
      const searchFilters = {
        ...filters,
        tipo: filtroTipo || undefined
      };

      const response = await financeiroService.getReceitas(searchFilters, currentPage, 20);
      
      setReceitas(response.data);
      setTotalPages(response.totalPages);
      setTotalCount(response.totalCount);
      
      // Calcular estatísticas
      const total = response.data.reduce((sum, item) => sum + item.valor, 0);
      setEstatisticas({
        total,
        totalMes: total, // Simplificado - seria calculado com base no período atual
        crescimento: 15.2 // Mock - seria calculado comparando com período anterior
      });

    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao buscar receitas:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage, filtroTipo]);

  useEffect(() => {
    fetchReceitas();
  }, [fetchReceitas]);

  const handleNovaReceita = async (dadosReceita) => {
    try {
      await financeiroService.createReceita(dadosReceita);
      setShowNovaReceitaModal(false);
      fetchReceitas();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao criar receita:', error);
      throw error;
    }
  };

  const handleEditarReceita = async (dadosReceita) => {
    try {
      await financeiroService.updateReceita(receitaSelecionada.id, dadosReceita);
      setShowEditarModal(false);
      setReceitaSelecionada(null);
      fetchReceitas();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao editar receita:', error);
      throw error;
    }
  };

  const handleExcluirReceita = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta receita?')) {
      try {
        await financeiroService.deleteReceita(id);
        fetchReceitas();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Erro ao excluir receita:', error);
      }
    }
  };

  const getTipoConfig = (tipo) => {
    return TIPOS_RECEITA.find(t => t.value === tipo) || TIPOS_RECEITA[3];
  };

  const receitasFiltradas = receitas.filter(receita => 
    receita.profissional.toLowerCase().includes(searchTerm.toLowerCase()) ||
    receita.origem?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Cabeçalho com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Receitas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(estatisticas.total)}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total do Período</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(estatisticas.totalMes)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Crescimento</p>
              <p className="text-2xl font-bold text-green-600">
                +{estatisticas.crescimento.toFixed(1)}%
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros e ações */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar por profissional ou origem..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-80"
            />
          </div>

          {/* Filtro por tipo */}
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Todos os tipos</option>
            {TIPOS_RECEITA.map(tipo => (
              <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
            ))}
          </select>
        </div>

        <Button
          onClick={() => setShowNovaReceitaModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nova Receita
        </Button>
      </div>

      {/* Tabela de receitas */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Profissional
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Unidade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Origem
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {receitasFiltradas.map((receita) => {
                const tipoConfig = getTipoConfig(receita.tipo);
                return (
                  <tr key={receita.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {new Date(receita.data).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tipoConfig.color}`}>
                        {tipoConfig.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(receita.valor)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {receita.profissional}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building2 className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {receita.unidade}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {receita.origem || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setReceitaSelecionada(receita);
                            setShowEditarModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 dark:hover:text-blue-400"
                          title="Editar"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleExcluirReceita(receita.id)}
                          className="text-red-600 hover:text-red-900 dark:hover:text-red-400"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <Button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                >
                  Anterior
                </Button>
                <Button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  variant="outline"
                >
                  Próxima
                </Button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Mostrando <span className="font-medium">{((currentPage - 1) * 20) + 1}</span> até{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * 20, totalCount)}
                    </span> de{' '}
                    <span className="font-medium">{totalCount}</span> receitas
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                  >
                    Anterior
                  </Button>
                  <Button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    size="sm"
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showNovaReceitaModal && (
        <NovaReceitaModal
          onClose={() => setShowNovaReceitaModal(false)}
          onSubmit={handleNovaReceita}
        />
      )}

      {showEditarModal && receitaSelecionada && (
        <EditarReceitaModal
          receita={receitaSelecionada}
          onClose={() => {
            setShowEditarModal(false);
            setReceitaSelecionada(null);
          }}
          onSubmit={handleEditarReceita}
        />
      )}
    </div>
  );
}