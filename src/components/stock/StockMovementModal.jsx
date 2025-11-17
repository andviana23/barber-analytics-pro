/**
 * @file StockMovementModal.jsx
 * @description Modal para criar entrada/saída de estoque
 * @module Components/Stock
 * @author Andrey Viana
 * @date 13/11/2025
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  X,
  Package,
  ArrowUpCircle,
  ArrowDownCircle,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../../atoms/Button/Button';
import { useProducts } from '../../hooks/useProducts';
import { formatCurrency } from '../../utils/formatters';

/**
 * Modal para registrar movimentação de estoque
 * Design System compliant com validação
 */
const StockMovementModal = ({
  isOpen = false,
  onClose,
  onSubmit,
  isSubmitting = false,
  movementType = 'ENTRADA', // 'ENTRADA' ou 'SAIDA'
  initialProduct = null,
}) => {
  // Estados do formulário
  const [formData, setFormData] = useState({
    productId: initialProduct?.id || '',
    quantity: '',
    reason: '',
    unitCost: '',
    notes: '',
  });

  const [errors, setErrors] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(initialProduct);
  const [searchTerm, setSearchTerm] = useState(initialProduct?.name || '');
  const [showProductList, setShowProductList] = useState(false);

  // Hook para buscar produtos
  const { products, isLoading: loadingProducts } = useProducts({
    filters: { search: searchTerm },
    includeInactive: false,
  });

  // Reset form quando modal abre/fecha
  useEffect(() => {
    if (isOpen) {
      if (initialProduct) {
        setFormData(prev => ({ ...prev, productId: initialProduct.id }));
        setSelectedProduct(initialProduct);
        setSearchTerm(initialProduct.name);
      }
    } else {
      // Reset form ao fechar
      setFormData({
        productId: '',
        quantity: '',
        reason: '',
        unitCost: '',
        notes: '',
      });
      setSelectedProduct(null);
      setSearchTerm('');
      setErrors({});
    }
  }, [isOpen, initialProduct]);

  // Motivos disponíveis por tipo
  const reasons = {
    ENTRADA: [
      { value: 'COMPRA', label: 'Compra' },
      { value: 'DEVOLUCAO', label: 'Devolução de Cliente' },
      { value: 'AJUSTE', label: 'Ajuste de Estoque' },
    ],
    SAIDA: [
      { value: 'VENDA', label: 'Venda' },
      { value: 'SERVICO', label: 'Uso em Serviço' },
      { value: 'PERDA', label: 'Perda/Avaria' },
      { value: 'AJUSTE', label: 'Ajuste de Estoque' },
    ],
  };

  // Validar formulário
  const validateForm = () => {
    const newErrors = {};

    if (!formData.productId) {
      newErrors.productId = 'Selecione um produto';
    }
    if (!formData.quantity || formData.quantity <= 0) {
      newErrors.quantity = 'Quantidade deve ser maior que zero';
    }
    if (!formData.reason) {
      newErrors.reason = 'Selecione um motivo';
    }
    if (
      movementType === 'ENTRADA' &&
      (!formData.unitCost || formData.unitCost < 0)
    ) {
      newErrors.unitCost = 'Custo unitário é obrigatório para entradas';
    }

    // Validar estoque suficiente para saídas
    if (movementType === 'SAIDA' && selectedProduct) {
      const availableStock = selectedProduct.current_stock || 0;
      if (formData.quantity > availableStock) {
        newErrors.quantity = `Estoque insuficiente (disponível: ${availableStock})`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Selecionar produto da lista
  const handleSelectProduct = product => {
    setSelectedProduct(product);
    setFormData(prev => ({
      ...prev,
      productId: product.id,
      unitCost: product.unit_cost || '',
    }));
    setSearchTerm(product.name);
    setShowProductList(false);
    setErrors(prev => ({ ...prev, productId: null }));
  };

  // Submit do formulário
  const handleSubmit = e => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSubmit({
      productId: formData.productId,
      quantity: parseFloat(formData.quantity),
      reason: formData.reason,
      unitCost:
        movementType === 'ENTRADA'
          ? parseFloat(formData.unitCost)
          : selectedProduct?.unit_cost || 0,
      notes: formData.notes || null,
    });
  };

  // Calcular preview do impacto
  const calculateImpact = () => {
    if (!selectedProduct || !formData.quantity) return null;

    const currentStock = selectedProduct.current_stock || 0;
    const quantity = parseFloat(formData.quantity);
    const newStock =
      movementType === 'ENTRADA'
        ? currentStock + quantity
        : currentStock - quantity;

    const unitCost =
      movementType === 'ENTRADA'
        ? parseFloat(formData.unitCost) || 0
        : selectedProduct.unit_cost || 0;

    const totalCost = quantity * unitCost;

    return {
      currentStock,
      newStock,
      totalCost,
      isValid: newStock >= 0,
    };
  };

  const impact = calculateImpact();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div className="card-theme relative max-h-[90vh] w-full max-w-2xl overflow-y-auto">
        {/* Header */}
        <div className="border-theme-border sticky top-0 z-10 flex items-center justify-between border-b bg-inherit p-6">
          <div className="flex items-center gap-3">
            {movementType === 'ENTRADA' ? (
              <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/30">
                <ArrowUpCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            ) : (
              <div className="rounded-lg bg-red-100 p-2 dark:bg-red-900/30">
                <ArrowDownCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            )}
            <div>
              <h2 className="text-theme-primary text-xl font-bold">
                {movementType === 'ENTRADA'
                  ? 'Registrar Entrada'
                  : 'Registrar Saída'}
              </h2>
              <p className="text-theme-muted text-sm">
                {movementType === 'ENTRADA'
                  ? 'Adicionar produtos ao estoque'
                  : 'Remover produtos do estoque'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-theme-muted rounded-lg p-2 transition-colors hover:bg-light-bg dark:hover:bg-dark-surface"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* Produto (Autocomplete) */}
          <div>
            <label className="text-theme-primary mb-2 block text-sm font-medium">
              Produto *
            </label>
            <div className="relative">
              <Package className="text-theme-muted absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar produto..."
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setShowProductList(true);
                }}
                onFocus={() => setShowProductList(true)}
                className={`input-theme w-full pl-10 ${errors.productId ? 'border-red-500' : ''}`}
              />
              {/* Lista de produtos */}
              {showProductList && searchTerm && products.length > 0 && (
                <div className="border-theme-border absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border bg-light-surface shadow-lg dark:bg-dark-surface">
                  {loadingProducts ? (
                    <div className="text-theme-muted p-4 text-center text-sm">
                      Buscando produtos...
                    </div>
                  ) : (
                    products.slice(0, 10).map(product => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => handleSelectProduct(product)}
                        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-light-bg dark:hover:bg-dark-hover"
                      >
                        <div>
                          <p className="text-theme-primary font-medium">
                            {product.name}
                          </p>
                          <p className="text-theme-muted text-xs">
                            Estoque: {product.current_stock || 0}{' '}
                            {product.unit_measurement}
                          </p>
                        </div>
                        <span className="text-theme-secondary text-sm">
                          {formatCurrency(product.unit_cost || 0)}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            {errors.productId && (
              <p className="mt-1 text-sm text-red-500">{errors.productId}</p>
            )}
            {selectedProduct && (
              <div className="mt-2 rounded-lg bg-light-bg p-3 dark:bg-dark-surface">
                <p className="text-theme-secondary text-sm">
                  <strong>Estoque atual:</strong>{' '}
                  {selectedProduct.current_stock || 0}{' '}
                  {selectedProduct.unit_measurement}
                </p>
              </div>
            )}
          </div>

          {/* Quantidade e Custo Unitário */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Quantidade */}
            <div>
              <label className="text-theme-primary mb-2 block text-sm font-medium">
                Quantidade *
              </label>
              <input
                type="number"
                min="1"
                step="1"
                placeholder="0"
                value={formData.quantity}
                onChange={e =>
                  setFormData(prev => ({ ...prev, quantity: e.target.value }))
                }
                className={`input-theme w-full ${errors.quantity ? 'border-red-500' : ''}`}
              />
              {errors.quantity && (
                <p className="mt-1 text-sm text-red-500">{errors.quantity}</p>
              )}
            </div>

            {/* Custo Unitário (apenas para ENTRADA) */}
            {movementType === 'ENTRADA' && (
              <div>
                <label className="text-theme-primary mb-2 block text-sm font-medium">
                  Custo Unitário *
                </label>
                <div className="relative">
                  <DollarSign className="text-theme-muted absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2" />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0,00"
                    value={formData.unitCost}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        unitCost: e.target.value,
                      }))
                    }
                    className={`input-theme w-full pl-10 ${errors.unitCost ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.unitCost && (
                  <p className="mt-1 text-sm text-red-500">{errors.unitCost}</p>
                )}
              </div>
            )}
          </div>

          {/* Motivo */}
          <div>
            <label className="text-theme-primary mb-2 block text-sm font-medium">
              Motivo *
            </label>
            <select
              value={formData.reason}
              onChange={e =>
                setFormData(prev => ({ ...prev, reason: e.target.value }))
              }
              className={`input-theme w-full ${errors.reason ? 'border-red-500' : ''}`}
            >
              <option value="">Selecione um motivo</option>
              {reasons[movementType].map(reason => (
                <option key={reason.value} value={reason.value}>
                  {reason.label}
                </option>
              ))}
            </select>
            {errors.reason && (
              <p className="mt-1 text-sm text-red-500">{errors.reason}</p>
            )}
          </div>

          {/* Observações */}
          <div>
            <label className="text-theme-primary mb-2 block text-sm font-medium">
              Observações
            </label>
            <textarea
              rows="3"
              placeholder="Informações adicionais (opcional)"
              value={formData.notes}
              onChange={e =>
                setFormData(prev => ({ ...prev, notes: e.target.value }))
              }
              className="input-theme w-full resize-none"
            />
          </div>

          {/* Preview do Impacto */}
          {impact && selectedProduct && (
            <div
              className={`rounded-lg border p-4 ${
                impact.isValid
                  ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
                  : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
              }`}
            >
              <div className="flex items-start gap-3">
                <AlertCircle
                  className={`h-5 w-5 flex-shrink-0 ${
                    impact.isValid ? 'text-blue-600' : 'text-red-600'
                  }`}
                />
                <div className="flex-1 space-y-2">
                  <h3 className="text-theme-primary font-semibold">
                    Preview do Impacto
                  </h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-theme-muted">Estoque Atual</p>
                      <p className="text-theme-primary font-semibold">
                        {impact.currentStock}
                      </p>
                    </div>
                    <div>
                      <p className="text-theme-muted">Novo Estoque</p>
                      <p
                        className={`font-semibold ${
                          impact.isValid ? 'text-theme-primary' : 'text-red-600'
                        }`}
                      >
                        {impact.newStock}
                      </p>
                    </div>
                    <div>
                      <p className="text-theme-muted">Valor Total</p>
                      <p className="text-theme-primary font-semibold">
                        {formatCurrency(impact.totalCost)}
                      </p>
                    </div>
                  </div>
                  {!impact.isValid && (
                    <p className="text-sm text-red-600">
                      ⚠️ Estoque insuficiente para esta operação
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || (impact && !impact.isValid)}
              isLoading={isSubmitting}
              className="flex-1"
            >
              {movementType === 'ENTRADA'
                ? 'Registrar Entrada'
                : 'Registrar Saída'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

StockMovementModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool,
  movementType: PropTypes.oneOf(['ENTRADA', 'SAIDA']),
  initialProduct: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    current_stock: PropTypes.number,
    unit_cost: PropTypes.number,
    unit_measurement: PropTypes.string,
  }),
};

export default StockMovementModal;
