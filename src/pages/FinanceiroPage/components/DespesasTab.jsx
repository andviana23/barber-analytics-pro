import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  TrendingDown,
  Calendar,
  Building2,
  Tag,
  Repeat
} from 'lucide-react';
import { Button, Input } from '../../../atoms';
import financeiroService from '../../../services/financeiroService';
import NovaDespesaModal from './NovaDespesaModal';
import EditarDespesaModal from './EditarDespesaModal';

const TIPOS_DESPESA = [
  { value: 'fixa', label: 'Fixa', color: 'bg-red-100 text-red-800' },
  { value: 'variavel', label: 'Variável', color: 'bg-orange-100 text-orange-800' }
];

const CATEGORIAS_DESPESA = [
  { value: 'aluguel', label: 'Aluguel' },
  { value: 'energia', label: 'Energia Elétrica' },
  { value: 'agua', label: 'Água' },
  { value: 'internet', label: 'Internet/Telefone' },
  { value: 'produtos', label: 'Produtos' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'manutencao', label: 'Manutenção' },
  { value: 'limpeza', label: 'Limpeza' },
  { value: 'salarios', label: 'Salários' },
  { value: 'impostos', label: 'Impostos/Taxas' },
  { value: 'outros', label: 'Outros' }
];

export default function DespesasTab({ filters }) {
  const [despesas, setDespesas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showNovaDespesaModal, setShowNovaDespesaModal] = useState(false);
  const [showEditarModal, setShowEditarModal] = useState(false);
  const [despesaSelecionada, setDespesaSelecionada] = useState(null);

  // Estatísticas
  const [estatisticas, setEstatisticas] = useState({
    totalFixas: 0,
    totalVariaveis: 0,
    total: 0,
    crescimento: 0
  });

  const fetchDespesas = useCallback(async () => {
    try {
      setLoading(true);
      
      const searchFilters = {
        ...filters,
        tipo: filtroTipo || undefined,
        categoria: filtroCategoria || undefined
      };

      const response = await financeiroService.getDespesas(searchFilters, currentPage, 20);
      
      setDespesas(response.data);
      setTotalPages(response.totalPages);
      setTotalCount(response.totalCount);
      
      // Calcular estatísticas
      const totalFixas = response.data.filter(d => d.tipo === 'fixa').reduce((sum, item) => sum + item.valor, 0);
      const totalVariaveis = response.data.filter(d => d.tipo === 'variavel').reduce((sum, item) => sum + item.valor, 0);
      const total = totalFixas + totalVariaveis;
      
      setEstatisticas({
        totalFixas,
        totalVariaveis,
        total,
        crescimento: -5.3 // Mock - seria calculado comparando com período anterior
      });

    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao buscar despesas:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage, filtroTipo, filtroCategoria]);

  useEffect(() => {
    fetchDespesas();
  }, [fetchDespesas]);

  const handleNovaDespesa = async (dadosDespesa) => {
    try {
      await financeiroService.createDespesa(dadosDespesa);
      setShowNovaDespesaModal(false);
      fetchDespesas();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao criar despesa:', error);
      throw error;
    }
  };

  const handleEditarDespesa = async (dadosDespesa) => {
    try {
      await financeiroService.updateDespesa(despesaSelecionada.id, dadosDespesa);
      setShowEditarModal(false);
      setDespesaSelecionada(null);
      fetchDespesas();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao editar despesa:', error);
      throw error;
    }
  };

  const handleExcluirDespesa = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta despesa?')) {
      try {
        await financeiroService.deleteDespesa(id);
        fetchDespesas();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Erro ao excluir despesa:', error);
      }
    }
  };

  const getTipoConfig = (tipo) => {
    return TIPOS_DESPESA.find(t => t.value === tipo) || TIPOS_DESPESA[1];
  };

  const getCategoriaLabel = (categoria) => {
    const cat = CATEGORIAS_DESPESA.find(c => c.value === categoria);
    return cat ? cat.label : categoria;
  };

  const despesasFiltradas = despesas.filter(despesa => 
    getCategoriaLabel(despesa.categoria).toLowerCase().includes(searchTerm.toLowerCase()) ||
    despesa.observacoes?.toLowerCase().includes(searchTerm.toLowerCase())
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Despesas Fixas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(estatisticas.totalFixas)}
              </p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Despesas Variáveis</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(estatisticas.totalVariaveis)}
              </p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <TrendingDown className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Despesas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(estatisticas.total)}
              </p>
            </div>
            <div className="p-3 bg-gray-100 dark:bg-gray-900/20 rounded-lg">
              <Calendar className="h-6 w-6 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Variação</p>
              <p className={`text-2xl font-bold ${estatisticas.crescimento < 0 ? 'text-green-600' : 'text-red-600'}`}>
                {estatisticas.crescimento > 0 ? '+' : ''}{estatisticas.crescimento.toFixed(1)}%
              </p>
            </div>
            <div className={`p-3 rounded-lg ${estatisticas.crescimento < 0 ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
              <TrendingDown className={`h-6 w-6 ${estatisticas.crescimento < 0 ? 'text-green-600' : 'text-red-600'}`} />
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
              placeholder="Buscar por categoria ou observação..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-80"
            />
          </div>

          {/* Filtro por tipo */}
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">Todos os tipos</option>
            {TIPOS_DESPESA.map(tipo => (
              <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
            ))}
          </select>

          {/* Filtro por categoria */}
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">Todas as categorias</option>
            {CATEGORIAS_DESPESA.map(categoria => (
              <option key={categoria.value} value={categoria.value}>{categoria.label}</option>
            ))}
          </select>
        </div>

        <Button
          onClick={() => setShowNovaDespesaModal(true)}
          className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nova Despesa
        </Button>
      </div>

      {/* Tabela de despesas */}
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
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Unidade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Recorrente
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {despesasFiltradas.map((despesa) => {
                const tipoConfig = getTipoConfig(despesa.tipo);
                return (
                  <tr key={despesa.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {new Date(despesa.data).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tipoConfig.color}`}>
                        {tipoConfig.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Tag className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {getCategoriaLabel(despesa.categoria)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(despesa.valor)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building2 className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {despesa.unidade}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {despesa.recorrente ? (
                          <>
                            <Repeat className="h-4 w-4 text-blue-500 mr-2" />
                            <span className="text-sm text-blue-600 dark:text-blue-400">Sim</span>
                          </>
                        ) : (
                          <span className="text-sm text-gray-500 dark:text-gray-400">Não</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setDespesaSelecionada(despesa);
                            setShowEditarModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 dark:hover:text-blue-400"
                          title="Editar"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleExcluirDespesa(despesa.id)}
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
                    <span className="font-medium">{totalCount}</span> despesas
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
      {showNovaDespesaModal && (
        <NovaDespesaModal
          onClose={() => setShowNovaDespesaModal(false)}
          onSubmit={handleNovaDespesa}
        />
      )}

      {showEditarModal && despesaSelecionada && (
        <EditarDespesaModal
          despesa={despesaSelecionada}
          onClose={() => {
            setShowEditarModal(false);
            setDespesaSelecionada(null);
          }}
          onSubmit={handleEditarDespesa}
        />
      )}
    </div>
  );
}