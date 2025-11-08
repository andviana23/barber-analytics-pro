/**
 * NOVA FORMA DE PAGAMENTO MODAL
 * Modal para criar/editar formas de pagamento
 *
 * Campos:
 * - Nome (ex: Cartão de Crédito, PIX, Dinheiro)
 * - Taxa (%) - Percentual descontado do valor total
 * - Prazo de Recebimento (dias) - Dias até receber o pagamento
 */

import React, { useState, useEffect } from 'react';
import { X, CreditCard, Percent, Calendar, Save, AlertCircle, Building2 } from 'lucide-react';
import { useUnit } from '../../context/UnitContext';
const NovaFormaPagamentoModal = ({
  isOpen,
  onClose,
  onSave,
  paymentMethod = null
}) => {
  const {
    allUnits,
    selectedUnit
  } = useUnit();
  const [formData, setFormData] = useState({
    name: '',
    fee_percentage: '',
    receipt_days: '',
    unit_id: ''
  });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Preencher formulário ao editar
  useEffect(() => {
    if (paymentMethod) {
      setFormData({
        name: paymentMethod.name || '',
        fee_percentage: paymentMethod.fee_percentage?.toString() || '',
        receipt_days: paymentMethod.receipt_days?.toString() || '',
        unit_id: paymentMethod.unit_id || ''
      });
    } else {
      setFormData({
        name: '',
        fee_percentage: '',
        receipt_days: '',
        unit_id: selectedUnit?.id || ''
      });
    }
    setErrors({});
  }, [paymentMethod, isOpen, selectedUnit]);

  // Validação
  const validate = () => {
    const newErrors = {};
    if (!formData.unit_id) {
      newErrors.unit_id = 'Unidade é obrigatória';
    }
    if (!formData.name?.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }
    if (formData.fee_percentage === '' || formData.fee_percentage === null) {
      newErrors.fee_percentage = 'Taxa é obrigatória';
    } else {
      const fee = parseFloat(formData.fee_percentage);
      if (isNaN(fee) || fee < 0 || fee > 100) {
        newErrors.fee_percentage = 'Taxa deve ser entre 0% e 100%';
      }
    }
    if (formData.receipt_days === '' || formData.receipt_days === null) {
      newErrors.receipt_days = 'Prazo é obrigatório';
    } else {
      const days = parseInt(formData.receipt_days);
      if (isNaN(days) || days < 0) {
        newErrors.receipt_days = 'Prazo deve ser 0 ou maior';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handlers
  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Limpar erro do campo ao digitar
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };
  const handleSubmit = async e => {
    e.preventDefault();
    if (!validate()) {
      return;
    }
    setIsSaving(true);
    try {
      const dataToSave = {
        unit_id: formData.unit_id,
        name: formData.name.trim(),
        fee_percentage: parseFloat(formData.fee_percentage),
        receipt_days: parseInt(formData.receipt_days)
      };
      await onSave(dataToSave);
      onClose();
    } catch (error) {
      setErrors({
        submit: error.message || 'Erro ao salvar forma de pagamento'
      });
    } finally {
      setIsSaving(false);
    }
  };
  if (!isOpen) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="card-theme w-full max-w-md rounded-lg shadow-xl dark:bg-dark-surface">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-light-border p-6 dark:border-dark-border">
          <h2 className="text-theme-primary dark:text-dark-text-primary text-xl font-bold">
            {paymentMethod ? 'Editar' : 'Nova'} Forma de Pagamento
          </h2>
          <button onClick={onClose} className="text-light-text-muted dark:text-dark-text-muted hover:text-theme-secondary transition-colors dark:text-theme-secondary dark:hover:text-gray-300 dark:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {/* Unidade */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 dark:text-theme-secondary">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Unidade *
              </div>
            </label>
            <select value={formData.unit_id} onChange={e => handleChange('unit_id', e.target.value)} className={`w-full rounded-lg border bg-white px-4 py-2 text-gray-900 transition-colors focus:border-transparent focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white ${errors.unit_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} `}>
              <option value="">Selecione uma unidade</option>
              {allUnits.map(unit => <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>)}
            </select>
            {errors.unit_id && <p className="mt-1 flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                {errors.unit_id}
              </p>}
          </div>

          {/* Nome */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 dark:text-theme-secondary">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Nome *
              </div>
            </label>
            <input type="text" placeholder="Ex: Cartão de Crédito, PIX, Dinheiro" value={formData.name} onChange={e => handleChange('name', e.target.value)} className={`w-full rounded-lg border bg-white px-4 py-2 text-gray-900 placeholder-gray-400 transition-colors focus:border-transparent focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white dark:placeholder-gray-500 ${errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} `} />
            {errors.name && <p className="mt-1 flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                {errors.name}
              </p>}
          </div>

          {/* Taxa */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 dark:text-theme-secondary">
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4" />
                Taxa (%) *
              </div>
            </label>
            <div className="relative">
              <input type="number" step="0.01" min="0" max="100" placeholder="Ex: 2.5" value={formData.fee_percentage} onChange={e => handleChange('fee_percentage', e.target.value)} className={`w-full rounded-lg border bg-white px-4 py-2 pr-10 text-gray-900 placeholder-gray-400 transition-colors focus:border-transparent focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white dark:placeholder-gray-500 ${errors.fee_percentage ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} `} />
              <span className="text-light-text-muted dark:text-dark-text-muted absolute right-3 top-1/2 -translate-y-1/2 transform">
                %
              </span>
            </div>
            <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mt-1 text-xs">
              Percentual que será descontado do valor total (0 a 100%)
            </p>
            {errors.fee_percentage && <p className="mt-1 flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                {errors.fee_percentage}
              </p>}
          </div>

          {/* Prazo de Recebimento */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 dark:text-theme-secondary">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Prazo de Recebimento (dias) *
              </div>
            </label>
            <input type="number" step="1" min="0" placeholder="Ex: 30" value={formData.receipt_days} onChange={e => handleChange('receipt_days', e.target.value)} className={`w-full rounded-lg border bg-white px-4 py-2 text-gray-900 placeholder-gray-400 transition-colors focus:border-transparent focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white dark:placeholder-gray-500 ${errors.receipt_days ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} `} />
            <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mt-1 text-xs">
              Dias{' '}
              <strong className="text-gray-700 dark:text-gray-300 dark:text-gray-600 dark:text-theme-secondary">
                úteis
              </strong>{' '}
              até receber (segunda a sexta, exclui feriados. 0 = recebimento
              imediato)
            </p>
            {errors.receipt_days && <p className="mt-1 flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                {errors.receipt_days}
              </p>}
          </div>

          {/* Erro geral */}
          {errors.submit && <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
              <p className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                {errors.submit}
              </p>
            </div>}

          {/* Botões */}
          <div className="flex items-center gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-light-border px-4 py-2 text-gray-700 dark:text-gray-300 dark:text-gray-600 transition-colors hover:bg-light-bg dark:border-dark-border dark:bg-dark-bg dark:text-theme-secondary dark:hover:bg-gray-700">
              Cancelar
            </button>
            <button type="submit" disabled={isSaving} className="text-dark-text-primary hover:bg-primary-600 flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50">
              {isSaving ? <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-light-surface border-t-transparent dark:border-dark-surface" />
                  Salvando...
                </> : <>
                  <Save className="h-4 w-4" />
                  Salvar
                </>}
            </button>
          </div>
        </form>
      </div>
    </div>;
};
export default NovaFormaPagamentoModal;