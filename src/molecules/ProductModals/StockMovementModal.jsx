import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  X,
  Package,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  DollarSign,
  Calendar,
  FileText,
  Loader,
} from 'lucide-react';

const StockMovementModal = ({
  isOpen,
  onClose,
  onCreateMovement,
  product,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    movementType: 'in',
    quantity: '',
    unitCost: '',
    totalCost: '',
    reason: '',
    referenceDocument: '',
    movementDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [errors, setErrors] = useState({});

  // Opções de tipos de movimentação
  const movementTypes = [
    { value: 'in', label: 'Entrada', icon: ArrowUp, color: 'green' },
    { value: 'out', label: 'Saída', icon: ArrowDown, color: 'red' },
    { value: 'adjustment', label: 'Ajuste', icon: RotateCcw, color: 'blue' },
  ];

  // Opções de motivos
  const reasonOptions = [
    { value: 'compra', label: 'Compra' },
    { value: 'venda', label: 'Venda' },
    { value: 'ajuste', label: 'Ajuste de Inventário' },
    { value: 'perda', label: 'Perda/Avaria' },
    { value: 'transferencia', label: 'Transferência' },
    { value: 'devolucao', label: 'Devolução' },
    { value: 'outros', label: 'Outros' },
  ];

  // Resetar formulário quando abrir/fechar
  useEffect(() => {
    if (isOpen) {
      setFormData({
        movementType: 'in',
        quantity: '',
        unitCost: product?.cost_price?.toString() || '',
        totalCost: '',
        reason: '',
        referenceDocument: '',
        movementDate: new Date().toISOString().split('T')[0],
        notes: '',
      });
      setErrors({});
    }
  }, [isOpen, product]);

  // Calcular custo total automaticamente
  useEffect(() => {
    if (formData.quantity && formData.unitCost) {
      const total =
        parseFloat(formData.quantity) * parseFloat(formData.unitCost);
      setFormData(prev => ({ ...prev, totalCost: total.toFixed(2) }));
    }
  }, [formData.quantity, formData.unitCost]);

  // Validar formulário
  const validateForm = () => {
    const newErrors = {};

    if (
      !formData.quantity ||
      isNaN(formData.quantity) ||
      parseFloat(formData.quantity) <= 0
    ) {
      newErrors.quantity = 'Quantidade deve ser um número maior que zero';
    }

    if (
      formData.unitCost &&
      (isNaN(formData.unitCost) || parseFloat(formData.unitCost) < 0)
    ) {
      newErrors.unitCost = 'Custo unitário deve ser um número válido';
    }

    if (
      formData.totalCost &&
      (isNaN(formData.totalCost) || parseFloat(formData.totalCost) < 0)
    ) {
      newErrors.totalCost = 'Custo total deve ser um número válido';
    }

    if (!formData.reason) {
      newErrors.reason = 'Motivo é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const dataToSubmit = {
      productId: product.id,
      movementType: formData.movementType,
      quantity: parseInt(formData.quantity),
      unitCost: formData.unitCost ? parseFloat(formData.unitCost) : 0,
      totalCost: formData.totalCost ? parseFloat(formData.totalCost) : 0,
      reason: formData.reason,
      referenceDocument: formData.referenceDocument || null,
      movementDate: formData.movementDate,
      notes: formData.notes || null,
    };

    await onCreateMovement(dataToSubmit);
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  const getMovementIcon = type => {
    const movementType = movementTypes.find(mt => mt.value === type);
    return movementType ? movementType.icon : Package;
  };

  const getMovementColor = type => {
    const movementType = movementTypes.find(mt => mt.value === type);
    return movementType ? movementType.color : 'gray';
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Movimentação de Estoque
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {product.name}
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Informações do Produto */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Produto Selecionado
            </h3>
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {product.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Estoque atual: {product.current_stock}{' '}
                  {product.unit_of_measure}
                </p>
              </div>
            </div>
          </div>

          {/* Tipo de Movimentação */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Tipo de Movimentação <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {movementTypes.map(type => {
                const IconComponent = type.icon;
                const isSelected = formData.movementType === type.value;
                const colorClasses = {
                  green: isSelected
                    ? 'bg-green-100 border-green-500 text-green-700 dark:bg-green-900 dark:text-green-300'
                    : 'border-gray-300 dark:border-gray-600',
                  red: isSelected
                    ? 'bg-red-100 border-red-500 text-red-700 dark:bg-red-900 dark:text-red-300'
                    : 'border-gray-300 dark:border-gray-600',
                  blue: isSelected
                    ? 'bg-blue-100 border-blue-500 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'border-gray-300 dark:border-gray-600',
                };

                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() =>
                      setFormData(prev => ({
                        ...prev,
                        movementType: type.value,
                      }))
                    }
                    className={`p-3 border rounded-lg transition-colors flex flex-col items-center gap-2 ${colorClasses[type.color]}`}
                  >
                    <IconComponent className="w-5 h-5" />
                    <span className="text-sm font-medium">{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantidade e Custos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Quantidade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quantidade <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                placeholder="0"
                min="1"
                className={`w-full px-3 py-2 border ${
                  errors.quantity
                    ? 'border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
              />
              {errors.quantity && (
                <p className="mt-1 text-sm text-red-500">{errors.quantity}</p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {product.unit_of_measure}
              </p>
            </div>

            {/* Custo Unitário */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Custo Unitário
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  R$
                </span>
                <input
                  type="number"
                  name="unitCost"
                  value={formData.unitCost}
                  onChange={handleChange}
                  placeholder="0,00"
                  step="0.01"
                  min="0"
                  className={`w-full pl-8 pr-3 py-2 border ${
                    errors.unitCost
                      ? 'border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                />
              </div>
              {errors.unitCost && (
                <p className="mt-1 text-sm text-red-500">{errors.unitCost}</p>
              )}
            </div>

            {/* Custo Total */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Custo Total
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  R$
                </span>
                <input
                  type="number"
                  name="totalCost"
                  value={formData.totalCost}
                  onChange={handleChange}
                  placeholder="0,00"
                  step="0.01"
                  min="0"
                  className={`w-full pl-8 pr-3 py-2 border ${
                    errors.totalCost
                      ? 'border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                />
              </div>
              {errors.totalCost && (
                <p className="mt-1 text-sm text-red-500">{errors.totalCost}</p>
              )}
            </div>
          </div>

          {/* Motivo e Documento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Motivo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Motivo <span className="text-red-500">*</span>
              </label>
              <select
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${
                  errors.reason
                    ? 'border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
              >
                <option value="">Selecione o motivo</option>
                {reasonOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.reason && (
                <p className="mt-1 text-sm text-red-500">{errors.reason}</p>
              )}
            </div>

            {/* Documento de Referência */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Documento de Referência
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="referenceDocument"
                  value={formData.referenceDocument}
                  onChange={handleChange}
                  placeholder="Ex: NF 123456, Pedido 789"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Data e Observações */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Data da Movimentação */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data da Movimentação
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  name="movementDate"
                  value={formData.movementDate}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Observações */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Observações
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Observações adicionais"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Preview do Estoque */}
          {formData.quantity && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                Previsão de Estoque
              </h4>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Estoque atual: {product.current_stock}{' '}
                  {product.unit_of_measure}
                </span>
                <span className="text-gray-400">→</span>
                <span className="font-medium text-blue-700 dark:text-blue-300">
                  {formData.movementType === 'in'
                    ? product.current_stock + parseInt(formData.quantity || 0)
                    : formData.movementType === 'out'
                      ? Math.max(
                          0,
                          product.current_stock -
                            parseInt(formData.quantity || 0)
                        )
                      : parseInt(formData.quantity || 0)}{' '}
                  {product.unit_of_measure}
                </span>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                'Registrar Movimentação'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

StockMovementModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onCreateMovement: PropTypes.func.isRequired,
  product: PropTypes.object,
  loading: PropTypes.bool,
};

export default StockMovementModal;

