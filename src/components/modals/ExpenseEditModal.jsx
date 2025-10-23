import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Calendar,
  DollarSign,
  Tag,
  Users,
  FileText,
  CreditCard,
  CheckCircle2,
  Banknote,
  Clock,
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useToast } from '../../context/ToastContext';
import { format } from 'date-fns';

/**
 * 🎨 Modal de Edição de Despesa - 100% Refatorado
 *
 * Design System Compliant:
 * - Tokens de cor do Design System
 * - Classes temáticas (.card-theme, .text-theme-*)
 * - Grid system responsivo
 * - Tipografia consistente
 * - Acessibilidade (ARIA, foco visível)
 * - UX melhorada com visual hierárquico
 * - Seleção hierárquica de categorias (Pai → Filho)
 * - Detecção inteligente de categoria "Comissão"
 */
const ExpenseEditModal = ({ expense, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    description: '',
    value: '',
    date: '',
    expected_payment_date: '',
    category_id: '',
    party_id: '',
    account_id: '',
    observations: '',
    forma_pagamento: '',
    data_competencia: '',
    status: 'pending',
    actual_payment_date: null,
  });

  // Categorias hierárquicas
  const [parentCategories, setParentCategories] = useState([]);
  const [childCategories, setChildCategories] = useState([]);
  const [selectedParentId, setSelectedParentId] = useState('');
  const [selectedCategoryName, setSelectedCategoryName] = useState('');

  const [parties, setParties] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  // Detectar se categoria selecionada é "Comissão"
  const isComissaoCategory =
    selectedCategoryName?.toLowerCase().includes('comissão') ||
    selectedCategoryName?.toLowerCase().includes('comissao');

  // Carregar dados relacionados
  useEffect(() => {
    if (isOpen && expense) {
      loadRelatedData();
      populateForm();
    }
  }, [isOpen, expense]);

  const loadRelatedData = async () => {
    try {
      // Carregar apenas categorias PAI (sem parent_id)
      const { data: parentCategoriesData } = await supabase
        .from('categories')
        .select('id, name')
        .eq('unit_id', expense.unit_id)
        .eq('category_type', 'Expense')
        .eq('is_active', true)
        .is('parent_id', null)
        .order('name');

      setParentCategories(parentCategoriesData || []);

      // Carregar parties
      const { data: partiesData } = await supabase
        .from('parties')
        .select('id, nome')
        .eq('unit_id', expense.unit_id)
        .eq('is_active', true)
        .order('nome');

      // Carregar profissionais (barbeiros)
      const { data: professionalsData } = await supabase
        .from('professionals')
        .select('id, name, party_id')
        .eq('unit_id', expense.unit_id)
        .eq('is_active', true)
        .order('name');

      // Carregar contas bancárias
      const { data: accountsData } = await supabase
        .from('bank_accounts')
        .select('id, name, bank_name')
        .eq('unit_id', expense.unit_id)
        .eq('is_active', true)
        .order('name');

      setParties(partiesData || []);
      setProfessionals(professionalsData || []);
      setBankAccounts(accountsData || []);

      // Se a despesa já tem categoria, carregar a hierarquia
      if (expense.category_id) {
        await loadCategoryHierarchy(expense.category_id);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar dados relacionados:', error);
    }
  };

  // Carregar hierarquia de categoria existente
  const loadCategoryHierarchy = async categoryId => {
    try {
      const { data: categoryData } = await supabase
        .from('categories')
        .select('id, name, parent_id')
        .eq('id', categoryId)
        .single();

      if (categoryData) {
        // Atualizar nome da categoria para detecção de comissão
        setSelectedCategoryName(categoryData.name);

        if (categoryData.parent_id) {
          // É uma categoria filha
          setSelectedParentId(categoryData.parent_id);
          await loadChildCategories(categoryData.parent_id);
        } else {
          // É uma categoria pai
          setSelectedParentId(categoryId);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao carregar hierarquia:', error);
    }
  };

  // Carregar categorias filhas quando selecionar uma categoria pai
  const loadChildCategories = async parentId => {
    try {
      const { data: childCategoriesData } = await supabase
        .from('categories')
        .select('id, name')
        .eq('unit_id', expense.unit_id)
        .eq('category_type', 'Expense')
        .eq('is_active', true)
        .eq('parent_id', parentId)
        .order('name');

      setChildCategories(childCategoriesData || []);
    } catch (error) {
      console.error('❌ Erro ao carregar subcategorias:', error);
    }
  };

  // Handler para mudança de categoria pai
  const handleParentCategoryChange = async parentId => {
    setSelectedParentId(parentId);
    setFormData(prev => ({ ...prev, category_id: '', party_id: '' })); // Reset categoria filha e party
    setSelectedCategoryName('');

    if (parentId) {
      await loadChildCategories(parentId);

      // Atualizar nome da categoria pai se não houver filhas
      const parentCategory = parentCategories.find(c => c.id === parentId);
      if (parentCategory) {
        setSelectedCategoryName(parentCategory.name);
      }
    } else {
      setChildCategories([]);
    }
  };

  // Handler para mudança de categoria filha
  const handleChildCategoryChange = categoryId => {
    setFormData(prev => ({ ...prev, category_id: categoryId, party_id: '' })); // Reset party ao trocar categoria

    // Atualizar nome da categoria selecionada
    const childCategory = childCategories.find(c => c.id === categoryId);
    if (childCategory) {
      setSelectedCategoryName(childCategory.name);
    }
  };

  const populateForm = () => {
    if (expense) {
      setFormData({
        description: expense.description || '',
        value: expense.value?.toString() || '',
        date: expense.date || '',
        expected_payment_date: expense.expected_payment_date || '',
        category_id: expense.category_id || '',
        party_id: expense.party_id || '',
        account_id: expense.account_id || '',
        observations: expense.observations || '',
        forma_pagamento: expense.forma_pagamento || '',
        data_competencia: expense.data_competencia || '',
        status: expense.status || 'pending',
        actual_payment_date: expense.actual_payment_date || null,
      });
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (!formData.description || !formData.value) {
      showToast({
        type: 'error',
        message: 'Preencha os campos obrigatórios',
        description: 'Descrição e valor são obrigatórios',
      });
      return;
    }

    try {
      setLoading(true);

      // Se não selecionou categoria filha, usa a categoria pai
      const finalCategoryId = formData.category_id || selectedParentId || null;

      const updateData = {
        description: formData.description,
        value: parseFloat(formData.value),
        date: formData.date,
        expected_payment_date: formData.expected_payment_date,
        category_id: finalCategoryId,
        party_id: formData.party_id || null,
        account_id: formData.account_id || null,
        observations: formData.observations,
        forma_pagamento: formData.forma_pagamento,
        data_competencia: formData.data_competencia,
        status: formData.status,
        actual_payment_date: formData.actual_payment_date,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('expenses')
        .update(updateData)
        .eq('id', expense.id);

      if (error) throw error;

      showToast({
        type: 'success',
        message: 'Despesa atualizada com sucesso!',
        description:
          formData.status === 'paid' ? 'Status alterado para Pago' : '',
      });

      onSave();
      onClose();
    } catch (error) {
      console.error('❌ Erro ao atualizar despesa:', error);
      showToast({
        type: 'error',
        message: 'Erro ao atualizar despesa',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !expense) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="expense-edit-title"
    >
      <div
        className="card-theme w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* 🎯 Header com visual destacado */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent dark:from-primary/20 dark:via-primary/10 px-6 py-5 border-b border-light-border dark:border-dark-border">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2
                id="expense-edit-title"
                className="text-xl font-semibold text-theme-primary mb-1"
              >
                Editar Despesa
              </h2>
              <p className="text-sm text-theme-secondary">
                Atualize as informações da despesa
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 p-2 rounded-lg hover:bg-light-surface dark:hover:bg-dark-surface transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
              aria-label="Fechar modal"
            >
              <X className="w-5 h-5 text-theme-secondary" />
            </button>
          </div>
        </div>

        {/* 📊 Formulário scrollável */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-6"
        >
          {/* 📝 Seção: Informações Básicas */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-theme-primary uppercase tracking-wide mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Informações Básicas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Descrição"
                required
                icon={FileText}
                className="md:col-span-2"
              >
                <input
                  type="text"
                  value={formData.description}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="input-theme"
                  placeholder="Digite a descrição da despesa"
                  required
                />
              </FormField>

              <FormField label="Valor" required icon={DollarSign}>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-secondary">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.value}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, value: e.target.value }))
                    }
                    className="input-theme pl-10"
                    placeholder="0,00"
                    required
                  />
                </div>
              </FormField>

              <FormField label="Data de Emissão" icon={Calendar}>
                <input
                  type="date"
                  value={formData.date}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, date: e.target.value }))
                  }
                  className="input-theme"
                />
              </FormField>

              <FormField label="Data de Vencimento" icon={Calendar}>
                <input
                  type="date"
                  value={formData.expected_payment_date}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      expected_payment_date: e.target.value,
                    }))
                  }
                  className="input-theme"
                />
              </FormField>
            </div>
          </div>

          {/* ✅ Seção: Status de Pagamento */}
          <div className="mb-8">
            <div className="p-4 bg-gradient-to-br from-primary/5 to-transparent dark:from-primary/10 rounded-xl border border-primary/20 dark:border-primary/30">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="flex items-center h-6">
                  <input
                    type="checkbox"
                    checked={formData.status?.toLowerCase() === 'paid'}
                    onChange={e => {
                      const isPaid = e.target.checked;
                      setFormData(prev => ({
                        ...prev,
                        status: isPaid ? 'Paid' : 'Pending',
                        actual_payment_date: isPaid
                          ? format(new Date(), 'yyyy-MM-dd')
                          : null,
                      }));
                    }}
                    className="w-5 h-5 text-primary bg-white dark:bg-dark-surface border-2 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 dark:focus:ring-offset-dark-bg cursor-pointer transition-all"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    <span className="text-sm font-semibold text-theme-primary">
                      Marcar como Paga
                    </span>
                  </div>
                  <p className="text-xs text-theme-secondary mt-1">
                    {formData.status?.toLowerCase() === 'paid'
                      ? '✓ Despesa marcada como paga - data de pagamento registrada'
                      : 'Marque para alterar o status para pago e registrar a data de pagamento'}
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* 🏷️ Seção: Categorização */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-theme-primary uppercase tracking-wide mb-4 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Categorização
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Categoria Pai" icon={Tag}>
                <select
                  value={selectedParentId}
                  onChange={e => handleParentCategoryChange(e.target.value)}
                  className="input-theme"
                >
                  <option value="">Selecione a categoria pai</option>
                  {parentCategories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Categoria Filho (Subcategoria)" icon={Tag}>
                <select
                  value={formData.category_id}
                  onChange={e => handleChildCategoryChange(e.target.value)}
                  disabled={!selectedParentId || childCategories.length === 0}
                  className="input-theme disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Selecione a subcategoria</option>
                  {childCategories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-theme-secondary mt-1.5">
                  Opcional. Se não selecionar, será usada a categoria pai.
                </p>
              </FormField>

              <FormField
                label={
                  isComissaoCategory
                    ? 'Profissional (Barbeiro)'
                    : 'Pessoa/Fornecedor'
                }
                icon={Users}
              >
                <select
                  value={formData.party_id}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, party_id: e.target.value }))
                  }
                  className="input-theme"
                >
                  <option value="">
                    {isComissaoCategory
                      ? 'Selecione um barbeiro'
                      : 'Selecione uma pessoa'}
                  </option>
                  {isComissaoCategory
                    ? professionals.map(professional => (
                        <option
                          key={professional.party_id}
                          value={professional.party_id}
                        >
                          {professional.name}
                        </option>
                      ))
                    : parties.map(party => (
                        <option key={party.id} value={party.id}>
                          {party.nome}
                        </option>
                      ))}
                </select>
                {isComissaoCategory && (
                  <p className="text-xs text-primary mt-1.5 flex items-center gap-1">
                    <span>💈</span>
                    Mostrando apenas profissionais barbeiros
                  </p>
                )}
              </FormField>

              <FormField label="Conta Bancária" icon={Banknote}>
                <select
                  value={formData.account_id}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      account_id: e.target.value,
                    }))
                  }
                  className="input-theme"
                >
                  <option value="">Selecione a conta bancária</option>
                  {bankAccounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({account.bank_name})
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
          </div>

          {/* 📋 Seção: Informações Adicionais */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-theme-primary uppercase tracking-wide mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Informações Adicionais
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Forma de Pagamento" icon={CreditCard}>
                <select
                  value={formData.forma_pagamento}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      forma_pagamento: e.target.value,
                    }))
                  }
                  className="input-theme"
                >
                  <option value="">Selecione a forma</option>
                  <option value="PIX">PIX</option>
                  <option value="Cartão">Cartão</option>
                  <option value="Transferência">Transferência</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Boleto">Boleto</option>
                </select>
              </FormField>

              <FormField label="Data de Competência" icon={Clock}>
                <input
                  type="date"
                  value={formData.data_competencia}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      data_competencia: e.target.value,
                    }))
                  }
                  className="input-theme"
                  placeholder="dd/mm/aaaa"
                />
              </FormField>
            </div>
          </div>

          {/* 📝 Seção: Observações */}
          <div>
            <FormField label="Observações" icon={FileText}>
              <textarea
                value={formData.observations}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    observations: e.target.value,
                  }))
                }
                rows={4}
                className="input-theme resize-none"
                placeholder="Adicione observações ou detalhes adicionais sobre esta despesa..."
              />
            </FormField>
          </div>
        </form>

        {/* 🎯 Footer com ações */}
        <div className="px-6 py-4 border-t border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg">
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-lg font-medium transition-all duration-200 bg-light-surface dark:bg-dark-surface text-theme-primary hover:bg-light-border dark:hover:bg-dark-border focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 dark:focus:ring-offset-dark-bg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              onClick={handleSubmit}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all duration-200 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white shadow-lg shadow-green-500/30 hover:shadow-green-500/50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-dark-bg disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Salvar Alterações
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 🎨 Componente auxiliar: FormField
 * Campo de formulário reutilizável com label e ícone
 */
const FormField = ({
  label,
  required,
  icon: Icon,
  children,
  className = '',
}) => {
  return (
    <div className={className}>
      <label className="block mb-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-theme-primary uppercase tracking-wide mb-2">
          {Icon && <Icon className="w-3.5 h-3.5" />}
          {label}
          {required && <span className="text-red-500">*</span>}
        </div>
        {children}
      </label>
    </div>
  );
};

export default ExpenseEditModal;
