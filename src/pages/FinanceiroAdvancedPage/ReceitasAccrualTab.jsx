import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { DollarSign, Plus, Search, RefreshCw, Calendar, Loader2, Trash2, Filter, CheckCircle2, Clock, TrendingUp, X, Eye, Edit2, Download, FileText, User, CreditCard, Building2 } from 'lucide-react';

// Components
import { NovaReceitaAccrualModal } from '../../templates/NovaReceitaAccrualModal';
import { EditarReceitaModal } from '../../templates/EditarReceitaModal';
import { EmptyState } from '../../atoms/EmptyState';
import ImportRevenuesFromStatementButton from '../../components/finance/ImportRevenuesFromStatementButton';

// Services
import financeiroService from '../../services/financeiroService';
import unitsService from '../../services/unitsService';

// Context
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { useUnit } from '../../context/UnitContext';

/**
 * 📊 Receitas (Competência) - 100% REFATORADO COM DESIGN SYSTEM
 *
 * Features:
 * - ✅ Design System completo aplicado
 * - ✅ Botões de ação: Ver Detalhes, Editar, Apagar
 * - ✅ Modais profissionais (Detalhes, Editar, Deletar)
 * - ✅ UI ultra moderna com gradientes e hover effects
 * - ✅ Tabela responsiva com densidade otimizada
 * - ✅ Cards de métricas com gradientes temáticos
 * - ✅ Filtros rápidos por status
 * - ✅ Auto-atualização de status (Pending → Received quando data prevista passou)
 * - ✅ Dark mode completo
 */
const ReceitasAccrualTab = ({
  globalFilters
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedReceita, setSelectedReceita] = useState(null);
  const [receitas, setReceitas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'Received', 'Pending'
  const [selectedUnitFilter, setSelectedUnitFilter] = useState('');
  const [units, setUnits] = useState([]);
  const [deletingId, setDeletingId] = useState(null);

  // 📅 Estado do mês selecionado (formato: YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return format(now, 'yyyy-MM');
  });
  const {
    showError,
    showSuccess
  } = useToast();
  const {
    user
  } = useAuth();
  const {
    selectedUnit
  } = useUnit();

  // Verificar se é administrador
  const isAdmin = user?.user_metadata?.role === 'admin';

  // 📊 Calcular métricas - LÓGICA COMPLETAMENTE REFATORADA
  const metrics = React.useMemo(() => {
    // Obter o primeiro e último dia do mês selecionado
    const [year, month] = selectedMonth.split('-').map(Number);
    const primeiroDiaMes = new Date(year, month - 1, 1);
    const ultimoDiaMes = new Date(year, month, 0);
    console.log('📊 Calculando métricas para o mês:', {
      mesSelecionado: selectedMonth,
      primeiroDia: primeiroDiaMes.toISOString().split('T')[0],
      ultimoDia: ultimoDiaMes.toISOString().split('T')[0],
      totalReceitas: receitas.length
    });

    // 1️⃣ FATURAMENTO DO MÊS: Apenas receitas com Data Pgto no mês selecionado
    const receitasComDataPgtoNoMes = receitas.filter(r => {
      if (!r.date) return false;
      const dataPgto = new Date(r.date + 'T00:00:00');
      return dataPgto >= primeiroDiaMes && dataPgto <= ultimoDiaMes;
    });

    // 2️⃣ RECEBIDO: Receitas com Prev. Receb. no mês selecionado E status Received
    const recebidas = receitas.filter(r => {
      if (!r.expected_receipt_date) return false;
      const prevReceb = new Date(r.expected_receipt_date + 'T00:00:00');
      const noMesSelecionado = prevReceb >= primeiroDiaMes && prevReceb <= ultimoDiaMes;
      return noMesSelecionado && r.status === 'Received';
    });

    // 3️⃣ PENDENTE: Receitas com Prev. Receb. no mês selecionado E status Pending
    const pendentes = receitas.filter(r => {
      if (!r.expected_receipt_date) return false;
      const prevReceb = new Date(r.expected_receipt_date + 'T00:00:00');
      const noMesSelecionado = prevReceb >= primeiroDiaMes && prevReceb <= ultimoDiaMes;
      return noMesSelecionado && r.status === 'Pending';
    });
    const result = {
      // Faturamento: soma de todas as receitas com Data Pgto no mês
      total: receitasComDataPgtoNoMes.reduce((sum, r) => sum + (r.value || 0), 0),
      count: receitasComDataPgtoNoMes.length,
      // Recebido: soma das receitas com Prev. Receb. no mês E status Received
      recebido: recebidas.reduce((sum, r) => sum + (r.value || 0), 0),
      recebidoCount: recebidas.length,
      // Pendente: soma das receitas com Prev. Receb. no mês E status Pending
      pendente: pendentes.reduce((sum, r) => sum + (r.value || 0), 0),
      pendenteCount: pendentes.length
    };
    console.log('📊 Métricas calculadas:', {
      faturamento: `R$ ${result.total.toFixed(2)} (${result.count} receitas com Data Pgto no mês)`,
      recebido: `R$ ${result.recebido.toFixed(2)} (${result.recebidoCount} receitas com Prev. Receb. no mês + status Received)`,
      pendente: `R$ ${result.pendente.toFixed(2)} (${result.pendenteCount} receitas com Prev. Receb. no mês + status Pending)`
    });
    return result;
  }, [receitas, selectedMonth]);

  // 🔍 Filtrar receitas
  const filteredReceitas = React.useMemo(() => {
    // Calcular primeiro e último dia do mês selecionado
    const [year, month] = selectedMonth.split('-').map(Number);
    const primeiroDiaMes = new Date(year, month - 1, 1);
    const ultimoDiaMes = new Date(year, month, 0);
    return receitas.filter(receita => {
      // ✅ Filtro de mês: Data Pgto OU Prev. Receb. deve estar no mês selecionado
      let dentroDoMes = false;

      // Verificar Data Pgto
      if (receita.date) {
        const dataPgto = new Date(receita.date + 'T00:00:00');
        if (dataPgto >= primeiroDiaMes && dataPgto <= ultimoDiaMes) {
          dentroDoMes = true;
        }
      }

      // Verificar Prev. Receb. (se ainda não estiver dentro do mês)
      if (!dentroDoMes && receita.expected_receipt_date) {
        const prevReceb = new Date(receita.expected_receipt_date + 'T00:00:00');
        if (prevReceb >= primeiroDiaMes && prevReceb <= ultimoDiaMes) {
          dentroDoMes = true;
        }
      }

      // Se nenhuma data está no mês selecionado, excluir
      if (!dentroDoMes) {
        return false;
      }

      // Filtro de busca
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesSearch = receita.source?.toLowerCase().includes(search) || receita.value?.toString().includes(search) || receita.date?.includes(search);
        if (!matchesSearch) return false;
      }

      // Filtro de status
      if (statusFilter !== 'all' && receita.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [receitas, searchTerm, statusFilter, selectedMonth]);

  // 📥 Buscar receitas
  const fetchReceitas = useCallback(async () => {
    console.log('🔄 ReceitasAccrualTab: Iniciando busca de receitas...', {
      selectedUnitFilter,
      globalFilters,
      selectedUnit: selectedUnit?.id
    });
    setLoading(true);
    try {
      const filters = {};
      if (selectedUnitFilter) {
        filters.unit_id = selectedUnitFilter;
      } else if (globalFilters?.unit_id) {
        filters.unit_id = globalFilters.unit_id;
      } else if (selectedUnit?.id) {
        filters.unit_id = selectedUnit.id;
      }
      console.log('🔍 ReceitasAccrualTab: Filtros aplicados:', filters);
      const {
        data,
        error
      } = await financeiroService.getReceitas(filters);
      if (error) {
        console.error('❌ ReceitasAccrualTab: Erro ao buscar receitas:', error);
        showError('Erro ao carregar receitas', error.message || 'Não foi possível carregar as receitas.');
        setReceitas([]);
      } else {
        console.log('✅ ReceitasAccrualTab: Receitas carregadas:', data?.length || 0);
        console.log('📊 ReceitasAccrualTab: Primeiras 3 receitas:', data?.slice(0, 3));
        setReceitas(data || []);
      }
    } catch (err) {
      console.error('❌ ReceitasAccrualTab: Erro inesperado:', err);
      setReceitas([]);
    } finally {
      setLoading(false);
    }
  }, [selectedUnitFilter, globalFilters, selectedUnit, showError]);

  // 📥 Buscar unidades
  const fetchUnits = useCallback(async () => {
    try {
      const {
        data,
        error
      } = await unitsService.getUnits();
      if (error) {
        throw error;
      }
      setUnits(data || []);
    } catch (err) {
      console.error('❌ Erro ao buscar unidades:', err);
    }
  }, []);

  // 🗑️ Deletar receita
  const handleDelete = async id => {
    if (!confirm('Tem certeza que deseja deletar esta receita?')) return;
    setDeletingId(id);
    try {
      const {
        error
      } = await financeiroService.deleteReceita(id);
      if (error) {
        showError('Erro ao deletar', error.message || 'Não foi possível deletar a receita.');
      } else {
        showSuccess('Receita deletada', 'A receita foi removida com sucesso.');
        fetchReceitas();
      }
    } catch (err) {
      console.error('❌ Erro ao deletar:', err);
      showError('Erro inesperado', 'Ocorreu um erro ao deletar a receita.');
    } finally {
      setDeletingId(null);
    }
  };

  // 👁️ Ver detalhes da receita
  const handleViewDetails = receita => {
    setSelectedReceita(receita);
    setIsDetailsModalOpen(true);
  };

  // ✏️ Editar receita
  const handleEdit = receita => {
    setSelectedReceita(receita);
    setIsEditModalOpen(true);
  };

  // 🗑️ Confirmar exclusão
  const handleDeleteClick = receita => {
    setSelectedReceita(receita);
    setIsDeleteModalOpen(true);
  };

  // 🗑️ Confirmar e deletar
  const confirmDelete = async () => {
    if (!selectedReceita) return;
    setDeletingId(selectedReceita.id);
    try {
      const {
        error
      } = await financeiroService.deleteReceita(selectedReceita.id);
      if (error) {
        showError('Erro ao deletar', error.message || 'Não foi possível deletar a receita.');
      } else {
        showSuccess('Receita deletada', 'A receita foi removida com sucesso.');
        setIsDeleteModalOpen(false);
        setSelectedReceita(null);
        fetchReceitas();
      }
    } catch (err) {
      console.error('❌ Erro ao deletar:', err);
      showError('Erro inesperado', 'Ocorreu um erro ao deletar a receita.');
    } finally {
      setDeletingId(null);
    }
  };

  // ✅ Success handler do modal - Recebe os dados da receita e salva
  const handleSuccess = async receita => {
    try {
      setLoading(true);
      console.log('📝 ReceitasAccrualTab: Salvando receita...', receita);

      // Salvar receita no banco via service
      const result = await financeiroService.createRevenue(receita);
      if (!result.success || result.error) {
        console.error('❌ Erro ao criar receita:', result.error);
        return;
      }
      console.log('✅ Receita criada com sucesso:', result.data);

      // Fechar modal e recarregar lista
      setIsModalOpen(false);
      await fetchReceitas();
    } catch (error) {
      console.error('❌ Erro ao processar receita:', error);
    } finally {
      setLoading(false);
    }
  };

  // 🔄 Carregar dados iniciais
  useEffect(() => {
    fetchReceitas();
    fetchUnits();
  }, [fetchReceitas, fetchUnits]);

  // 💰 Formatar moeda
  const formatCurrency = value => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  // 📅 Formatar data
  const formatDate = dateStr => {
    if (!dateStr) return '-';
    try {
      return format(new Date(dateStr + 'T00:00:00'), 'dd/MM/yy');
    } catch {
      return '-';
    }
  };
  return <div className="space-y-6">
      {/* 📊 Cards de Métricas - DESIGN SYSTEM */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total - Faturamento do Mês Vigente */}
        <div className="card-theme p-5 rounded-xl border-2 border-transparent hover:border-blue-300 dark:hover:border-blue-600 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
              <DollarSign className="w-6 h-6 text-dark-text-primary" />
            </div>
            <TrendingUp className="w-8 h-8 text-blue-400 dark:text-blue-500 opacity-20" />
          </div>
          <p className="text-xs font-semibold text-theme-secondary uppercase tracking-wide mb-1">
            Faturamento do Mês
          </p>
          <p className="text-3xl font-bold text-theme-primary mb-2">
            {formatCurrency(metrics.total)}
          </p>
          <p className="text-xs text-theme-secondary">
            {metrics.count} receita{metrics.count !== 1 ? 's' : ''} • Data Pgto
            no mês
          </p>
        </div>

        {/* Recebido - Prev. Receb. até hoje */}
        <div className="card-theme p-5 rounded-xl border-2 border-transparent hover:border-green-300 dark:hover:border-green-600 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-gradient-success rounded-xl">
              <CheckCircle2 className="w-6 h-6 text-dark-text-primary" />
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-400 dark:text-green-500 opacity-20" />
          </div>
          <p className="text-xs font-semibold text-theme-secondary uppercase tracking-wide mb-1">
            Recebido
          </p>
          <p className="text-3xl font-bold text-theme-primary mb-2">
            {formatCurrency(metrics.recebido)}
          </p>
          <p className="text-xs text-theme-secondary">
            {metrics.recebidoCount} receita
            {metrics.recebidoCount !== 1 ? 's' : ''} • Confirmadas
          </p>
        </div>

        {/* Pendente - Prev. Receb. a partir de amanhã */}
        <div className="card-theme p-5 rounded-xl border-2 border-transparent hover:border-yellow-300 dark:hover:border-yellow-600 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl">
              <Clock className="w-6 h-6 text-dark-text-primary" />
            </div>
            <Clock className="w-8 h-8 text-yellow-400 dark:text-yellow-500 opacity-20" />
          </div>
          <p className="text-xs font-semibold text-theme-secondary uppercase tracking-wide mb-1">
            Pendente
          </p>
          <p className="text-3xl font-bold text-theme-primary mb-2">
            {formatCurrency(metrics.pendente)}
          </p>
          <p className="text-xs text-theme-secondary">
            {metrics.pendenteCount} receita
            {metrics.pendenteCount !== 1 ? 's' : ''} • Aguardando
          </p>
        </div>
      </div>

      {/* 📅 Seletor de Mês - DESIGN SYSTEM */}
      <div className="card-theme p-4 rounded-xl flex items-center gap-4">
        <div className="p-2.5 bg-gradient-to-br from-purple-100 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30 rounded-xl">
          <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        </div>
        <label className="text-sm font-semibold text-theme-primary">
          Período:
        </label>
        <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="px-4 py-2 text-sm font-medium border-2 border-light-border dark:border-dark-border rounded-xl card-theme dark:bg-gray-700 text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all" />
        <button onClick={() => {
        const now = new Date();
        setSelectedMonth(format(now, 'yyyy-MM'));
      }} className="px-4 py-2 text-sm font-semibold text-primary hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl transition-all">
          Mês Atual
        </button>
      </div>

      {/* 🎛️ Barra de Controles - DESIGN SYSTEM */}
      <div className="card-theme rounded-xl p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Esquerda: Busca + Filtros */}
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            {/* Busca */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-light-text-muted dark:text-dark-text-muted" />
              <input type="text" placeholder="Buscar receitas..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-11 pr-10 py-2.5 border-2 border-light-border dark:border-dark-border rounded-xl card-theme dark:bg-gray-700 text-theme-primary placeholder-gray-400 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
              {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-light-text-muted dark:text-dark-text-muted hover:text-theme-primary transition-colors">
                  <X className="w-5 h-5" />
                </button>}
            </div>

            {/* Filtro de Status */}
            <div className="flex gap-2 p-1.5 card-theme dark:bg-gray-700/50 rounded-xl">
              <button onClick={() => setStatusFilter('all')} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${statusFilter === 'all' ? 'bg-white dark:bg-gray-600 text-theme-primary shadow-md' : 'text-theme-secondary hover:text-theme-primary'}`}>
                Todas
              </button>
              <button onClick={() => setStatusFilter('Received')} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${statusFilter === 'Received' ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 shadow-md' : 'text-theme-secondary hover:text-green-600'}`}>
                Recebido
              </button>
              <button onClick={() => setStatusFilter('Pending')} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${statusFilter === 'Pending' ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 shadow-md' : 'text-theme-secondary hover:text-yellow-600'}`}>
                Pendente
              </button>
            </div>

            {/* Filtro de Unidade */}
            {units.length > 1 && <div className="relative">
                <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-light-text-muted dark:text-dark-text-muted pointer-events-none" />
                <select value={selectedUnitFilter} onChange={e => setSelectedUnitFilter(e.target.value)} className="pl-10 pr-10 py-2.5 text-sm font-medium border-2 border-light-border dark:border-dark-border rounded-xl card-theme dark:bg-gray-700 text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer transition-all">
                  <option value="">Todas unidades</option>
                  {units.map(unit => <option key={unit.id} value={unit.id}>
                      {unit.name}
                    </option>)}
                </select>
              </div>}
          </div>

          {/* Direita: Ações */}
          <div className="flex items-center gap-2">
            <button onClick={fetchReceitas} disabled={loading} className="p-2.5 text-theme-secondary hover:text-theme-primary hover:card-theme dark:hover:bg-gray-700 rounded-xl transition-all disabled:opacity-50" title="Atualizar">
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-theme-secondary border-2 border-light-border dark:border-dark-border rounded-xl hover:bg-light-bg dark:bg-dark-bg dark:hover:bg-gray-700 hover:text-theme-primary transition-all">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Exportar</span>
            </button>

            <ImportRevenuesFromStatementButton unitId={selectedUnit?.id} userId={user?.id} onSuccess={fetchReceitas} />

            <button onClick={() => setIsModalOpen(true)} className="btn-theme-primary px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg hover:shadow-xl transition-all">
              <Plus className="w-5 h-5" />
              Nova Receita
            </button>
          </div>
        </div>
      </div>

      {/* 📋 Tabela de Receitas - DESIGN SYSTEM */}
      <div className="card-theme rounded-xl overflow-hidden">
        {loading ? <div className="flex flex-col items-center justify-center py-24">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-theme-secondary font-medium">
              Carregando receitas...
            </p>
          </div> : filteredReceitas.length === 0 ? <EmptyState icon="finance" title={searchTerm || statusFilter !== 'all' ? 'Nenhuma receita encontrada' : 'Nenhuma receita cadastrada'} description={searchTerm || statusFilter !== 'all' ? 'Tente ajustar os filtros de busca.' : 'Comece criando sua primeira receita.'} actionLabel={searchTerm || statusFilter !== 'all' ? undefined : 'Criar primeira receita'} onAction={searchTerm || statusFilter !== 'all' ? undefined : () => setIsModalOpen(true)} /> : <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-light dark:from-gray-800 dark:to-gray-700 border-b-2 border-light-border dark:border-dark-border">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-theme-secondary uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-theme-secondary uppercase tracking-wider">
                    Descrição
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-theme-secondary uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-theme-secondary uppercase tracking-wider">
                    Data Pgto
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-theme-secondary uppercase tracking-wider">
                    Prev. Receb.
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-theme-secondary uppercase tracking-wider">
                    Conta
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-theme-secondary uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredReceitas.map(receita => <tr key={receita.id} className="group hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 dark:hover:from-blue-900/10 dark:hover:to-indigo-900/10 transition-all duration-200">
                    {/* Status */}
                    <td className="px-6 py-4">
                      {receita.status === 'Received' ? <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Recebido
                        </span> : <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-xs font-semibold">
                          <Clock className="w-3.5 h-3.5" />
                          Pendente
                        </span>}
                    </td>

                    {/* Descrição */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg group-hover:scale-110 transition-transform">
                          <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                        <p className="font-semibold text-theme-primary truncate max-w-xs" title={receita.source || 'Sem título'}>
                          {receita.source || 'Sem título'}
                        </p>
                      </div>
                    </td>

                    {/* Valor */}
                    <td className="px-6 py-4 text-right">
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(receita.value)}
                      </p>
                    </td>

                    {/* Data Pagamento */}
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-theme-primary">
                        {formatDate(receita.date)}
                      </p>
                    </td>

                    {/* Previsão Recebimento */}
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-theme-primary">
                        {formatDate(receita.expected_receipt_date)}
                      </p>
                    </td>

                    {/* Conta */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-theme-secondary" />
                        <p className="text-sm text-theme-secondary truncate max-w-[150px]" title={receita.bank_account?.name || '-'}>
                          {receita.bank_account?.name || '-'}
                        </p>
                      </div>
                    </td>

                    {/* Ações */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleViewDetails(receita)} className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-all" title="Ver Detalhes">
                          <Eye className="w-4 h-4" />
                        </button>
                        {isAdmin && <>
                            <button onClick={() => handleEdit(receita)} className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-all" title="Editar">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteClick(receita)} disabled={deletingId === receita.id} className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-all disabled:opacity-50" title="Deletar">
                              {deletingId === receita.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </button>
                          </>}
                      </div>
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>}
      </div>

      {/* Modal de Nova Receita */}
      <NovaReceitaAccrualModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleSuccess} />

      {/* 👁️ Modal de Detalhes da Receita */}
      {isDetailsModalOpen && selectedReceita && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card-theme rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-primary p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 card-theme/20 rounded-xl">
                    <Eye className="w-6 h-6 text-dark-text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-dark-text-primary">
                      Detalhes da Receita
                    </h2>
                    <p className="text-blue-100 text-sm mt-1">
                      Informações completas do registro
                    </p>
                  </div>
                </div>
                <button onClick={() => setIsDetailsModalOpen(false)} className="p-2 hover:card-theme/20 rounded-lg transition-colors">
                  <X className="w-6 h-6 text-dark-text-primary" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Status e Valor */}
              <div className="grid grid-cols-2 gap-4">
                <div className="card-theme p-4 rounded-xl border-2 border-green-200 dark:border-green-800">
                  <p className="text-xs font-semibold text-theme-secondary uppercase mb-2">
                    Valor
                  </p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(selectedReceita.value)}
                  </p>
                </div>
                <div className="card-theme p-4 rounded-xl">
                  <p className="text-xs font-semibold text-theme-secondary uppercase mb-2">
                    Status
                  </p>
                  {selectedReceita.status === 'Received' ? <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full font-semibold">
                      <CheckCircle2 className="w-5 h-5" />
                      Recebido
                    </span> : <span className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full font-semibold">
                      <Clock className="w-5 h-5" />
                      Pendente
                    </span>}
                </div>
              </div>

              {/* Descrição */}
              <div className="card-theme p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-5 h-5 text-theme-secondary" />
                  <p className="text-xs font-semibold text-theme-secondary uppercase">
                    Descrição
                  </p>
                </div>
                <p className="text-theme-primary font-medium">
                  {selectedReceita.source || 'Sem descrição'}
                </p>
              </div>

              {/* Datas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="card-theme p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-theme-secondary" />
                    <p className="text-xs font-semibold text-theme-secondary uppercase">
                      Data Pagamento
                    </p>
                  </div>
                  <p className="text-theme-primary font-semibold">
                    {formatDate(selectedReceita.date)}
                  </p>
                </div>
                <div className="card-theme p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-theme-secondary" />
                    <p className="text-xs font-semibold text-theme-secondary uppercase">
                      Previsão Recebimento
                    </p>
                  </div>
                  <p className="text-theme-primary font-semibold">
                    {formatDate(selectedReceita.expected_receipt_date)}
                  </p>
                </div>
              </div>

              {/* Conta Bancária */}
              {selectedReceita.bank_account && <div className="card-theme p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-5 h-5 text-theme-secondary" />
                    <p className="text-xs font-semibold text-theme-secondary uppercase">
                      Conta Bancária
                    </p>
                  </div>
                  <p className="text-theme-primary font-medium">
                    {selectedReceita.bank_account.name}
                  </p>
                </div>}

              {/* Profissional */}
              {selectedReceita.professional && <div className="card-theme p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-5 h-5 text-theme-secondary" />
                    <p className="text-xs font-semibold text-theme-secondary uppercase">
                      Profissional
                    </p>
                  </div>
                  <p className="text-theme-primary font-medium">
                    {selectedReceita.professional.name}
                  </p>
                </div>}

              {/* Forma de Pagamento */}
              {selectedReceita.payment_method && <div className="card-theme p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-5 h-5 text-theme-secondary" />
                    <p className="text-xs font-semibold text-theme-secondary uppercase">
                      Forma de Pagamento
                    </p>
                  </div>
                  <p className="text-theme-primary font-medium">
                    {selectedReceita.payment_method.name}
                  </p>
                </div>}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-light-bg dark:bg-dark-bg dark:bg-dark-surface/50 p-6 rounded-b-2xl border-t border-light-border dark:border-dark-border">
              <div className="flex items-center justify-end gap-3">
                {isAdmin && <>
                    <button onClick={() => {
                setIsDetailsModalOpen(false);
                handleEdit(selectedReceita);
              }} className="px-5 py-2.5 bg-green-600 text-dark-text-primary font-semibold rounded-xl hover:bg-green-700 transition-all flex items-center gap-2">
                      <Edit2 className="w-4 h-4" />
                      Editar
                    </button>
                    <button onClick={() => {
                setIsDetailsModalOpen(false);
                handleDeleteClick(selectedReceita);
              }} className="px-5 py-2.5 bg-red-600 text-dark-text-primary font-semibold rounded-xl hover:bg-red-700 transition-all flex items-center gap-2">
                      <Trash2 className="w-4 h-4" />
                      Deletar
                    </button>
                  </>}
                <button onClick={() => setIsDetailsModalOpen(false)} className="px-5 py-2.5 bg-gray-200 dark:bg-gray-700 text-theme-primary font-semibold rounded-xl hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-600 transition-all">
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>}

      {/* ✏️ Modal de Editar Receita */}
      {isEditModalOpen && selectedReceita && <EditarReceitaModal isOpen={isEditModalOpen} onClose={() => {
      setIsEditModalOpen(false);
      setSelectedReceita(null);
    }} onSuccess={() => {
      setIsEditModalOpen(false);
      setSelectedReceita(null);
      fetchReceitas();
    }} receita={selectedReceita} />}

      {/* 🗑️ Modal de Confirmação de Exclusão */}
      {isDeleteModalOpen && selectedReceita && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card-theme rounded-2xl max-w-md w-full shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-error p-6 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="p-3 card-theme/20 rounded-xl">
                  <Trash2 className="w-6 h-6 text-dark-text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-dark-text-primary">
                    Confirmar Exclusão
                  </h2>
                  <p className="text-red-100 text-sm mt-1">
                    Esta ação não pode ser desfeita
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                  ⚠️ Você está prestes a deletar esta receita:
                </p>
              </div>

              <div className="card-theme p-4 rounded-xl">
                <p className="text-sm text-theme-secondary mb-2">Descrição:</p>
                <p className="font-semibold text-theme-primary mb-3">
                  {selectedReceita.source || 'Sem descrição'}
                </p>

                <p className="text-sm text-theme-secondary mb-2">Valor:</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(selectedReceita.value)}
                </p>
              </div>

              <p className="text-sm text-theme-secondary text-center">
                Tem certeza que deseja continuar?
              </p>
            </div>

            {/* Footer */}
            <div className="bg-light-bg dark:bg-dark-bg dark:bg-dark-surface/50 p-6 rounded-b-2xl border-t border-light-border dark:border-dark-border">
              <div className="flex items-center justify-end gap-3">
                <button onClick={() => {
              setIsDeleteModalOpen(false);
              setSelectedReceita(null);
            }} disabled={deletingId === selectedReceita.id} className="px-5 py-2.5 bg-gray-200 dark:bg-gray-700 text-theme-primary font-semibold rounded-xl hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-600 transition-all disabled:opacity-50">
                  Cancelar
                </button>
                <button onClick={confirmDelete} disabled={deletingId === selectedReceita.id} className="px-5 py-2.5 bg-red-600 text-dark-text-primary font-semibold rounded-xl hover:bg-red-700 transition-all flex items-center gap-2 disabled:opacity-50">
                  {deletingId === selectedReceita.id ? <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deletando...
                    </> : <>
                      <Trash2 className="w-4 h-4" />
                      Confirmar Exclusão
                    </>}
                </button>
              </div>
            </div>
          </div>
        </div>}
    </div>;
};
export default ReceitasAccrualTab;