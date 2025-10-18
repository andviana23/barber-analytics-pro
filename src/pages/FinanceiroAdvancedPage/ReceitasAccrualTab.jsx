import React, { useState, useEffect, useCallback } from 'react';
import { DollarSign, Plus, Search, RefreshCw, Calendar, Loader2, Trash2, Filter, Landmark } from 'lucide-react';

// Components
import { NovaReceitaAccrualModal } from '../../templates/NovaReceitaAccrualModal';
import { EmptyState } from '../../atoms/EmptyState';

// Services
import financeiroService from '../../services/financeiroService';
import unitsService from '../../services/unitsService';

// Context
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

/**
 * Tab de Receitas por Competência
 * 
 * Features:
 * - Toggle entre modo Caixa e Competência
 * - NovaReceitaAccrualModal para criar receitas com competência
 * - Lista e filtros de receitas por competência
 * - Filtro por unidade
 * - Deletar receita (apenas administrador)
 */
const ReceitasAccrualTab = ({ globalFilters }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [accrualMode, setAccrualMode] = useState(true); // true = Competência, false = Caixa
  const [receitas, setReceitas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUnitFilter, setSelectedUnitFilter] = useState('');
  const [units, setUnits] = useState([]);
  const [deletingId, setDeletingId] = useState(null);
  const { addToast } = useToast();
  const { user } = useAuth();
  
  // Verificar se é administrador
  const isAdmin = user?.user_metadata?.role === 'admin';

  // Buscar receitas do banco de dados
  const fetchReceitas = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {};
      
      // Aplicar filtro de unidade se selecionado
      if (selectedUnitFilter) {
        filters.unit_id = selectedUnitFilter;
      } else if (globalFilters?.unit_id) {
        filters.unit_id = globalFilters.unit_id;
      }
      
      const { data, error } = await financeiroService.getReceitas(filters);
      
      if (error) {
        // eslint-disable-next-line no-console
        console.error('Erro ao buscar receitas:', error);
        addToast({
          type: 'error',
          message: 'Erro ao carregar receitas',
          description: error.message || 'Não foi possível carregar as receitas.'
        });
        setReceitas([]);
      } else {
        // eslint-disable-next-line no-console
        console.log('📊 Receitas carregadas:', data);
        // eslint-disable-next-line no-console
        console.log('📊 Primeira receita:', data?.[0]);
        // eslint-disable-next-line no-console
        console.log('📊 Conta bancária da primeira:', data?.[0]?.bank_account);
        setReceitas(data || []);
      }
    } catch (_err) {
      // eslint-disable-next-line no-console
      console.error('Erro inesperado:', _err);
      setReceitas([]);
    } finally {
      setLoading(false);
    }
  }, [selectedUnitFilter, globalFilters?.unit_id, addToast]);

  // Carregar unidades para o filtro
  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const data = await unitsService.getUnits();
        setUnits(data || []);
      } catch (err) {
        setUnits([]);
      }
    };
    fetchUnits();
  }, []);

  // Carregar receitas ao montar e quando filtros mudarem
  useEffect(() => {
    if (accrualMode) {
      fetchReceitas();
    }
  }, [accrualMode, fetchReceitas]);

  const handleCreateSuccess = () => {
    setIsModalOpen(false);
    fetchReceitas(); // Recarregar lista
    addToast({
      type: 'success',
      message: 'Receita cadastrada com sucesso!',
      description: 'A receita foi salva e aparecerá nos relatórios.'
    });
  };

  // Deletar receita (apenas administrador)
  const handleDeleteReceita = async (id, titulo) => {
    if (!isAdmin) {
      addToast({
        type: 'error',
        message: 'Acesso negado',
        description: 'Apenas administradores podem deletar receitas.'
      });
      return;
    }

    if (!confirm(`Tem certeza que deseja deletar a receita "${titulo}"?\n\nEsta ação não pode ser desfeita.`)) {
      return;
    }

    setDeletingId(id);
    try {
      const { success, error } = await financeiroService.deleteReceita(id);
      
      if (!success || error) {
        addToast({
          type: 'error',
          message: 'Erro ao deletar receita',
          description: error || 'Não foi possível deletar a receita.'
        });
      } else {
        addToast({
          type: 'success',
          message: 'Receita deletada!',
          description: 'A receita foi removida com sucesso.'
        });
        
        // ✅ Recarregar lista após deletar
        await fetchReceitas();
      }
    } catch (err) {
      addToast({
        type: 'error',
        message: 'Erro inesperado',
        description: err.message || 'Não foi possível deletar a receita.'
      });
    } finally {
      setDeletingId(null);
    }
  };

  // Filtrar receitas por busca
  const filteredReceitas = receitas.filter(receita => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      receita.source?.toLowerCase().includes(term) ||
      receita.observations?.toLowerCase().includes(term) ||
      receita.value?.toString().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header com toggle - Dark Mode */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Receitas
              </h3>
            </div>

            {/* Toggle Caixa/Competência - Dark Mode */}
            <div className="flex items-center space-x-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <button
                onClick={() => setAccrualMode(false)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  !accrualMode
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Caixa
              </button>
              <button
                onClick={() => setAccrualMode(true)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  accrualMode
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Competência
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 dark:bg-green-500 rounded-md hover:bg-green-700 dark:hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Receita
            </button>
          </div>
        </div>

        {/* Descrição do modo - Dark Mode */}
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            {accrualMode ? (
              <>
                <strong>Modo Competência:</strong> As receitas são registradas no período em que foram 
                geradas (competência), independentemente da data de recebimento.
              </>
            ) : (
              <>
                <strong>Modo Caixa:</strong> As receitas são registradas apenas quando efetivamente 
                recebidas no caixa da empresa.
              </>
            )}
          </p>
        </div>
      </div>

      {/* Conteúdo principal - Dark Mode */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        {accrualMode ? (
          // Modo Competência - Lista com campos de competência
          <div className="space-y-4">
            {/* Barra de busca e ações */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1 w-full">
                {/* Campo de busca */}
                <div className="flex-1 max-w-md w-full">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar por título, valor..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
                
                {/* Filtro por unidade */}
                <div className="w-full sm:w-64">
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                      value={selectedUnitFilter}
                      onChange={(e) => setSelectedUnitFilter(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none"
                    >
                      <option value="">Todas as unidades</option>
                      {units.map(unit => (
                        <option key={unit.id} value={unit.id}>{unit.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              <button
                onClick={fetchReceitas}
                disabled={loading}
                className="flex items-center px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
            </div>

            {/* Lista de receitas */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
                <span className="ml-3 text-gray-600 dark:text-gray-400">Carregando receitas...</span>
              </div>
            ) : filteredReceitas.length === 0 ? (
              <EmptyState
                icon="finance"
                title={searchTerm ? "Nenhuma receita encontrada" : "Nenhuma receita cadastrada"}
                description={searchTerm ? "Tente ajustar os filtros de busca." : "Gerencie suas receitas considerando o período de competência."}
                actionLabel={searchTerm ? undefined : "Criar primeira receita"}
                onAction={searchTerm ? undefined : () => setIsModalOpen(true)}
              />
            ) : (
              <div className="space-y-3">
                {filteredReceitas.map((receita) => (
                  <div
                    key={receita.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow bg-white dark:bg-gray-800"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {receita.source || 'Sem título'}
                          </h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            receita.status === 'Received' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              : receita.status === 'Pending'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {receita.status === 'Received' ? 'Recebido' : receita.status === 'Pending' ? 'Pendente' : receita.status}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Valor:</span>
                            <p className="font-semibold text-green-600 dark:text-green-400">
                              {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                              }).format(receita.value || 0)}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Data Pagamento:
                            </span>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {receita.date ? new Date(receita.date + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Previsão Recebimento:
                            </span>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {receita.expected_receipt_date ? new Date(receita.expected_receipt_date + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <Landmark className="w-3 h-3" />
                              Conta Bancária:
                            </span>
                            <p className="font-medium text-gray-900 dark:text-white truncate" title={receita.bank_account ? `${receita.bank_account.name} - ${receita.bank_account.bank_name}` : 'Não informado'}>
                              {receita.bank_account ? `${receita.bank_account.name}` : '-'}
                            </p>
                          </div>
                        </div>

                        {receita.observations && (
                          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            💬 {receita.observations}
                          </p>
                        )}
                      </div>

                      {/* Botão deletar - apenas para administrador */}
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteReceita(receita.id, receita.source || 'Sem título')}
                          disabled={deletingId === receita.id}
                          className="flex items-center justify-center p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Deletar receita (apenas administrador)"
                        >
                          {deletingId === receita.id ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Trash2 className="w-5 h-5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Modo Caixa - Redirecionar para aba original
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">💰</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Modo Caixa
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Para visualizar receitas em modo caixa, utilize a aba de receitas tradicional 
              no módulo financeiro principal.
            </p>
            <button
              onClick={() => setAccrualMode(true)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30"
            >
              Voltar para Competência
            </button>
          </div>
        )}
      </div>

      {/* Modal de nova receita */}
      <NovaReceitaAccrualModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={async (receita) => {
          try {
            // eslint-disable-next-line no-console
            console.log('📤 Enviando receita para o banco:', receita);
            
            const { data, error } = await financeiroService.createReceita(receita);
            
            if (error) {
              // eslint-disable-next-line no-console
              console.error('❌ Erro ao criar receita:', error);
              
              // Mensagem amigável baseada no tipo de erro
              let userMessage = 'Erro ao cadastrar receita';
              let description = error;
              
              // Detectar tipo de erro e personalizar mensagem
              if (error.includes('Campo obrigatório')) {
                userMessage = 'Dados incompletos';
                description = error;
              } else if (error.includes('inválido') || error.includes('deve')) {
                userMessage = 'Dados inválidos';
                description = error;
              } else if (error.includes('configuração')) {
                userMessage = 'Erro de configuração';
                description = 'Há um problema com a estrutura do banco de dados. Contate o suporte técnico.';
              } else if (error.includes('duplicada')) {
                userMessage = 'Receita duplicada';
                description = 'Já existe uma receita com estes dados no sistema.';
              } else if (error.includes('Referência inválida')) {
                userMessage = 'Dados de referência inválidos';
                description = 'Verifique se a unidade, conta bancária ou profissional estão corretos.';
              }
              
              addToast({
                type: 'error',
                message: userMessage,
                description: description
              });
              return;
            }
            
            // eslint-disable-next-line no-console
            console.log('✅ Receita criada com sucesso:', data);
            
            // Mensagem de sucesso personalizada
            const valorFormatado = data.value ? 
              new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(data.value) : 'R$ 0,00';
            
            addToast({
              type: 'success',
              message: 'Receita cadastrada com sucesso! ✅',
              description: `Receita de ${valorFormatado} registrada no sistema.`
            });
            
            handleCreateSuccess();
            
          } catch (err) {
            // eslint-disable-next-line no-console
            console.error('❌ Erro inesperado:', err);
            addToast({
              type: 'error',
              message: 'Erro inesperado',
              description: 'Ocorreu um erro ao processar a receita. Por favor, tente novamente ou contate o suporte.'
            });
          }
        }}
      />
    </div>
  );
};

export default ReceitasAccrualTab;