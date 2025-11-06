/**
 * Modal Inteligente para Nova Despesa - Sistema Financeiro Trato de Barbados
 *
 * ✨ Refatorado seguindo princípios de UX/UI avançados:
 * - "Don't Make Me Think" (Steve Krug)
 * - Atomic Design (Brad Frost)
 * - Feedback imediato e hierarquia visual clara
 * - Interface intuitiva com modo escuro/claro
 *
 * 🏗️ Estrutura Otimizada conforme especificações:
 * 1. 📋 Informações do Lançamento (dados essenciais)
 * 2. 👥 Fornecedor e Datas (período contábil)
 * 3. 💳 Condição de Pagamento (parcelas, vencimentos)
 * 4. 🔁 Configuração de Repetição (quando ativada)
 * 5. 📎 Observações e Anexos (dados complementares)
 *
 * ⚡ Recursos Avançados:
 * - Sistema de repetição inteligente com preview
 * - Validação em tempo real
 * - Integração completa com Supabase
 * - Design responsivo e acessível
 * - Estados visuais claros (loading, erro, sucesso)
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { supabase } from '../services/supabase';
import { partiesService } from '../services/partiesService';
import { useToast } from '../context/ToastContext';
import {
  X,
  Calendar,
  Calculator,
  Building2,
  FileText,
  CreditCard,
  AlertCircle,
  Repeat,
  Settings,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Upload,
  Download,
  Info,
  DollarSign,
  TrendingDown,
  CheckCircle,
  Sparkles,
  Zap,
  Shield,
  Clock,
} from 'lucide-react';
import { format, addMonths, isAfter, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PartySelector } from '../atoms/PartySelector';
import { StatusBadge } from '../atoms/StatusBadge';
const NovaDespesaModal = ({
  isOpen = false,
  onClose = () => {},
  onSave = () => {},
  initialData = null,
  isEditing = false,
  loading = false,
  unidadeId = null,
  availableCategories = [],
  availableAccounts = [],
  availableCostCenters = [],
  availableSuppliers = [],
}) => {
  // Hook de Toast
  const { addToast } = useToast();

  // Estados para dados do Supabase
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);

  // Buscar dados do Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true);

        // Buscar categorias de despesas
        let categoriesData = [];
        const { data: categoriesByUnit, error: categoriesError } =
          await supabase
            .from('categories')
            .select('id, name, description, category_type, parent_id')
            .eq('category_type', 'Expense')
            .eq('is_active', true)
            .eq('unit_id', unidadeId)
            .order('name');
        if (categoriesError) throw categoriesError;

        // Se não encontrar categorias para a unidade, buscar todas
        if (!categoriesByUnit || categoriesByUnit.length === 0) {
          console.log(
            'Não encontrou categorias para a unidade, buscando todas...'
          );
          const { data: allCategories, error: allCategoriesError } =
            await supabase
              .from('categories')
              .select('id, name, description, category_type, parent_id')
              .eq('category_type', 'Expense')
              .eq('is_active', true)
              .order('name');
          if (allCategoriesError) throw allCategoriesError;
          categoriesData = allCategories || [];
        } else {
          categoriesData = categoriesByUnit;
        }

        // Buscar contas bancárias
        const { data: accountsData, error: accountsError } = await supabase
          .from('bank_accounts')
          .select('id, name, bank_name, agency, account_number, nickname')
          .eq('is_active', true)
          .eq('unit_id', unidadeId)
          .order('name');
        if (accountsError) throw accountsError;

        // Buscar fornecedores
        const { data: suppliersData, error: suppliersError } = await supabase
          .from('parties')
          .select('id, nome, tipo, cpf_cnpj, email, telefone, razao_social')
          .eq('tipo', 'Fornecedor')
          .eq('is_active', true)
          .eq('unit_id', unidadeId)
          .order('nome');
        if (suppliersError) throw suppliersError;
        setCategories(categoriesData || []);
        setAccounts(accountsData || []);
        setSuppliers(suppliersData || []);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        addToast({
          type: 'error',
          title: 'Erro ao carregar dados',
          message: 'Não foi possível carregar as informações necessárias.',
        });
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, [unidadeId]);

  // Centros de custo baseados nas unidades
  const costCenters = useMemo(() => {
    return [
      {
        id: '1',
        nome: 'Nova Lima',
      },
      {
        id: '2',
        nome: 'Mangabeiras',
      },
      {
        id: '3',
        nome: 'Administração',
      },
    ];
  }, []);
  const [formData, setFormData] = useState({
    fornecedor_id: '',
    data_competencia: null,
    // Forçar seleção manual da data correta
    descricao: '',
    valor: '',
    categoria_id: '',
    parcelamento: 'avista',
    data_vencimento: new Date(),
    forma_pagamento: 'pix',
    conta_id: '',
    observacoes: '',
    anexos: [],
    status: 'pendente',
  });
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringConfig, setRecurringConfig] = useState({
    configuracao: 'mensal-12x',
    cobrar_sempre_no: 1,
    duracao_personalizada: '',
    previewExpanded: false,
  });
  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);

  // Opções de configuração
  const recurringOptions = [
    {
      value: 'mensal-12x',
      label: 'Mensal - 12x',
      description: '12 parcelas mensais',
      icon: Calendar,
      color: 'blue',
    },
    {
      value: 'mensal-36x',
      label: 'Mensal - 36x',
      description: '36 parcelas mensais',
      icon: Calendar,
      color: 'green',
    },
    {
      value: 'mensal-8x',
      label: 'Mensal - 8x',
      description: '8 parcelas mensais',
      icon: Calendar,
      color: 'purple',
    },
    {
      value: 'personalizar',
      label: 'Personalizar',
      description: 'Configuração avançada',
      icon: Settings,
      color: 'orange',
    },
  ];
  const dayOptions = Array.from(
    {
      length: 31,
    },
    (_, i) => ({
      value: i + 1,
      label: `${i + 1}º dia`,
    })
  );
  const paymentMethods = [
    {
      value: 'pix',
      label: 'PIX',
      icon: Zap,
      color: 'green',
    },
    {
      value: 'transferencia',
      label: 'Transferência',
      icon: Building2,
      color: 'blue',
    },
    {
      value: 'cartao',
      label: 'Cartão',
      icon: CreditCard,
      color: 'purple',
    },
    {
      value: 'dinheiro',
      label: 'Dinheiro',
      icon: DollarSign,
      color: 'yellow',
    },
  ];
  const installmentOptions = [
    {
      value: 'avista',
      label: 'À vista',
      icon: CheckCircle,
    },
    {
      value: '2x',
      label: '2x sem juros',
      icon: CreditCard,
    },
    {
      value: '3x',
      label: '3x sem juros',
      icon: CreditCard,
    },
    {
      value: '6x',
      label: '6x sem juros',
      icon: CreditCard,
    },
    {
      value: '12x',
      label: '12x sem juros',
      icon: CreditCard,
    },
    {
      value: 'personalizado',
      label: 'Personalizado',
      icon: Settings,
    },
  ];

  // Cálculo inteligente de preview das despesas recorrentes
  const recurringPreview = useMemo(() => {
    if (!isRecurring || !formData.data_vencimento) return [];
    const previews = [];
    let currentDate = new Date(formData.data_vencimento);
    let count = 0;
    const maxPreviews = 6;
    const durationConfigs = {
      'mensal-12x': {
        months: 12,
        maxParcels: 12,
      },
      'mensal-36x': {
        months: 36,
        maxParcels: 36,
      },
      'mensal-8x': {
        months: 8,
        maxParcels: 8,
      },
      personalizar: {
        months: parseInt(recurringConfig.duracao_personalizada) || 12,
        maxParcels: parseInt(recurringConfig.duracao_personalizada) || 12,
      },
    };
    const config =
      durationConfigs[recurringConfig.configuracao] ||
      durationConfigs['mensal-12x'];
    while (count < maxPreviews && count < config.maxParcels) {
      if (count > 0) {
        const targetDate = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          recurringConfig.cobrar_sempre_no
        );
        previews.push({
          date: targetDate,
          value: parseFloat(formData.valor || 0),
          title: `${formData.descricao} (${count + 1}ª parcela)`,
          parcela: count + 1,
        });
      }
      currentDate = addMonths(currentDate, 1);
      count++;
    }
    return previews;
  }, [
    isRecurring,
    formData.data_vencimento,
    formData.valor,
    formData.descricao,
    recurringConfig,
  ]);

  // Funções auxiliares
  const handleInputChange = useCallback(
    (field, value) => {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
      setIsDirty(true);
      if (errors[field]) {
        setErrors(prev => ({
          ...prev,
          [field]: null,
        }));
      }
    },
    [errors]
  );

  // ✨ Criação rápida de fornecedor (apenas nome)
  const handleQuickCreateSupplier = useCallback(
    async supplierName => {
      if (!supplierName || !supplierName.trim()) {
        addToast({
          type: 'error',
          title: 'Nome obrigatório',
          message: 'Digite o nome do fornecedor para continuar.',
        });
        return;
      }
      try {
        setLoadingData(true);
        const { data: newSupplier, error } =
          await partiesService.createQuickSupplier(unidadeId, supplierName);
        if (error) {
          addToast({
            type: 'error',
            title: 'Erro ao criar fornecedor',
            message: error,
          });
          return;
        }

        // Atualizar lista de fornecedores
        setSuppliers(prev => [...prev, newSupplier]);

        // Auto-selecionar o novo fornecedor
        setFormData(prev => ({
          ...prev,
          fornecedor_id: newSupplier.id,
        }));

        // Limpar erro de validação se existir
        if (errors.fornecedor_id) {
          setErrors(prev => ({
            ...prev,
            fornecedor_id: null,
          }));
        }
        addToast({
          type: 'success',
          title: 'Fornecedor criado',
          message: `${newSupplier.nome} foi adicionado com sucesso!`,
        });
      } catch (err) {
        addToast({
          type: 'error',
          title: 'Erro inesperado',
          message: err.message || 'Não foi possível criar o fornecedor.',
        });
      } finally {
        setLoadingData(false);
      }
    },
    [unidadeId, errors.fornecedor_id, addToast]
  );
  const validateForm = useCallback(() => {
    const newErrors = {};
    if (!formData.fornecedor_id) {
      newErrors.fornecedor_id = 'Fornecedor é obrigatório';
    }
    if (!formData.descricao.trim()) {
      newErrors.descricao = 'Descrição é obrigatória';
    }
    if (!formData.valor || parseFloat(formData.valor) <= 0) {
      newErrors.valor = 'Valor deve ser maior que zero';
    }
    if (!formData.categoria_id) {
      newErrors.categoria_id = 'Categoria é obrigatória';
    }
    if (!formData.data_vencimento) {
      newErrors.data_vencimento = 'Data de vencimento é obrigatória';
    }
    if (!formData.data_competencia) {
      newErrors.data_competencia = 'Data de competência é obrigatória';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Função para calcular total de parcelas
  const getTotalParcels = useCallback(() => {
    const durationConfigs = {
      'mensal-12x': 12,
      'mensal-36x': 36,
      'mensal-8x': 8,
      personalizar: parseInt(recurringConfig.duracao_personalizada) || 12,
    };
    return durationConfigs[recurringConfig.configuracao] || 12;
  }, [recurringConfig.configuracao, recurringConfig.duracao_personalizada]);
  const handleSave = useCallback(async () => {
    if (!validateForm()) {
      console.log('❌ Validação falhou');
      addToast({
        type: 'warning',
        title: 'Campos obrigatórios',
        message: 'Preencha todos os campos obrigatórios para continuar.',
      });
      return;
    }
    try {
      setSaving(true);

      // Preparar dados da despesa conforme schema REAL do banco
      const expenseData = {
        type: 'other',
        // Enum obrigatório: rent, salary, supplies, utilities, other
        unit_id: unidadeId,
        party_id: formData.fornecedor_id || null,
        account_id: formData.conta_id || null,
        category_id: formData.categoria_id || null,
        description: formData.descricao.trim(),
        value: parseFloat(formData.valor),
        date: formData.data_competencia,
        // Data de emissão (obrigatória)
        data_competencia: formData.data_competencia,
        // Data de competência contábil
        expected_payment_date: formData.data_vencimento,
        // Data de vencimento
        actual_payment_date:
          formData.status === 'pago' ? formData.data_vencimento : null,
        forma_pagamento: formData.forma_pagamento || null,
        parcelamento: formData.parcelamento || null,
        status: formData.status === 'pago' ? 'Paid' : 'Pending',
        is_active: true,
        observations: formData.observacoes || null,
        anexos:
          formData.anexos && formData.anexos.length > 0 ? formData.anexos : [],
      };
      console.log('💾 Salvando despesa:', expenseData);
      let expense;

      // ✅ CORREÇÃO DO BUG: Verificar se está editando ou criando
      if (isEditing && initialData?.id) {
        // 🔄 MODO EDIÇÃO: Atualizar despesa existente
        console.log('🔄 Atualizando despesa existente, ID:', initialData.id);
        const { data: updatedExpense, error: expenseError } = await supabase
          .from('expenses')
          .update(expenseData)
          .eq('id', initialData.id)
          .select()
          .single();
        if (expenseError) {
          console.error('❌ Erro ao atualizar despesa:', expenseError);
          throw expenseError;
        }
        expense = updatedExpense;
        console.log('✅ Despesa atualizada:', expense);
      } else {
        // ➕ MODO CRIAÇÃO: Inserir nova despesa
        console.log('➕ Criando nova despesa');
        const { data: newExpense, error: expenseError } = await supabase
          .from('expenses')
          .insert(expenseData)
          .select()
          .single();
        if (expenseError) {
          console.error('❌ Erro ao inserir despesa:', expenseError);
          throw expenseError;
        }
        expense = newExpense;
        console.log('✅ Despesa criada:', expense);
      }

      // Se for recorrente, criar configuração de recorrência E GERAR DESPESAS MENSAIS
      if (isRecurring && expense) {
        console.log('🔁 Criando despesas recorrentes...');

        const totalParcelas = getTotalParcels();
        const recurringData = {
          expense_id: expense.id,
          unit_id: unidadeId,
          configuracao: recurringConfig.configuracao,
          cobrar_sempre_no: recurringConfig.cobrar_sempre_no,
          duracao_personalizada: recurringConfig.duracao_personalizada,
          data_inicio: formData.data_competencia,
          total_parcelas: totalParcelas,
        };

        const { error: recurringError } = await supabase
          .from('recurring_expenses')
          .insert(recurringData);

        if (recurringError) {
          console.error(
            '❌ Erro ao criar configuração recorrente:',
            recurringError
          );
          throw recurringError;
        }

        // 🎯 CORREÇÃO DO BUG: Gerar as despesas mensais subsequentes
        console.log(`📅 Gerando ${totalParcelas - 1} despesas mensais...`);

        const monthlyExpenses = [];
        for (let i = 1; i < totalParcelas; i++) {
          const nextMonthDate = addMonths(
            new Date(formData.data_competencia),
            i
          );

          // Ajustar dia do vencimento se configurado
          let dueDate = nextMonthDate;
          if (recurringConfig.cobrar_sempre_no) {
            dueDate = new Date(nextMonthDate);
            dueDate.setDate(parseInt(recurringConfig.cobrar_sempre_no));
          }

          monthlyExpenses.push({
            type: expenseData.type,
            unit_id: unidadeId,
            party_id: expenseData.party_id,
            account_id: expenseData.account_id,
            category_id: expenseData.category_id,
            description: `${expenseData.description} (${i + 1}/${totalParcelas})`,
            value: expenseData.value,
            date: format(nextMonthDate, 'yyyy-MM-dd'),
            data_competencia: format(nextMonthDate, 'yyyy-MM-dd'),
            expected_payment_date: format(dueDate, 'yyyy-MM-dd'),
            forma_pagamento: expenseData.forma_pagamento,
            parcelamento: expenseData.parcelamento,
            status: 'Pending',
            is_active: true,
            observations: `Recorrência ${i + 1}/${totalParcelas} - Origem: ${expense.id}`,
            is_recurring: true,
            recurring_series_id: expense.id, // Vincular à despesa principal
          });
        }

        if (monthlyExpenses.length > 0) {
          const { error: monthlyError } = await supabase
            .from('expenses')
            .insert(monthlyExpenses);

          if (monthlyError) {
            console.error('❌ Erro ao criar despesas mensais:', monthlyError);
            throw monthlyError;
          }

          console.log(
            `✅ ${monthlyExpenses.length} despesas mensais criadas com sucesso!`
          );
        }
      }
      addToast({
        type: 'success',
        title: isEditing ? 'Despesa atualizada!' : 'Despesa salva!',
        message: isEditing
          ? 'As alterações foram salvas com sucesso.'
          : isRecurring
            ? 'Despesa recorrente criada com sucesso.'
            : 'Despesa única salva com sucesso.',
      });
      onSave(expense);
      onClose(); // Fechar modal após salvar
    } catch (error) {
      console.error('Erro ao salvar despesa:', error);
      addToast({
        type: 'error',
        title: 'Erro ao salvar',
        message: error.message || 'Não foi possível salvar a despesa.',
      });
    } finally {
      setSaving(false);
    }
  }, [
    formData,
    unidadeId,
    isRecurring,
    recurringConfig,
    validateForm,
    onSave,
    onClose,
    addToast,
    getTotalParcels,
    isEditing,
    initialData,
  ]);
  const handleClose = useCallback(() => {
    if (isDirty) {
      if (
        window.confirm('Existem alterações não salvas. Deseja realmente sair?')
      ) {
        onClose();
      }
    } else {
      onClose();
    }
  }, [isDirty, onClose]);

  // Inicialização
  useEffect(() => {
    if (initialData) {
      setFormData({
        fornecedor_id: initialData.fornecedor_id || initialData.party_id || '',
        data_competencia:
          initialData.data_competencia || initialData.date
            ? new Date(initialData.data_competencia || initialData.date)
            : new Date(),
        descricao: initialData.descricao || initialData.description || '',
        valor: (initialData.valor || initialData.value)?.toString() || '',
        categoria_id: initialData.categoria_id || initialData.category_id || '',
        parcelamento: initialData.parcelamento || 'avista',
        data_vencimento:
          initialData.data_vencimento || initialData.expected_payment_date
            ? new Date(
                initialData.data_vencimento || initialData.expected_payment_date
              )
            : new Date(),
        forma_pagamento: initialData.forma_pagamento || 'pix',
        conta_id: initialData.conta_id || initialData.account_id || '',
        observacoes: initialData.observacoes || initialData.observations || '',
        anexos: initialData.anexos || [],
        status: initialData.status || 'pendente',
      });
      if (initialData.recorrencia) {
        setIsRecurring(true);
        setRecurringConfig(initialData.recorrencia);
      }
    }
  }, [initialData]);

  // Não renderizar se não estiver aberto
  if (!isOpen) return null;
  if (loadingData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
        <div className="card-theme w-full max-w-md rounded-2xl p-8 shadow-2xl dark:bg-dark-surface">
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary shadow-lg">
              <Clock className="text-dark-text-primary h-6 w-6 animate-spin" />
            </div>
            <div className="text-center">
              <h3 className="text-theme-primary dark:text-dark-text-primary text-lg font-semibold">
                Carregando dados...
              </h3>
              <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mt-1 text-sm">
                Buscando categorias, contas e fornecedores
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm duration-300">
      <div className="card-theme animate-in zoom-in-95 my-8 flex max-h-[95vh] min-h-[80vh] w-full max-w-5xl flex-col rounded-2xl border border-light-border shadow-2xl duration-300 dark:border-dark-border dark:bg-dark-surface">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-light-border bg-red-50 p-4 dark:border-dark-border dark:bg-red-900/20">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-error shadow-lg">
              <Calculator className="text-dark-text-primary h-6 w-6" />
            </div>
            <div>
              <h2 className="text-theme-primary dark:text-dark-text-primary text-lg font-bold">
                {isEditing ? 'Editar Despesa' : 'Nova Despesa'}
              </h2>
              <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted flex items-center gap-2 text-xs">
                <span
                  className={`h-2 w-2 rounded-full ${isRecurring ? 'bg-orange-500' : 'bg-green-500'}`}
                ></span>
                {isRecurring ? 'Despesa com recorrência' : 'Despesa única'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted hover:card-theme group flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 hover:text-gray-700 dark:text-gray-300 dark:text-gray-600 dark:hover:bg-dark-surface dark:hover:text-gray-200"
          >
            <X className="h-5 w-5 transition-transform group-hover:scale-110" />
          </button>
        </div>

        {/* Content */}
        <div className="scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-200 dark:scrollbar-track-gray-800 max-h-[calc(95vh-200px)] flex-1 overflow-y-auto bg-light-bg dark:bg-dark-bg dark:bg-dark-surface/50">
          <div className="space-y-6 p-6">
            {/* 📋 1. Informações do Lançamento */}
            <div className="space-y-6">
              <div className="flex items-center gap-4 border-b border-light-border pb-6 dark:border-dark-border">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary shadow-lg">
                  <FileText className="text-dark-text-primary h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-theme-primary dark:text-dark-text-primary text-base font-semibold">
                    Informações do lançamento
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
                {/* Fornecedor */}
                <div className="lg:col-span-1">
                  <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
                    Fornecedor
                  </label>
                  <div className="card-theme rounded-xl border-2 border-light-border transition-all duration-200 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/20 dark:border-dark-border dark:bg-dark-surface">
                    <PartySelector
                      value={formData.fornecedor_id}
                      onChange={value =>
                        handleInputChange('fornecedor_id', value)
                      }
                      unitId={unidadeId}
                      tipo="fornecedor"
                      placeholder="Buscar ou criar fornecedor..."
                      allowCreate={true}
                      onCreateNew={handleQuickCreateSupplier}
                    />
                  </div>
                  {errors.fornecedor_id && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                      <AlertCircle className="h-4 w-4" />
                      {errors.fornecedor_id}
                    </div>
                  )}
                </div>

                {/* Data de Competência */}
                <div className="lg:col-span-1">
                  <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
                    Data de competência *
                  </label>
                  <input
                    type="date"
                    value={
                      formData.data_competencia
                        ? format(formData.data_competencia, 'yyyy-MM-dd')
                        : ''
                    }
                    onChange={e =>
                      handleInputChange(
                        'data_competencia',
                        e.target.value ? new Date(e.target.value) : null
                      )
                    }
                    className={`w-full rounded-lg border-2 bg-white px-3 py-2 text-sm text-gray-900 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:bg-gray-800 dark:text-white ${errors.data_competencia ? 'border-red-400 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                  />
                  {errors.data_competencia && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                      <AlertCircle className="h-4 w-4" />
                      {errors.data_competencia}
                    </div>
                  )}
                </div>

                {/* Descrição */}
                <div className="lg:col-span-1">
                  <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
                    Descrição *
                  </label>
                  <input
                    type="text"
                    value={formData.descricao}
                    onChange={e =>
                      handleInputChange('descricao', e.target.value)
                    }
                    placeholder="Ex: Aluguel, Material..."
                    className={`w-full rounded-lg border-2 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 ${errors.descricao ? 'border-red-400 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                  />
                  {errors.descricao && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                      <AlertCircle className="h-4 w-4" />
                      {errors.descricao}
                    </div>
                  )}
                </div>

                {/* Valor */}
                <div className="lg:col-span-1">
                  <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
                    Valor *
                  </label>
                  <div className="relative">
                    <div className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted absolute left-3 top-1/2 -translate-y-1/2 transform text-sm font-medium">
                      R$
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.valor}
                      onChange={e => handleInputChange('valor', e.target.value)}
                      placeholder="0,00"
                      className={`w-full rounded-lg border-2 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-500 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 ${errors.valor ? 'border-red-400 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                    />
                  </div>
                  {errors.valor && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                      <AlertCircle className="h-4 w-4" />
                      {errors.valor}
                    </div>
                  )}
                </div>

                {/* Categoria */}
                <div className="lg:col-span-4">
                  <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
                    Categoria *
                  </label>
                  <div className="relative">
                    <select
                      value={formData.categoria_id}
                      onChange={e =>
                        handleInputChange('categoria_id', e.target.value)
                      }
                      className={`w-full rounded-lg border-2 bg-white px-3 py-2 text-sm text-gray-900 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:bg-gray-800 dark:text-white ${errors.categoria_id ? 'border-red-400 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                    >
                      <option value="">Selecionar categoria...</option>
                      {(() => {
                        // Separar categorias pai e filhas
                        const parents = categories.filter(c => !c.parent_id);
                        const children = categories.filter(c => c.parent_id);

                        // Ordenar categorias pai
                        const sortedParents = parents.sort((a, b) =>
                          a.name.localeCompare(b.name)
                        );

                        // Criar array organizado: pai → filhas → pai → filhas...
                        const organized = [];
                        sortedParents.forEach(parent => {
                          organized.push(parent);
                          const parentChildren = children
                            .filter(c => c.parent_id === parent.id)
                            .sort((a, b) => a.name.localeCompare(b.name));
                          organized.push(...parentChildren);
                        });
                        return organized.map(category => {
                          const isParent = !category.parent_id;
                          return (
                            <option
                              key={category.id}
                              value={category.id}
                              disabled={isParent}
                              style={
                                isParent
                                  ? {
                                      fontWeight: '700',
                                      backgroundColor: '#374151',
                                      color: '#f3f4f6',
                                      fontSize: '0.75rem',
                                      letterSpacing: '0.05em',
                                      cursor: 'not-allowed',
                                      paddingTop: '0.5rem',
                                      paddingBottom: '0.5rem',
                                    }
                                  : {
                                      paddingLeft: '1.5rem',
                                      fontSize: '0.875rem',
                                    }
                              }
                            >
                              {isParent
                                ? `━━━ ${category.name.toUpperCase()} ━━━`
                                : `${category.name}`}
                            </option>
                          );
                        });
                      })()}
                    </select>
                    {errors.categoria_id && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                        <AlertCircle className="h-4 w-4" />
                        {errors.categoria_id}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Toggle de Recorrência */}
            <div className="flex items-center justify-between rounded-2xl border-2 border-purple-200 bg-purple-50 p-4 dark:border-purple-700/50 dark:bg-purple-900/10">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-purple shadow-lg">
                  <Repeat className="text-dark-text-primary h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-theme-primary dark:text-dark-text-primary text-sm font-semibold">
                    Despesa Recorrente
                  </h3>
                  <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-xs">
                    Ativar para repetir este lançamento mensalmente
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRecurring(!isRecurring)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-300 ${isRecurring ? 'bg-gradient-secondary' : 'bg-gray-300 dark:bg-gray-600'}`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${isRecurring ? 'translate-x-7' : 'translate-x-1'}`}
                />
              </button>
            </div>

            {/* 🔁 2. Configuração de Repetição - Aparece apenas quando ativada */}
            {isRecurring && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-light-border pb-6 dark:border-dark-border">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-purple shadow-lg">
                      <Repeat className="text-dark-text-primary h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-theme-primary dark:text-dark-text-primary text-base font-semibold">
                        Configurações de repetição
                      </h3>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 rounded-2xl border-2 border-purple-200 bg-purple-50 p-6 dark:border-purple-700 dark:bg-purple-900/20">
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
                        Configurações de Repetição
                      </label>
                      <select
                        value={recurringConfig.configuracao}
                        onChange={e =>
                          setRecurringConfig(prev => ({
                            ...prev,
                            configuracao: e.target.value,
                          }))
                        }
                        className="card-theme text-theme-primary dark:text-dark-text-primary w-full rounded-xl border-2 border-purple-300 px-4 py-3 transition-all duration-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 dark:border-purple-600 dark:bg-dark-surface"
                      >
                        <option value="mensal-12x">
                          Mensal - A cada 1 mês(es), 12 vez(es)
                        </option>
                        <option value="mensal-36x">
                          Mensal - A cada 1 mês(es), 36 vez(es)
                        </option>
                        <option value="mensal-8x">
                          Mensal - A cada 1 mês(es), 8 vez(es)
                        </option>
                        <option value="personalizar">Personalizar</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
                        Cobrar sempre no
                      </label>
                      <select
                        value={recurringConfig.cobrar_sempre_no}
                        onChange={e =>
                          setRecurringConfig(prev => ({
                            ...prev,
                            cobrar_sempre_no: parseInt(e.target.value),
                          }))
                        }
                        className="card-theme text-theme-primary dark:text-dark-text-primary w-full rounded-xl border-2 border-purple-300 px-4 py-3 transition-all duration-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 dark:border-purple-600 dark:bg-dark-surface"
                      >
                        {dayOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {recurringConfig.configuracao === 'personalizar' && (
                    <div>
                      <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
                        Duração (meses)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={recurringConfig.duracao_personalizada}
                        onChange={e =>
                          setRecurringConfig(prev => ({
                            ...prev,
                            duracao_personalizada: e.target.value,
                          }))
                        }
                        placeholder="Ex: 12"
                        className="card-theme text-theme-primary dark:text-dark-text-primary w-full rounded-xl border-2 border-purple-300 px-4 py-3 placeholder-gray-500 transition-all duration-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 dark:border-purple-600 dark:bg-dark-surface dark:placeholder-gray-400"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 💳 3. Condição de Pagamento */}
            <div className="space-y-6">
              <div className="flex items-center gap-4 border-b border-light-border pb-6 dark:border-dark-border">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-warning shadow-lg">
                  <CreditCard className="text-dark-text-primary h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-theme-primary dark:text-dark-text-primary text-base font-semibold">
                    Condição de pagamento
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* 1º vencimento */}
                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
                    Data de vencimento *
                  </label>
                  <input
                    type="date"
                    value={
                      formData.data_vencimento
                        ? format(formData.data_vencimento, 'yyyy-MM-dd')
                        : ''
                    }
                    onChange={e =>
                      handleInputChange(
                        'data_vencimento',
                        e.target.value ? new Date(e.target.value) : null
                      )
                    }
                    className={`w-full rounded-lg border-2 bg-white px-3 py-2 text-sm text-gray-900 transition-all duration-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:bg-gray-800 dark:text-white ${errors.data_vencimento ? 'border-red-400 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                  />
                  {errors.data_vencimento && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                      <AlertCircle className="h-4 w-4" />
                      {errors.data_vencimento}
                    </div>
                  )}
                </div>

                {/* Forma de pagamento */}
                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
                    Forma de pagamento
                  </label>
                  <select
                    value={formData.forma_pagamento}
                    onChange={e =>
                      handleInputChange('forma_pagamento', e.target.value)
                    }
                    className="card-theme text-theme-primary dark:text-dark-text-primary w-full rounded-xl border-2 border-light-border px-4 py-3 transition-all duration-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 dark:border-dark-border dark:bg-dark-surface"
                  >
                    {paymentMethods.map(method => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Conta de pagamento */}
                <div className="lg:col-span-2">
                  <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
                    Conta de pagamento
                  </label>
                  <select
                    value={formData.conta_id}
                    onChange={e =>
                      handleInputChange('conta_id', e.target.value)
                    }
                    className="card-theme text-theme-primary dark:text-dark-text-primary w-full rounded-xl border-2 border-light-border px-4 py-3 transition-all duration-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 dark:border-dark-border dark:bg-dark-surface"
                  >
                    <option value="">Selecionar conta...</option>
                    {accounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.name} - {account.bank_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 📎 4. Observações */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Observações Tab */}
                <div className="lg:col-span-2">
                  <div className="mb-4 border-b border-light-border dark:border-dark-border">
                    <div className="flex gap-4">
                      <button className="border-b-2 border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 dark:border-blue-400 dark:text-blue-400">
                        Observações
                      </button>
                      <button className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted hover:text-theme-primary dark:hover:text-dark-text-primary px-4 py-2 text-sm font-medium">
                        Anexo
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
                      Observações
                    </label>
                    <textarea
                      value={formData.observacoes}
                      onChange={e =>
                        handleInputChange('observacoes', e.target.value)
                      }
                      placeholder="Descreva observações relevantes sobre esse lançamento financeiro"
                      rows={4}
                      className="card-theme text-theme-primary dark:text-dark-text-primary w-full resize-none rounded-xl border-2 border-light-border px-4 py-3 placeholder-gray-500 transition-all duration-200 focus:border-gray-500 focus:ring-4 focus:ring-gray-500/20 dark:border-dark-border dark:border-gray-400 dark:bg-dark-surface dark:placeholder-gray-400"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between border-t border-light-border bg-light-bg p-4 dark:border-dark-border dark:bg-dark-bg dark:bg-dark-surface/50">
          <div className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted flex items-center gap-3 text-sm">
            {formData.status && (
              <>
                <Shield className="h-4 w-4" />
                <span>Status:</span>
                <StatusBadge
                  status={formData.status}
                  variant="outline"
                  size="sm"
                />
              </>
            )}
            {isDirty && (
              <>
                <Clock className="h-4 w-4" />
                <span className="text-orange-600 dark:text-orange-400">
                  Alterações não salvas
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleClose}
              className="hover:card-theme rounded-xl border-2 border-light-border px-6 py-3 font-medium text-gray-700 transition-all duration-200 dark:border-dark-border dark:text-gray-300 dark:text-gray-600 dark:hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="text-dark-text-primary flex items-center gap-3 rounded-xl bg-gradient-error px-8 py-3 font-semibold shadow-lg transition-all duration-200 hover:from-red-600 hover:to-red-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-light-surface border-t-transparent dark:border-dark-surface" />
                  Salvando...
                </>
              ) : (
                <>
                  <Calculator className="h-5 w-5" />
                  {isEditing ? 'Salvar Alterações' : 'Criar Despesa'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
NovaDespesaModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  onSave: PropTypes.func,
  initialData: PropTypes.object,
  isEditing: PropTypes.bool,
  loading: PropTypes.bool,
  unidadeId: PropTypes.string,
  availableCategories: PropTypes.arrayOf(PropTypes.object),
  availableAccounts: PropTypes.arrayOf(PropTypes.object),
  availableCostCenters: PropTypes.arrayOf(PropTypes.object),
  availableSuppliers: PropTypes.arrayOf(PropTypes.object),
};

// Preview Component
export const NovaDespesaModalPreview = () => {
  const [isOpen, setIsOpen] = React.useState(true);
  const [isEditing, setIsEditing] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  // Dados mock removidos - agora usando dados reais do Supabase

  const mockInitialData = isEditing
    ? {
        fornecedor_id: '1',
        data_competencia: new Date('2024-12-01'),
        descricao: 'Aluguel Mensal - Unidade Centro',
        valor: 2500.0,
        categoria_id: '1',
        parcelamento: 'avista',
        data_vencimento: new Date('2024-12-05'),
        forma_pagamento: 'pix',
        conta_id: '1',
        status: 'pendente',
        observacoes: 'Pagar até o dia 5',
        recorrencia: {
          configuracao: 'mensal-12x',
          cobrar_sempre_no: 5,
          duracao_personalizada: '12',
        },
      }
    : null;
  const handleSave = async data => {
    setLoading(true);
    console.log('Saving expense:', data);

    // Simular salvamento
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(false);
    setIsOpen(false);
    alert('Despesa salva com sucesso!');
  };
  return (
    <div className="card-theme min-h-screen p-6 dark:bg-dark-surface">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="card-theme rounded-xl p-6 shadow-lg dark:bg-dark-surface">
          <h2 className="text-theme-primary dark:text-dark-text-primary mb-4 text-2xl font-bold">
            Nova Despesa Modal - Preview
          </h2>
          <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mb-6">
            Modal completamente refatorado seguindo as especificações
            fornecidas. Inclui sistema inteligente de repetição, validação
            avançada e design otimizado.
          </p>

          <div className="flex gap-4">
            <button
              onClick={() => {
                setIsEditing(false);
                setIsOpen(true);
              }}
              className="text-dark-text-primary rounded-lg bg-red-600 px-4 py-2 transition-colors hover:bg-red-700"
            >
              Nova Despesa
            </button>
            <button
              onClick={() => {
                setIsEditing(true);
                setIsOpen(true);
              }}
              className="text-dark-text-primary rounded-lg bg-blue-600 px-4 py-2 transition-colors hover:bg-blue-700"
            >
              Editar Despesa
            </button>
          </div>
        </div>

        <NovaDespesaModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onSave={handleSave}
          initialData={mockInitialData}
          isEditing={isEditing}
          loading={loading}
          unidadeId="unidade-1"
        />
      </div>
    </div>
  );
};
export default NovaDespesaModal;
