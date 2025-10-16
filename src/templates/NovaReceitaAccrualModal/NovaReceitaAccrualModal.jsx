/**
 * NovaReceitaAccrualModal.jsx
 * 
 * Modal para criar receitas com regime de competência
 * Integra DateRangePicker, PartySelector e validação completa
 * 
 * Autor: Sistema Barber Analytics Pro
 * Data: 2024
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  X,
  Save,
  Calendar,
  DollarSign,
  FileText,
  Building2,
  AlertCircle,
  CreditCard
} from 'lucide-react';
import { Input } from '../../atoms/Input/Input';
import unitsService from '../../services/unitsService';
import { getPaymentMethods } from '../../services/paymentMethodsService';
import { addCalendarDaysWithBusinessDayAdjustment } from '../../utils/businessDays';
import { logger } from '../../utils/secureLogger';

const NovaReceitaAccrualModal = ({ isOpen = false, onClose, onSubmit }) => {
  // Estados do formulário simplificado
  const [formData, setFormData] = useState({
    titulo: '',
    valor: '',
    data_pagamento: new Date().toISOString().split('T')[0],
    unit_id: '',
    payment_method_id: ''
  });

  const [units, setUnits] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [calculatedReceiptDate, setCalculatedReceiptDate] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Carregar unidades ao montar
  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const data = await unitsService.getUnits();
        if (data && Array.isArray(data)) {
          setUnits(data);
        }
      } catch {
        setUnits([]);
      }
    };
    
    if (isOpen) {
      fetchUnits();
    }
  }, [isOpen]);

  // Carregar formas de pagamento quando unidade mudar
  useEffect(() => {
    const fetchPaymentMethodsData = async () => {
      if (!formData.unit_id) {
        setPaymentMethods([]);
        setSelectedPaymentMethod(null);
        return;
      }

      const { data, error } = await getPaymentMethods(formData.unit_id);
      if (!error && data) {
        const activeMethods = data.filter(method => method.is_active);
        setPaymentMethods(activeMethods);
      }
    };
    fetchPaymentMethodsData();
  }, [formData.unit_id]);

  // Calcular data de recebimento quando forma de pagamento ou data de pagamento mudar
  // NOVA LÓGICA: dias CORRIDOS com ajuste automático para próximo dia útil
  useEffect(() => {
    if (formData.payment_method_id && formData.data_pagamento) {
      const method = paymentMethods.find(m => m.id === formData.payment_method_id);
      if (method) {
        setSelectedPaymentMethod(method);
        // Usa dias CORRIDOS (não úteis) e ajusta para próximo dia útil se necessário
        const receiptDate = addCalendarDaysWithBusinessDayAdjustment(
          new Date(formData.data_pagamento + 'T00:00:00'), 
          method.receipt_days
        );
        setCalculatedReceiptDate(receiptDate.toISOString().split('T')[0]);
      }
    } else {
      setSelectedPaymentMethod(null);
      setCalculatedReceiptDate(null);
    }
  }, [formData.payment_method_id, formData.data_pagamento, paymentMethods]);

  // Manipular mudança de campos
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Se mudar unidade, limpar forma de pagamento
    if (field === 'unit_id') {
      setFormData(prev => ({ ...prev, payment_method_id: '' }));
    }

    // Limpar erro do campo
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Validação do formulário
  const validateForm = () => {
    const newErrors = {};

    if (!formData.titulo?.trim()) {
      newErrors.titulo = 'Título é obrigatório';
    }

    if (!formData.valor || parseFloat(formData.valor) <= 0) {
      newErrors.valor = 'Valor deve ser maior que zero';
    }

    if (!formData.data_pagamento) {
      newErrors.data_pagamento = 'Data de pagamento é obrigatória';
    }

    if (!formData.unit_id) {
      newErrors.unit_id = 'Unidade é obrigatória';
    }

    if (!formData.payment_method_id) {
      newErrors.payment_method_id = 'Forma de pagamento é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submeter formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const valorNumerico = parseFloat(formData.valor);
      
      // �️ CORREÇÃO BUG-002: Log sanitizado
      logger.financial('FormData recebido no modal', formData);
      logger.debug('Campos do formData', Object.keys(formData));
      
      const receita = {
        // Campos obrigatórios
        type: 'service', // income_type ENUM: service, product, subscription, other
        value: valorNumerico,
        date: formData.data_pagamento,
        
        // Valores financeiros (padrão do mercado: dias corridos + ajuste dia útil)
        gross_amount: valorNumerico,
        net_amount: valorNumerico,
        fees: 0,
        
        // Datas de competência (padrão mercado financeiro)
        accrual_start_date: formData.data_pagamento,
        accrual_end_date: formData.data_pagamento,
        expected_receipt_date: calculatedReceiptDate, // Dias corridos + ajuste dia útil
        
        // Informações adicionais
        source: formData.titulo,
        observations: `Forma de pagamento: ${selectedPaymentMethod?.name || 'N/A'}`,
        
        // Relacionamentos
        unit_id: formData.unit_id,
        
        // Status inicial (ENUM em inglês: Pending, Partial, Received, Paid, Cancelled, Overdue)
        status: 'Pending'
      };

      // �️ CORREÇÃO BUG-002: Log sanitizado de dados financeiros
      logger.financial('Objeto receita criado', receita);
      logger.debug('Campos da receita', Object.keys(receita));

      await onSubmit(receita);
    } catch (error) {
      setErrors({ submit: error.message || 'Erro ao salvar receita. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  // Formatar valor como moeda
  const formatCurrencyInput = (value) => {
    // Remove tudo exceto números
    const numbers = value.replace(/\D/g, '');
    
    // Converte para número com duas casas decimais
    const amount = parseFloat(numbers) / 100;
    
    // Retorna formatado
    return amount.toFixed(2);
  };

  // Manipular mudança no valor com formatação
  const handleValorChange = (e) => {
    const rawValue = e.target.value;
    const formatted = formatCurrencyInput(rawValue);
    handleInputChange('valor', formatted);
  };

  // Não renderizar se modal não estiver aberto
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl my-8 mx-auto flex flex-col max-h-[calc(100vh-8rem)]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Nova Receita - Regime de Competência
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-0">
            {/* Erro geral */}
            {errors.submit && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
                  <span className="text-sm text-red-800 dark:text-red-300">{errors.submit}</span>
                </div>
              </div>
            )}

            {/* Campo: Título */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FileText className="h-4 w-4 inline mr-2" />
                Título *
              </label>
              <Input
                type="text"
                placeholder="Ex: Serviço de corte de cabelo"
                value={formData.titulo}
                onChange={(e) => handleInputChange('titulo', e.target.value)}
                className={errors.titulo ? 'border-red-500 dark:border-red-500' : ''}
              />
              {errors.titulo && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.titulo}</p>
              )}
            </div>

            {/* Campo: Valor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <DollarSign className="h-4 w-4 inline mr-2" />
                Valor *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">
                  R$
                </span>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="0,00"
                  value={formData.valor}
                  onChange={handleValorChange}
                  className={`pl-10 ${errors.valor ? 'border-red-500 dark:border-red-500' : ''}`}
                />
              </div>
              {errors.valor && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.valor}</p>
              )}
            </div>

            {/* Campo: Data de Pagamento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="h-4 w-4 inline mr-2" />
                Data de Pagamento *
              </label>
              <Input
                type="date"
                value={formData.data_pagamento}
                onChange={(e) => handleInputChange('data_pagamento', e.target.value)}
                className={errors.data_pagamento ? 'border-red-500 dark:border-red-500' : ''}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Esta data será usada como data de competência no sistema
              </p>
              {errors.data_pagamento && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.data_pagamento}</p>
              )}
            </div>

            {/* Campo: Unidade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Building2 className="h-4 w-4 inline mr-2" />
                Unidade *
              </label>
              <select
                value={formData.unit_id}
                onChange={(e) => handleInputChange('unit_id', e.target.value)}
                className={`w-full px-3 py-2.5 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors ${
                  errors.unit_id ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <option value="">Selecione uma unidade</option>
                {units.map(unit => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name}
                  </option>
                ))}
              </select>
              {errors.unit_id && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.unit_id}</p>
              )}
            </div>

            {/* Campo: Forma de Pagamento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <CreditCard className="h-4 w-4 inline mr-2" />
                Forma de Pagamento *
              </label>
              <select
                value={formData.payment_method_id}
                onChange={(e) => handleInputChange('payment_method_id', e.target.value)}
                disabled={!formData.unit_id}
                className={`w-full px-3 py-2.5 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  errors.payment_method_id ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <option value="">
                  {formData.unit_id ? 'Selecione uma forma de pagamento' : 'Selecione uma unidade primeiro'}
                </option>
                {paymentMethods.map(method => (
                  <option key={method.id} value={method.id}>
                    {method.name} - {method.receipt_days === 0 ? 'Recebimento imediato' : `${method.receipt_days} ${method.receipt_days === 1 ? 'dia corrido' : 'dias corridos'}`}
                  </option>
                ))}
              </select>
              {errors.payment_method_id && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.payment_method_id}</p>
              )}
              {paymentMethods.length === 0 && formData.unit_id && (
                <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
                  ⚠️ Nenhuma forma de pagamento cadastrada para esta unidade.
                </p>
              )}
            </div>

            {/* Info: Data de Recebimento Calculada */}
            {selectedPaymentMethod && calculatedReceiptDate && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Data de Recebimento Calculada
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      {new Date(calculatedReceiptDate + 'T00:00:00').toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      {selectedPaymentMethod.receipt_days === 0 
                        ? 'Recebimento no mesmo dia (imediato)'
                        : `Recebimento em ${selectedPaymentMethod.receipt_days} ${selectedPaymentMethod.receipt_days === 1 ? 'dia corrido' : 'dias corridos'} após a data de pagamento`
                      }
                      {selectedPaymentMethod.receipt_days > 0 && (
                        <span className="block mt-1">
                          ✓ Se cair em final de semana ou feriado, será ajustado para o próximo dia útil
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Receita
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

NovaReceitaAccrualModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired
};

export { NovaReceitaAccrualModal };
export default NovaReceitaAccrualModal;