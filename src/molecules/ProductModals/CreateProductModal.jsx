import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  X,
  Package,
  DollarSign,
  Hash,
  Tag,
  Building,
  MapPin,
  Loader,
  AlertTriangle,
} from 'lucide-react';
const CreateProductModal = ({ isOpen, onClose, onCreate, loading = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    category: '',
    brand: '',
    costPrice: '',
    sellingPrice: '',
    currentStock: '',
    minStock: '',
    maxStock: '',
    unitOfMeasure: 'unidade',
    supplierId: '',
    barcode: '',
    location: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});

  // Opções de unidades de medida
  const unitOptions = [
    {
      value: 'unidade',
      label: 'Unidade',
    },
    {
      value: 'litro',
      label: 'Litro',
    },
    {
      value: 'ml',
      label: 'Mililitro (ml)',
    },
    {
      value: 'grama',
      label: 'Grama',
    },
    {
      value: 'kg',
      label: 'Quilograma (kg)',
    },
    {
      value: 'caixa',
      label: 'Caixa',
    },
    {
      value: 'pacote',
      label: 'Pacote',
    },
  ];

  // Validar formulário
  const validateForm = () => {
    const newErrors = {};

    // Nome é obrigatório
    if (!formData.name || formData.name.trim().length < 3) {
      newErrors.name = 'Nome deve ter pelo menos 3 caracteres';
    }

    // Preços devem ser números válidos
    if (
      formData.costPrice &&
      (isNaN(formData.costPrice) || parseFloat(formData.costPrice) < 0)
    ) {
      newErrors.costPrice = 'Preço de custo deve ser um número válido';
    }
    if (
      formData.sellingPrice &&
      (isNaN(formData.sellingPrice) || parseFloat(formData.sellingPrice) < 0)
    ) {
      newErrors.sellingPrice = 'Preço de venda deve ser um número válido';
    }

    // Estoque deve ser números inteiros válidos
    if (
      formData.currentStock &&
      (isNaN(formData.currentStock) || parseInt(formData.currentStock) < 0)
    ) {
      newErrors.currentStock = 'Estoque atual deve ser um número válido';
    }
    if (
      formData.minStock &&
      (isNaN(formData.minStock) || parseInt(formData.minStock) < 0)
    ) {
      newErrors.minStock = 'Estoque mínimo deve ser um número válido';
    }
    if (
      formData.maxStock &&
      (isNaN(formData.maxStock) || parseInt(formData.maxStock) < 0)
    ) {
      newErrors.maxStock = 'Estoque máximo deve ser um número válido';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handler para mudanças no formulário
  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Limpar erro do campo ao digitar
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  // Submit do formulário
  const handleSubmit = async e => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    // Converter valores numéricos
    const dataToSubmit = {
      ...formData,
      costPrice: formData.costPrice ? parseFloat(formData.costPrice) : 0,
      sellingPrice: formData.sellingPrice
        ? parseFloat(formData.sellingPrice)
        : 0,
      currentStock: formData.currentStock ? parseInt(formData.currentStock) : 0,
      minStock: formData.minStock ? parseInt(formData.minStock) : 0,
      maxStock: formData.maxStock ? parseInt(formData.maxStock) : 0,
      supplierId: formData.supplierId || null,
    };
    await onCreate(dataToSubmit);
  };

  // Resetar formulário ao fechar
  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      sku: '',
      category: '',
      brand: '',
      costPrice: '',
      sellingPrice: '',
      currentStock: '',
      minStock: '',
      maxStock: '',
      unitOfMeasure: 'unidade',
      supplierId: '',
      barcode: '',
      location: '',
      notes: '',
    });
    setErrors({});
    onClose();
  };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="card-theme dark:bg-dark-surface rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-light-border dark:border-dark-border">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-theme-primary dark:text-dark-text-primary">
                Novo Produto
              </h2>
              <p className="text-sm text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
                Cadastrar novo produto no estoque
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="flex items-center justify-center w-8 h-8 text-light-text-muted dark:text-dark-text-muted hover:text-theme-secondary dark:hover:text-gray-300 dark:text-gray-600 rounded-lg hover:card-theme dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-theme-primary dark:text-dark-text-primary flex items-center gap-2">
              <Package className="w-5 h-5" />
              Informações Básicas
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nome - OBRIGATÓRIO */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">
                  Nome do Produto <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-light-text-muted dark:text-dark-text-muted" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Digite o nome do produto"
                    className={`w-full pl-10 pr-3 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              {/* SKU */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">
                  Código (SKU)
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-light-text-muted dark:text-dark-text-muted" />
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    placeholder="Ex: SHM001"
                    className="w-full pl-10 pr-3 py-2 border border-light-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 card-theme dark:bg-gray-700 text-theme-primary dark:text-dark-text-primary"
                  />
                </div>
              </div>

              {/* Código de Barras */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">
                  Código de Barras
                </label>
                <input
                  type="text"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleChange}
                  placeholder="7891234567890"
                  className="w-full px-3 py-2 border border-light-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 card-theme dark:bg-gray-700 text-theme-primary dark:text-dark-text-primary"
                />
              </div>

              {/* Categoria */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">
                  Categoria
                </label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-light-text-muted dark:text-dark-text-muted" />
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    placeholder="Ex: Shampoo, Condicionador"
                    className="w-full pl-10 pr-3 py-2 border border-light-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 card-theme dark:bg-gray-700 text-theme-primary dark:text-dark-text-primary"
                  />
                </div>
              </div>

              {/* Marca */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">
                  Marca
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-light-text-muted dark:text-dark-text-muted" />
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    placeholder="Ex: L'Oréal, Schwarzkopf"
                    className="w-full pl-10 pr-3 py-2 border border-light-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 card-theme dark:bg-gray-700 text-theme-primary dark:text-dark-text-primary"
                  />
                </div>
              </div>

              {/* Descrição */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">
                  Descrição
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Descrição detalhada do produto"
                  rows={3}
                  className="w-full px-3 py-2 border border-light-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 card-theme dark:bg-gray-700 text-theme-primary dark:text-dark-text-primary"
                />
              </div>
            </div>
          </div>

          {/* Preços e Estoque */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-theme-primary dark:text-dark-text-primary flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Preços e Estoque
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Preço de Custo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">
                  Preço de Custo
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-theme-secondary">
                    R$
                  </span>
                  <input
                    type="number"
                    name="costPrice"
                    value={formData.costPrice}
                    onChange={handleChange}
                    placeholder="0,00"
                    step="0.01"
                    min="0"
                    className={`w-full pl-8 pr-3 py-2 border ${errors.costPrice ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                  />
                </div>
                {errors.costPrice && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.costPrice}
                  </p>
                )}
              </div>

              {/* Preço de Venda */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">
                  Preço de Venda
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-theme-secondary">
                    R$
                  </span>
                  <input
                    type="number"
                    name="sellingPrice"
                    value={formData.sellingPrice}
                    onChange={handleChange}
                    placeholder="0,00"
                    step="0.01"
                    min="0"
                    className={`w-full pl-8 pr-3 py-2 border ${errors.sellingPrice ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                  />
                </div>
                {errors.sellingPrice && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.sellingPrice}
                  </p>
                )}
              </div>

              {/* Unidade de Medida */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">
                  Unidade de Medida
                </label>
                <select
                  name="unitOfMeasure"
                  value={formData.unitOfMeasure}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-light-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 card-theme dark:bg-gray-700 text-theme-primary dark:text-dark-text-primary"
                >
                  {unitOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Estoque Atual */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">
                  Estoque Atual
                </label>
                <input
                  type="number"
                  name="currentStock"
                  value={formData.currentStock}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  className={`w-full px-3 py-2 border ${errors.currentStock ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                />
                {errors.currentStock && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.currentStock}
                  </p>
                )}
              </div>

              {/* Estoque Mínimo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">
                  Estoque Mínimo
                </label>
                <input
                  type="number"
                  name="minStock"
                  value={formData.minStock}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  className={`w-full px-3 py-2 border ${errors.minStock ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                />
                {errors.minStock && (
                  <p className="mt-1 text-sm text-red-500">{errors.minStock}</p>
                )}
              </div>

              {/* Estoque Máximo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">
                  Estoque Máximo
                </label>
                <input
                  type="number"
                  name="maxStock"
                  value={formData.maxStock}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  className={`w-full px-3 py-2 border ${errors.maxStock ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                />
                {errors.maxStock && (
                  <p className="mt-1 text-sm text-red-500">{errors.maxStock}</p>
                )}
              </div>
            </div>
          </div>

          {/* Informações Adicionais */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-theme-primary dark:text-dark-text-primary flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Informações Adicionais
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Localização */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">
                  Localização no Estoque
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-light-text-muted dark:text-dark-text-muted" />
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Ex: Prateleira A1, Gaveta 3"
                    className="w-full pl-10 pr-3 py-2 border border-light-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 card-theme dark:bg-gray-700 text-theme-primary dark:text-dark-text-primary"
                  />
                </div>
              </div>

              {/* Fornecedor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">
                  Fornecedor
                </label>
                <input
                  type="text"
                  name="supplierId"
                  value={formData.supplierId}
                  onChange={handleChange}
                  placeholder="ID do fornecedor (opcional)"
                  className="w-full px-3 py-2 border border-light-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 card-theme dark:bg-gray-700 text-theme-primary dark:text-dark-text-primary"
                />
              </div>

              {/* Observações */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">
                  Observações
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Observações adicionais sobre o produto"
                  rows={2}
                  className="w-full px-3 py-2 border border-light-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 card-theme dark:bg-gray-700 text-theme-primary dark:text-dark-text-primary"
                />
              </div>
            </div>
          </div>

          {/* Info sobre campos obrigatórios */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <span className="text-red-500">*</span> Campos obrigatórios
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  O sistema calculará automaticamente o valor total do estoque
                  baseado no preço de custo.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-light-border dark:border-dark-border">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 dark:text-gray-600 border border-light-border dark:border-dark-border rounded-lg hover:bg-light-bg dark:bg-dark-bg dark:hover:bg-gray-700 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-dark-text-primary rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Cadastrando...
                </>
              ) : (
                'Cadastrar Produto'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
CreateProductModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};
export default CreateProductModal;
