import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import {
  DollarSign,
  Plus,
  Search,
  RefreshCw,
  Calendar,
  Loader2,
  Trash2,
  Filter,
  CheckCircle2,
  Clock,
  TrendingUp,
  X,
  Eye,
  Edit2,
  Download,
  FileText,
  User,
  CreditCard,
  Building2,
} from 'lucide-react';

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
const ReceitasAccrualTab = ({ globalFilters }) => {
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
  const { showError, showSuccess } = useToast();
  const { user } = useAuth();
  const { selectedUnit } = useUnit();

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
      totalReceitas: receitas.length,
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
      const noMesSelecionado =
        prevReceb >= primeiroDiaMes && prevReceb <= ultimoDiaMes;
      return noMesSelecionado && r.status === 'Received';
    });

    // 3️⃣ PENDENTE: Receitas com Prev. Receb. no mês selecionado E status Pending
    const pendentes = receitas.filter(r => {
      if (!r.expected_receipt_date) return false;
      const prevReceb = new Date(r.expected_receipt_date + 'T00:00:00');
      const noMesSelecionado =
        prevReceb >= primeiroDiaMes && prevReceb <= ultimoDiaMes;
      return noMesSelecionado && r.status === 'Pending';
    });
    const result = {
      // Faturamento: soma de todas as receitas com Data Pgto no mês
      total: receitasComDataPgtoNoMes.reduce(
        (sum, r) => sum + (r.value || 0),
        0
      ),
      count: receitasComDataPgtoNoMes.length,
      // Recebido: soma das receitas com Prev. Receb. no mês E status Received
      recebido: recebidas.reduce((sum, r) => sum + (r.value || 0), 0),
      recebidoCount: recebidas.length,
      // Pendente: soma das receitas com Prev. Receb. no mês E status Pending
      pendente: pendentes.reduce((sum, r) => sum + (r.value || 0), 0),
      pendenteCount: pendentes.length,
    };
    console.log('📊 Métricas calculadas:', {
      faturamento: `R$ ${result.total.toFixed(2)} (${result.count} receitas com Data Pgto no mês)`,
      recebido: `R$ ${result.recebido.toFixed(2)} (${result.recebidoCount} receitas com Prev. Receb. no mês + status Received)`,
      pendente: `R$ ${result.pendente.toFixed(2)} (${result.pendenteCount} receitas com Prev. Receb. no mês + status Pending)`,
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
        const matchesSearch =
          receita.source?.toLowerCase().includes(search) ||
          receita.value?.toString().includes(search) ||
          receita.date?.includes(search);
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
      selectedUnit: selectedUnit?.id,
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
      const { data, error } = await financeiroService.getReceitas(filters);
      if (error) {
        console.error('❌ ReceitasAccrualTab: Erro ao buscar receitas:', error);
        showError(
          'Erro ao carregar receitas',
          error.message || 'Não foi possível carregar as receitas.'
        );
        setReceitas([]);
      } else {
        console.log(
          '✅ ReceitasAccrualTab: Receitas carregadas:',
          data?.length || 0
        );
        console.log(
          '📊 ReceitasAccrualTab: Primeiras 3 receitas:',
          data?.slice(0, 3)
        );
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
      const { data, error } = await unitsService.getUnits();
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
      const { error } = await financeiroService.deleteReceita(id);
      if (error) {
        showError(
          'Erro ao deletar',
          error.message || 'Não foi possível deletar a receita.'
        );
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
      const { error } = await financeiroService.deleteReceita(
        selectedReceita.id
      );
      if (error) {
        showError(
          'Erro ao deletar',
          error.message || 'Não foi possível deletar a receita.'
        );
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
      currency: 'BRL',
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
  return (
    <div className="space-y-6">
      {/* 📊 Cards de Métricas - DESIGN SYSTEM */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Total - Faturamento do Mês Vigente */}
        <div className="card-theme rounded-xl border-2 border-transparent p-5 transition-all hover:border-blue-300 dark:hover:border-blue-600">
          <div className="mb-3 flex items-center justify-between">
            <div className="rounded-xl bg-gradient-primary p-3">
              <DollarSign className="text-dark-text-primary h-6 w-6" />
            </div>
            <TrendingUp className="h-8 w-8 text-blue-400 opacity-20 dark:text-blue-500" />
          </div>
          <p className="text-theme-secondary mb-1 text-xs font-semibold uppercase tracking-wide">
            Faturamento do Mês
          </p>
          <p className="text-theme-primary mb-2 text-3xl font-bold">
            {formatCurrency(metrics.total)}
          </p>
          <p className="text-theme-secondary text-xs">
            {metrics.count} receita{metrics.count !== 1 ? 's' : ''} • Data Pgto
            no mês
          </p>
        </div>

        {/* Recebido - Prev. Receb. até hoje */}
        <div className="card-theme rounded-xl border-2 border-transparent p-5 transition-all hover:border-green-300 dark:hover:border-green-600">
          <div className="mb-3 flex items-center justify-between">
            <div className="rounded-xl bg-gradient-success p-3">
              <CheckCircle2 className="text-dark-text-primary h-6 w-6" />
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-400 opacity-20 dark:text-green-500" />
          </div>
          <p className="text-theme-secondary mb-1 text-xs font-semibold uppercase tracking-wide">
            Recebido
          </p>
          <p className="text-theme-primary mb-2 text-3xl font-bold">
            {formatCurrency(metrics.recebido)}
          </p>
          <p className="text-theme-secondary text-xs">
            {metrics.recebidoCount} receita
            {metrics.recebidoCount !== 1 ? 's' : ''} • Confirmadas
          </p>
        </div>

        {/* Pendente - Prev. Receb. a partir de amanhã */}
        <div className="card-theme rounded-xl border-2 border-transparent p-5 transition-all hover:border-yellow-300 dark:hover:border-yellow-600">
          <div className="mb-3 flex items-center justify-between">
            <div className="rounded-xl bg-gradient-warning p-3">
              <Clock className="text-dark-text-primary h-6 w-6" />
            </div>
            <Clock className="h-8 w-8 text-yellow-400 opacity-20 dark:text-yellow-500" />
          </div>
          <p className="text-theme-secondary mb-1 text-xs font-semibold uppercase tracking-wide">
            Pendente
          </p>
          <p className="text-theme-primary mb-2 text-3xl font-bold">
            {formatCurrency(metrics.pendente)}
          </p>
          <p className="text-theme-secondary text-xs">
            {metrics.pendenteCount} receita
            {metrics.pendenteCount !== 1 ? 's' : ''} • Aguardando
          </p>
        </div>
      </div>

      {/* 📅 Seletor de Mês - DESIGN SYSTEM */}
      <div className="card-theme flex items-center gap-4 rounded-xl p-4">
        <div className="rounded-xl bg-purple-100 p-2.5 dark:bg-purple-900/30">
          <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        </div>
        <label className="text-theme-primary text-sm font-semibold">
          Período:
        </label>
        <input
          type="month"
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
          className="card-theme text-theme-primary rounded-xl border-2 border-light-border px-4 py-2 text-sm font-medium transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-dark-border dark:bg-gray-700"
        />
        <button
          onClick={() => {
            const now = new Date();
            setSelectedMonth(format(now, 'yyyy-MM'));
          }}
          className="rounded-xl px-4 py-2 text-sm font-semibold text-primary transition-all hover:bg-blue-100 dark:hover:bg-blue-900/30"
        >
          Mês Atual
        </button>
      </div>

      {/* 🎛️ Barra de Controles - DESIGN SYSTEM */}
      <div className="card-theme rounded-xl p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Esquerda: Busca + Filtros */}
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            {/* Busca */}
            <div className="relative max-w-md flex-1">
              <Search className="text-light-text-muted dark:text-dark-text-muted absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar receitas..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="card-theme text-theme-primary w-full rounded-xl border-2 border-light-border py-2.5 pl-11 pr-10 placeholder-gray-400 transition-all focus:border-primary focus:ring-2 focus:ring-primary/50 dark:border-dark-border dark:bg-gray-700"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-light-text-muted dark:text-dark-text-muted hover:text-theme-primary absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Filtro de Status */}
            <div className="card-theme flex gap-2 rounded-xl p-1.5 dark:bg-gray-700/50">
              <button
                onClick={() => setStatusFilter('all')}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${statusFilter === 'all' ? 'text-theme-primary bg-white shadow-md dark:bg-gray-600' : 'text-theme-secondary hover:text-theme-primary'}`}
              >
                Todas
              </button>
              <button
                onClick={() => setStatusFilter('Received')}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${statusFilter === 'Received' ? 'bg-green-100 text-green-700 shadow-md dark:bg-green-900/50 dark:text-green-300' : 'text-theme-secondary hover:text-green-600'}`}
              >
                Recebido
              </button>
              <button
                onClick={() => setStatusFilter('Pending')}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${statusFilter === 'Pending' ? 'bg-yellow-100 text-yellow-700 shadow-md dark:bg-yellow-900/50 dark:text-yellow-300' : 'text-theme-secondary hover:text-yellow-600'}`}
              >
                Pendente
              </button>
            </div>

            {/* Filtro de Unidade */}
            {units.length > 1 && (
              <div className="relative">
                <Filter className="text-light-text-muted dark:text-dark-text-muted pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" />
                <select
                  value={selectedUnitFilter}
                  onChange={e => setSelectedUnitFilter(e.target.value)}
                  className="card-theme text-theme-primary cursor-pointer appearance-none rounded-xl border-2 border-light-border py-2.5 pl-10 pr-10 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary dark:border-dark-border dark:bg-gray-700"
                >
                  <option value="">Todas unidades</option>
                  {units.map(unit => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Direita: Ações */}
          <div className="flex items-center gap-2">
            <button
              onClick={fetchReceitas}
              disabled={loading}
              className="text-theme-secondary hover:text-theme-primary hover:card-theme rounded-xl p-2.5 transition-all disabled:opacity-50 dark:hover:bg-gray-700"
              title="Atualizar"
            >
              <RefreshCw
                className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`}
              />
            </button>

            <button className="text-theme-secondary hover:text-theme-primary flex items-center gap-2 rounded-xl border-2 border-light-border px-4 py-2.5 text-sm font-medium transition-all hover:bg-light-bg dark:border-dark-border dark:bg-dark-bg dark:hover:bg-gray-700">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Exportar</span>
            </button>

            <ImportRevenuesFromStatementButton
              unitId={selectedUnit?.id}
              userId={user?.id}
              onSuccess={fetchReceitas}
            />

            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-theme-primary flex items-center gap-2 rounded-xl px-5 py-2.5 shadow-lg transition-all hover:shadow-xl"
            >
              <Plus className="h-5 w-5" />
              Nova Receita
            </button>
          </div>
        </div>
      </div>

      {/* 📋 Tabela de Receitas - DESIGN SYSTEM */}
      <div className="card-theme overflow-hidden rounded-xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-theme-secondary font-medium">
              Carregando receitas...
            </p>
          </div>
        ) : filteredReceitas.length === 0 ? (
          <EmptyState
            icon="finance"
            title={
              searchTerm || statusFilter !== 'all'
                ? 'Nenhuma receita encontrada'
                : 'Nenhuma receita cadastrada'
            }
            description={
              searchTerm || statusFilter !== 'all'
                ? 'Tente ajustar os filtros de busca.'
                : 'Comece criando sua primeira receita.'
            }
            actionLabel={
              searchTerm || statusFilter !== 'all'
                ? undefined
                : 'Criar primeira receita'
            }
            onAction={
              searchTerm || statusFilter !== 'all'
                ? undefined
                : () => setIsModalOpen(true)
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b-2 border-light-border bg-light-bg dark:border-dark-border dark:bg-dark-surface">
                <tr>
                  <th className="text-theme-secondary px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-theme-secondary px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                    Descrição
                  </th>
                  <th className="text-theme-secondary px-6 py-4 text-right text-xs font-bold uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="text-theme-secondary px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                    Data Pgto
                  </th>
                  <th className="text-theme-secondary px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                    Prev. Receb.
                  </th>
                  <th className="text-theme-secondary px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                    Conta
                  </th>
                  <th className="text-theme-secondary px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredReceitas.map(receita => (
                  <tr
                    key={receita.id}
                    className="group transition-all duration-200 hover:bg-light-hover dark:hover:bg-dark-hover"
                  >
                    {/* Status */}
                    <td className="px-6 py-4">
                      {receita.status === 'Received' ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-300">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Recebido
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 px-3 py-1.5 text-xs font-semibold text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                          <Clock className="h-3.5 w-3.5" />
                          Pendente
                        </span>
                      )}
                    </td>

                    {/* Descrição */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-green-50 p-2 transition-transform group-hover:scale-110 dark:bg-green-900/20">
                          <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <p
                          className="text-theme-primary max-w-xs truncate font-semibold"
                          title={receita.source || 'Sem título'}
                        >
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
                      <p className="text-theme-primary text-sm font-medium">
                        {formatDate(receita.date)}
                      </p>
                    </td>

                    {/* Previsão Recebimento */}
                    <td className="px-6 py-4">
                      <p className="text-theme-primary text-sm font-medium">
                        {formatDate(receita.expected_receipt_date)}
                      </p>
                    </td>

                    {/* Conta */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="text-theme-secondary h-4 w-4" />
                        <p
                          className="text-theme-secondary max-w-[150px] truncate text-sm"
                          title={receita.bank_account?.name || '-'}
                        >
                          {receita.bank_account?.name || '-'}
                        </p>
                      </div>
                    </td>

                    {/* Ações */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleViewDetails(receita)}
                          className="rounded-lg p-2 text-blue-600 transition-all hover:bg-blue-100 dark:hover:bg-blue-900/30"
                          title="Ver Detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleEdit(receita)}
                              className="rounded-lg p-2 text-green-600 transition-all hover:bg-green-100 dark:hover:bg-green-900/30"
                              title="Editar"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(receita)}
                              disabled={deletingId === receita.id}
                              className="rounded-lg p-2 text-red-600 transition-all hover:bg-red-100 disabled:opacity-50 dark:hover:bg-red-900/30"
                              title="Deletar"
                            >
                              {deletingId === receita.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Nova Receita */}
      <NovaReceitaAccrualModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSuccess}
      />

      {/* 👁️ Modal de Detalhes da Receita */}
      {isDetailsModalOpen && selectedReceita && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="card-theme max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 rounded-t-2xl bg-gradient-primary p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="card-theme/20 rounded-xl p-3">
                    <Eye className="text-dark-text-primary h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-dark-text-primary text-2xl font-bold">
                      Detalhes da Receita
                    </h2>
                    <p className="mt-1 text-sm text-blue-100">
                      Informações completas do registro
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="hover:card-theme/20 rounded-lg p-2 transition-colors"
                >
                  <X className="text-dark-text-primary h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-6 p-6">
              {/* Status e Valor */}
              <div className="grid grid-cols-2 gap-4">
                <div className="card-theme rounded-xl border-2 border-green-200 p-4 dark:border-green-800">
                  <p className="text-theme-secondary mb-2 text-xs font-semibold uppercase">
                    Valor
                  </p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(selectedReceita.value)}
                  </p>
                </div>
                <div className="card-theme rounded-xl p-4">
                  <p className="text-theme-secondary mb-2 text-xs font-semibold uppercase">
                    Status
                  </p>
                  {selectedReceita.status === 'Received' ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-300">
                      <CheckCircle2 className="h-5 w-5" />
                      Recebido
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-full bg-yellow-100 px-4 py-2 font-semibold text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                      <Clock className="h-5 w-5" />
                      Pendente
                    </span>
                  )}
                </div>
              </div>

              {/* Descrição */}
              <div className="card-theme rounded-xl p-4">
                <div className="mb-3 flex items-center gap-2">
                  <FileText className="text-theme-secondary h-5 w-5" />
                  <p className="text-theme-secondary text-xs font-semibold uppercase">
                    Descrição
                  </p>
                </div>
                <p className="text-theme-primary font-medium">
                  {selectedReceita.source || 'Sem descrição'}
                </p>
              </div>

              {/* Datas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="card-theme rounded-xl p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Calendar className="text-theme-secondary h-4 w-4" />
                    <p className="text-theme-secondary text-xs font-semibold uppercase">
                      Data Pagamento
                    </p>
                  </div>
                  <p className="text-theme-primary font-semibold">
                    {formatDate(selectedReceita.date)}
                  </p>
                </div>
                <div className="card-theme rounded-xl p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Calendar className="text-theme-secondary h-4 w-4" />
                    <p className="text-theme-secondary text-xs font-semibold uppercase">
                      Previsão Recebimento
                    </p>
                  </div>
                  <p className="text-theme-primary font-semibold">
                    {formatDate(selectedReceita.expected_receipt_date)}
                  </p>
                </div>
              </div>

              {/* Conta Bancária */}
              {selectedReceita.bank_account && (
                <div className="card-theme rounded-xl p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Building2 className="text-theme-secondary h-5 w-5" />
                    <p className="text-theme-secondary text-xs font-semibold uppercase">
                      Conta Bancária
                    </p>
                  </div>
                  <p className="text-theme-primary font-medium">
                    {selectedReceita.bank_account.name}
                  </p>
                </div>
              )}

              {/* Profissional */}
              {selectedReceita.professional && (
                <div className="card-theme rounded-xl p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <User className="text-theme-secondary h-5 w-5" />
                    <p className="text-theme-secondary text-xs font-semibold uppercase">
                      Profissional
                    </p>
                  </div>
                  <p className="text-theme-primary font-medium">
                    {selectedReceita.professional.name}
                  </p>
                </div>
              )}

              {/* Forma de Pagamento */}
              {selectedReceita.payment_method && (
                <div className="card-theme rounded-xl p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <CreditCard className="text-theme-secondary h-5 w-5" />
                    <p className="text-theme-secondary text-xs font-semibold uppercase">
                      Forma de Pagamento
                    </p>
                  </div>
                  <p className="text-theme-primary font-medium">
                    {selectedReceita.payment_method.name}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 rounded-b-2xl border-t border-light-border bg-light-bg p-6 dark:border-dark-border dark:bg-dark-bg dark:bg-dark-surface/50">
              <div className="flex items-center justify-end gap-3">
                {isAdmin && (
                  <>
                    <button
                      onClick={() => {
                        setIsDetailsModalOpen(false);
                        handleEdit(selectedReceita);
                      }}
                      className="text-dark-text-primary flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 font-semibold transition-all hover:bg-green-700"
                    >
                      <Edit2 className="h-4 w-4" />
                      Editar
                    </button>
                    <button
                      onClick={() => {
                        setIsDetailsModalOpen(false);
                        handleDeleteClick(selectedReceita);
                      }}
                      className="text-dark-text-primary flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 font-semibold transition-all hover:bg-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                      Deletar
                    </button>
                  </>
                )}
                <button
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="text-theme-primary rounded-xl bg-gray-200 px-5 py-2.5 font-semibold transition-all hover:bg-gray-300 dark:bg-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✏️ Modal de Editar Receita */}
      {isEditModalOpen && selectedReceita && (
        <EditarReceitaModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedReceita(null);
          }}
          onSuccess={() => {
            setIsEditModalOpen(false);
            setSelectedReceita(null);
            fetchReceitas();
          }}
          receita={selectedReceita}
        />
      )}

      {/* 🗑️ Modal de Confirmação de Exclusão */}
      {isDeleteModalOpen && selectedReceita && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="card-theme w-full max-w-md rounded-2xl shadow-2xl">
            {/* Header */}
            <div className="rounded-t-2xl bg-gradient-error p-6">
              <div className="flex items-center gap-3">
                <div className="card-theme/20 rounded-xl p-3">
                  <Trash2 className="text-dark-text-primary h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-dark-text-primary text-2xl font-bold">
                    Confirmar Exclusão
                  </h2>
                  <p className="mt-1 text-sm text-red-100">
                    Esta ação não pode ser desfeita
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-4 p-6">
              <div className="rounded-xl border-2 border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  ⚠️ Você está prestes a deletar esta receita:
                </p>
              </div>

              <div className="card-theme rounded-xl p-4">
                <p className="text-theme-secondary mb-2 text-sm">Descrição:</p>
                <p className="text-theme-primary mb-3 font-semibold">
                  {selectedReceita.source || 'Sem descrição'}
                </p>

                <p className="text-theme-secondary mb-2 text-sm">Valor:</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(selectedReceita.value)}
                </p>
              </div>

              <p className="text-theme-secondary text-center text-sm">
                Tem certeza que deseja continuar?
              </p>
            </div>

            {/* Footer */}
            <div className="rounded-b-2xl border-t border-light-border bg-light-bg p-6 dark:border-dark-border dark:bg-dark-bg dark:bg-dark-surface/50">
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedReceita(null);
                  }}
                  disabled={deletingId === selectedReceita.id}
                  className="text-theme-primary rounded-xl bg-gray-200 px-5 py-2.5 font-semibold transition-all hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deletingId === selectedReceita.id}
                  className="text-dark-text-primary flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 font-semibold transition-all hover:bg-red-700 disabled:opacity-50"
                >
                  {deletingId === selectedReceita.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Deletando...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Confirmar Exclusão
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ReceitasAccrualTab;
