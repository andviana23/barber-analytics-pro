/**
 * @fileoverview Modal de Nova Despesa - Design Final
 * @module templates/NovaDespesaModal
 * @description Modal seguindo design de referência (imagens 2 e 3)
 * @author Andrey Viana
 * @date 07/11/2025
 */

import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { X, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { format } from 'date-fns';
import {
  useCreateExpense,
  useCreateRecurringExpense,
} from '@/hooks/useExpenses';
import { PartySelector } from '@/atoms/PartySelector';
import { categoryRepository } from '@/repositories/categoryRepository';
import AttachmentUploader from '@/components/molecules/AttachmentUploader';
import AttachmentCard from '@/components/molecules/AttachmentCard';
import { useFileUpload } from '@/hooks/useFileUpload';
import { logger } from '@/utils/secureLogger';

/**
 * Modal de Nova Despesa
 */
function NovaDespesaModal({
  isOpen,
  onClose,
  unitId,
  categories = [],
  accounts = [],
}) {
  const { mutate: createExpense, isLoading: isCreating } = useCreateExpense();
  const { mutate: createRecurring, isLoading: isCreatingRecurring } =
    useCreateRecurringExpense();

  // Estados do formulário
  const [formData, setFormData] = useState({
    party_id: '',
    competence_date: format(new Date(), 'yyyy-MM-dd'),
    description: '',
    value: '',
    category_id: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    payment_method_id: 'pix',
    bank_account_id: '',
    observations: '',
    attachments: [],
  });

  // Estados das seções expansíveis
  const [expandedSections, setExpandedSections] = useState({
    info: true,
    recurring: false,
    payment: false,
  });

  // Estados de recorrência
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringConfig, setRecurringConfig] = useState({
    numero_repeticoes: 12,
    periodo: 'mensal', // mensal, semanal, anual
  });

  // Categorias de despesas
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Validação
  const [errors, setErrors] = useState({});
  const [status] = useState('pendente');

  // Estado para despesa criada (para anexos)
  const [createdExpenseId, setCreatedExpenseId] = useState(null);

  // Hook para upload de arquivos (só funciona após criar despesa)
  const {
    uploading,
    attachments,
    uploadProgress,
    uploadAttachment,
    removeAttachment,
    loadAttachments,
  } = useFileUpload(unitId, createdExpenseId, 'expense');

  // Carregar anexos quando despesa for criada
  useEffect(() => {
    if (createdExpenseId) {
      loadAttachments();
    }
  }, [createdExpenseId, loadAttachments]);

  /**
   * Buscar categorias de despesas
   */
  const loadCategories = useCallback(async () => {
    if (!unitId) return;

    setLoadingCategories(true);
    try {
      const { data, error } = await categoryRepository.findAll({
        unit_id: unitId,
        category_type: 'expense',
        is_active: true,
      });

      if (error) {
        logger.error('Erro ao carregar categorias de despesas', error);
        return;
      }

      setExpenseCategories(data || []);
    } catch (err) {
      logger.error('Erro inesperado ao carregar categorias de despesas', err);
    } finally {
      setLoadingCategories(false);
    }
  }, [unitId]);

  /**
   * Carregar categorias de despesas ao abrir modal
   */
  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen, loadCategories]);

  useEffect(() => {
    if (categories?.length) {
      setExpenseCategories(categories);
    }
  }, [categories]);

  /**
   * Toggle seção
   */
  const toggleSection = section => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  /**
   * Atualizar campo
   */
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  /**
   * Validar formulário
   */
  const validate = () => {
    const newErrors = {};

    if (!formData.competence_date) {
      newErrors.competence_date = 'Data de competência é obrigatória';
    }

    if (!formData.description?.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    }

    if (!formData.value || parseFloat(formData.value) <= 0) {
      newErrors.value = 'Valor deve ser maior que zero';
    }

    if (!formData.category_id) {
      newErrors.category_id = 'Categoria é obrigatória';
    }

    if (!formData.date) {
      newErrors.date = 'Data de vencimento é obrigatória';
    }

    if (isRecurring) {
      if (
        !recurringConfig.numero_repeticoes ||
        recurringConfig.numero_repeticoes < 1
      ) {
        newErrors.numero_repeticoes = 'Número de repetições inválido';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Enviar formulário
   */
  const handleSubmit = e => {
    e.preventDefault();

    if (!validate()) return;

    if (isRecurring) {
      const recurringData = {
        expense: {
          ...formData,
          unit_id: unitId,
          value: parseFloat(formData.value),
        },
        numero_repeticoes: recurringConfig.numero_repeticoes,
        periodo: recurringConfig.periodo,
        unit_id: unitId,
        data_inicio: formData.date,
      };

      createRecurring(recurringData, {
        onSuccess: () => {
          onClose();
          resetForm();
        },
      });
    } else {
      const expenseData = {
        ...formData,
        unit_id: unitId,
        value: parseFloat(formData.value),
        is_recurring: false,
      };

      createExpense(expenseData, {
        onSuccess: data => {
          if (data?.id) {
            setCreatedExpenseId(data.id);
            // Modal permanece aberto para permitir anexar comprovantes
          } else {
            onClose();
            resetForm();
          }
        },
      });
    }
  };

  /**
   * Resetar formulário
   */
  const resetForm = () => {
    setFormData({
      party_id: '',
      competence_date: format(new Date(), 'yyyy-MM-dd'),
      description: '',
      value: '',
      category_id: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      payment_method_id: 'pix',
      bank_account_id: '',
      observations: '',
      attachments: [],
    });
    setIsRecurring(false);
    setRecurringConfig({
      configuracao: 'mensal-12x',
      cobrar_sempre_no: 1,
      duracao_personalizada: '',
    });
    setErrors({});
    setCreatedExpenseId(null);
  };

  /**
   * Fechar modal
   */
  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  const isLoading = isCreating || isCreatingRecurring;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="card-theme relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between rounded-t-lg border-b border-light-border bg-gradient-error px-6 py-4 text-light-surface dark:border-dark-border dark:text-dark-surface">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-light-surface/20 dark:bg-dark-surface/20">
              <FileText className="h-5 w-5 text-light-surface dark:text-dark-surface" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-light-surface dark:text-dark-surface">
                Nova Despesa
              </h2>
              <p className="text-sm text-light-surface/80 dark:text-dark-surface/80">
                {isRecurring
                  ? 'Despesas com recorrência'
                  : 'Despesa com recorrência'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-light-surface transition-colors hover:bg-light-surface/10 dark:text-dark-surface dark:hover:bg-dark-surface/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {/* Seção 1: Informações do lançamento */}
            <div className="card-theme rounded-lg">
              <button
                type="button"
                onClick={() => toggleSection('info')}
                className="flex w-full items-center justify-between p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-light-surface dark:text-dark-surface">
                    <span className="text-sm font-bold">1</span>
                  </div>
                  <span className="text-theme-primary text-sm font-semibold">
                    Informações do lançamento
                  </span>
                </div>
                {expandedSections.info ? (
                  <ChevronUp className="text-theme-secondary h-5 w-5" />
                ) : (
                  <ChevronDown className="text-theme-secondary h-5 w-5" />
                )}
              </button>

              {expandedSections.info && (
                <div className="space-y-4 px-4 pb-4">
                  {/* Linha 1: Fornecedor, Data, Descrição, Valor */}
                  <div className="grid grid-cols-4 gap-4">
                    {/* Fornecedor */}
                    <div>
                      <label className="text-theme-primary mb-1.5 block text-xs font-medium">
                        Fornecedor
                      </label>
                      <PartySelector
                        value={formData.party_id}
                        onChange={value => handleChange('party_id', value)}
                        partyType="Fornecedor"
                        unitId={unitId}
                        disabled={isLoading}
                        placeholder="Buscar ou criar fornec..."
                      />
                    </div>

                    {/* Data de competência */}
                    <div>
                      <label className="text-theme-primary mb-1.5 block text-xs font-medium">
                        Data de competência{' '}
                        <span className="text-feedback-light-error dark:text-feedback-dark-error">
                          *
                        </span>
                      </label>
                      <input
                        type="date"
                        value={formData.competence_date}
                        onChange={e =>
                          handleChange('competence_date', e.target.value)
                        }
                        disabled={isLoading}
                        className={`input-theme text-sm ${errors.competence_date ? 'border-feedback-light-error dark:border-feedback-dark-error' : ''}`}
                      />
                    </div>

                    {/* Descrição */}
                    <div>
                      <label className="text-theme-primary mb-1.5 block text-xs font-medium">
                        Descrição{' '}
                        <span className="text-feedback-light-error dark:text-feedback-dark-error">
                          *
                        </span>
                      </label>
                      <input
                        type="text"
                        value={formData.description}
                        onChange={e =>
                          handleChange('description', e.target.value)
                        }
                        placeholder="Ex: Aluguel, Material..."
                        disabled={isLoading}
                        className={`input-theme text-sm ${errors.description ? 'border-feedback-light-error dark:border-feedback-dark-error' : ''}`}
                      />
                    </div>

                    {/* Valor */}
                    <div>
                      <label className="text-theme-primary mb-1.5 block text-xs font-medium">
                        Valor{' '}
                        <span className="text-feedback-light-error dark:text-feedback-dark-error">
                          *
                        </span>
                      </label>
                      <div className="relative">
                        <span className="text-theme-secondary absolute left-3 top-1/2 -translate-y-1/2 text-xs">
                          R$
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.value}
                          onChange={e => handleChange('value', e.target.value)}
                          placeholder="0,00"
                          disabled={isLoading}
                          className={`input-theme pl-10 text-sm ${errors.value ? 'border-feedback-light-error dark:border-feedback-dark-error' : ''}`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Linha 2: Categoria */}
                  <div>
                    <label className="text-theme-primary mb-1.5 block text-xs font-medium">
                      Categoria{' '}
                      <span className="text-feedback-light-error dark:text-feedback-dark-error">
                        *
                      </span>
                    </label>
                    <select
                      value={formData.category_id}
                      onChange={e =>
                        handleChange('category_id', e.target.value)
                      }
                      disabled={isLoading || loadingCategories}
                      className={`input-theme text-sm ${errors.category_id ? 'border-feedback-light-error dark:border-feedback-dark-error' : ''}`}
                    >
                      <option value="">
                        {loadingCategories
                          ? 'Carregando categorias...'
                          : 'Selecionar categoria...'}
                      </option>
                      {expenseCategories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Seção 2: Despesa Recorrente */}
            <div className="card-theme rounded-lg">
              <button
                type="button"
                onClick={() => {
                  toggleSection('recurring');
                  setIsRecurring(!isRecurring);
                }}
                className="flex w-full items-center justify-between p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-purple text-light-surface dark:text-dark-surface">
                    <span className="text-sm font-bold">2</span>
                  </div>
                  <span className="text-theme-primary text-sm font-semibold">
                    Despesa Recorrente
                  </span>
                  <span className="text-theme-secondary text-xs">
                    Ativar para repetir este lançamento mensalmente
                  </span>
                </div>
                {expandedSections.recurring ? (
                  <ChevronUp className="text-theme-secondary h-5 w-5" />
                ) : (
                  <ChevronDown className="text-theme-secondary h-5 w-5" />
                )}
              </button>

              {expandedSections.recurring && isRecurring && (
                <div className="space-y-4 px-4 pb-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Período */}
                    <div>
                      <label className="text-theme-primary mb-1.5 block text-xs font-medium">
                        Período
                      </label>
                      <select
                        value={recurringConfig.periodo}
                        onChange={e =>
                          setRecurringConfig(prev => ({
                            ...prev,
                            periodo: e.target.value,
                          }))
                        }
                        disabled={isLoading}
                        className="input-theme text-sm"
                      >
                        <option value="mensal">Mensal</option>
                        <option value="semanal">Semanal</option>
                        <option value="anual">Anual</option>
                      </select>
                      <p className="text-theme-secondary mt-1 text-xs">
                        {recurringConfig.periodo === 'mensal' &&
                          'Repetirá na mesma data de vencimento todo mês'}
                        {recurringConfig.periodo === 'semanal' &&
                          'Repetirá no mesmo dia da semana'}
                        {recurringConfig.periodo === 'anual' &&
                          'Repetirá na mesma data todo ano'}
                      </p>
                    </div>

                    {/* Número de repetições */}
                    <div>
                      <label className="text-theme-primary mb-1.5 block text-xs font-medium">
                        Número de repetições
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="360"
                        value={recurringConfig.numero_repeticoes}
                        onChange={e =>
                          setRecurringConfig(prev => ({
                            ...prev,
                            numero_repeticoes: parseInt(e.target.value) || 1,
                          }))
                        }
                        disabled={isLoading}
                        placeholder="Ex: 12"
                        className="input-theme text-sm"
                      />
                      <p className="text-theme-secondary mt-1 text-xs">
                        Quantas vezes esta despesa se repetirá
                      </p>
                    </div>
                  </div>

                  {/* Preview da recorrência */}
                  <div className="rounded-lg bg-light-bg p-3 dark:bg-dark-hover">
                    <p className="text-theme-secondary text-xs">
                      <span className="font-semibold">Resumo:</span> Esta
                      despesa será criada{' '}
                      <span className="text-theme-primary font-semibold">
                        {recurringConfig.numero_repeticoes} vez
                        {recurringConfig.numero_repeticoes > 1 ? 'es' : ''}
                      </span>
                      , repetindo{' '}
                      <span className="text-theme-primary font-semibold">
                        {recurringConfig.periodo === 'mensal' && 'mensalmente'}
                        {recurringConfig.periodo === 'semanal' &&
                          'semanalmente'}
                        {recurringConfig.periodo === 'anual' && 'anualmente'}
                      </span>{' '}
                      com base na data de vencimento (
                      {formData.date
                        ? format(
                            new Date(formData.date + 'T00:00:00'),
                            'dd/MM/yyyy'
                          )
                        : 'não definida'}
                      ).
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Seção 3: Condição de pagamento */}
            <div className="card-theme rounded-lg">
              <button
                type="button"
                onClick={() => toggleSection('payment')}
                className="flex w-full items-center justify-between p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-feedback-light-warning text-light-surface dark:bg-feedback-dark-warning dark:text-dark-surface">
                    <span className="text-sm font-bold">3</span>
                  </div>
                  <span className="text-theme-primary text-sm font-semibold">
                    Condição de pagamento
                  </span>
                </div>
                {expandedSections.payment ? (
                  <ChevronUp className="text-theme-secondary h-5 w-5" />
                ) : (
                  <ChevronDown className="text-theme-secondary h-5 w-5" />
                )}
              </button>

              {expandedSections.payment && (
                <div className="space-y-4 px-4 pb-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Data de vencimento */}
                    <div>
                      <label className="text-theme-primary mb-1.5 block text-xs font-medium">
                        Data de vencimento{' '}
                        <span className="text-feedback-light-error dark:text-feedback-dark-error">
                          *
                        </span>
                      </label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={e => handleChange('date', e.target.value)}
                        disabled={isLoading}
                        className="input-theme text-sm"
                      />
                    </div>

                    {/* Forma de pagamento */}
                    <div>
                      <label className="text-theme-primary mb-1.5 block text-xs font-medium">
                        Forma de pagamento
                      </label>
                      <select
                        value={formData.payment_method_id}
                        onChange={e =>
                          handleChange('payment_method_id', e.target.value)
                        }
                        disabled={isLoading}
                        className="input-theme text-sm"
                      >
                        <option value="pix">PIX</option>
                        <option value="transferencia">Transferência</option>
                        <option value="cartao">Cartão</option>
                        <option value="dinheiro">Dinheiro</option>
                      </select>
                    </div>
                  </div>

                  {/* Conta de pagamento */}
                  <div>
                    <label className="text-theme-primary mb-1.5 block text-xs font-medium">
                      Conta de pagamento
                    </label>
                    <select
                      value={formData.bank_account_id}
                      onChange={e =>
                        handleChange('bank_account_id', e.target.value)
                      }
                      disabled={isLoading}
                      className="input-theme text-sm"
                    >
                      <option value="">Selecionar conta...</option>
                      {accounts.map(account => (
                        <option key={account.id} value={account.id}>
                          {account.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Observações */}
            <div>
              <label className="text-theme-primary mb-1.5 block text-xs font-medium">
                Observações
              </label>
              <textarea
                value={formData.observations}
                onChange={e => handleChange('observations', e.target.value)}
                placeholder="Descreva observações relevantes sobre esse lançamento financeiro"
                rows={3}
                disabled={isLoading}
                className="input-theme resize-none text-sm"
              />
            </div>

            {/* Anexar Comprovantes */}
            <div>
              <label className="text-theme-primary mb-1.5 block text-xs font-medium">
                Anexar Comprovantes
              </label>
              {createdExpenseId ? (
                <>
                  <AttachmentUploader
                    onUpload={uploadAttachment}
                    uploading={uploading}
                    uploadProgress={uploadProgress}
                    disabled={isLoading || uploading}
                    className="mb-3"
                  />
                  {attachments.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {attachments.map(attachment => (
                        <AttachmentCard
                          key={attachment.id}
                          attachment={attachment}
                          onDelete={removeAttachment}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-lg border border-light-border bg-light-bg/50 p-4 dark:border-dark-border dark:bg-dark-hover/50">
                  <p className="text-theme-secondary text-center text-xs">
                    Os comprovantes poderão ser anexados após criar a despesa
                  </p>
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between rounded-b-lg border-t border-light-border bg-light-surface px-6 py-4 dark:border-dark-border dark:bg-dark-surface">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-theme-secondary">Status:</span>
            <span className="rounded-full bg-feedback-light-warning/10 px-2 py-0.5 text-xs font-medium text-feedback-light-warning dark:bg-feedback-dark-warning/10 dark:text-feedback-dark-warning">
              {status === 'pendente' ? '⏳ Pendente' : status}
            </span>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="text-theme-primary rounded-lg border border-light-border px-6 py-2 text-sm font-medium transition-colors hover:bg-light-bg dark:border-dark-border dark:hover:bg-dark-hover"
            >
              Cancelar
            </button>
            {createdExpenseId ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  resetForm();
                }}
                className="flex items-center gap-2 rounded-lg bg-feedback-light-success px-6 py-2 text-sm font-semibold text-light-surface transition-colors hover:bg-feedback-light-success/90 dark:bg-feedback-dark-success dark:text-dark-surface dark:hover:bg-feedback-dark-success/90"
              >
                <FileText className="h-4 w-4" />
                Concluir
              </button>
            ) : (
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex items-center gap-2 rounded-lg bg-feedback-light-error px-6 py-2 text-sm font-semibold text-light-surface transition-colors hover:bg-feedback-light-error/90 dark:bg-feedback-dark-error dark:text-dark-surface dark:hover:bg-feedback-dark-error/90"
              >
                <FileText className="h-4 w-4" />
                {isLoading ? 'Salvando...' : 'Criar Despesa'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

NovaDespesaModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  unitId: PropTypes.string.isRequired,
  categories: PropTypes.array,
  accounts: PropTypes.array,
};

export default NovaDespesaModal;
