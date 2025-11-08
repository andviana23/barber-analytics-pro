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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="card-theme max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg shadow-xl dark:bg-dark-surface">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-light-border p-6 dark:border-dark-border">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
              <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-theme-primary dark:text-dark-text-primary text-xl font-semibold">
                Novo Produto
              </h2>
              <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm">
                Cadastrar novo produto no estoque
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="text-light-text-muted dark:text-dark-text-muted hover:text-theme-secondary hover:card-theme flex h-8 w-8 items-center justify-center rounded-lg transition-colors dark:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="text-theme-primary dark:text-dark-text-primary flex items-center gap-2 text-lg font-medium">
              <Package className="h-5 w-5" />
              Informações Básicas
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Nome - OBRIGATÓRIO */}
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
                  Nome do Produto <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Package className="text-light-text-muted dark:text-dark-text-muted absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Digite o nome do produto"
                    className={`w-full border py-2 pl-10 pr-3 ${errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white`}
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              {/* SKU */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
                  Código (SKU)
                </label>
                <div className="relative">
                  <Hash className="text-light-text-muted dark:text-dark-text-muted absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform" />
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    placeholder="Ex: SHM001"
                    className="card-theme text-theme-primary dark:text-dark-text-primary w-full rounded-lg border border-light-border py-2 pl-10 pr-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-dark-border dark:bg-gray-700"
                  />
                </div>
              </div>

              {/* Código de Barras */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
                  Código de Barras
                </label>
                <input
                  type="text"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleChange}
                  placeholder="7891234567890"
                  className="card-theme text-theme-primary dark:text-dark-text-primary w-full rounded-lg border border-light-border px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-dark-border dark:bg-gray-700"
                />
              </div>

              {/* Categoria */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
                  Categoria
                </label>
                <div className="relative">
                  <Tag className="text-light-text-muted dark:text-dark-text-muted absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform" />
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    placeholder="Ex: Shampoo, Condicionador"
                    className="card-theme text-theme-primary dark:text-dark-text-primary w-full rounded-lg border border-light-border py-2 pl-10 pr-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-dark-border dark:bg-gray-700"
                  />
                </div>
              </div>

              {/* Marca */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
                  Marca
                </label>
                <div className="relative">
                  <Building className="text-light-text-muted dark:text-dark-text-muted absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform" />
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    placeholder="Ex: L'Oréal, Schwarzkopf"
                    className="card-theme text-theme-primary dark:text-dark-text-primary w-full rounded-lg border border-light-border py-2 pl-10 pr-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-dark-border dark:bg-gray-700"
                  />
                </div>
              </div>

              {/* Descrição */}
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
                  Descrição
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Descrição detalhada do produto"
                  rows={3}
                  className="card-theme text-theme-primary dark:text-dark-text-primary w-full rounded-lg border border-light-border px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-dark-border dark:bg-gray-700"
                />
              </div>
            </div>
          </div>

          {/* Preços e Estoque */}
          <div className="space-y-4">
            <h3 className="text-theme-primary dark:text-dark-text-primary flex items-center gap-2 text-lg font-medium">
              <DollarSign className="h-5 w-5" />
              Preços e Estoque
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* Preço de Custo */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
                  Preço de Custo
                </label>
                <div className="relative">
                  <span className="text-theme-secondary absolute left-3 top-1/2 -translate-y-1/2 transform">
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
                    className={`w-full border py-2 pl-8 pr-3 ${errors.costPrice ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white`}
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
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
                  Preço de Venda
                </label>
                <div className="relative">
                  <span className="text-theme-secondary absolute left-3 top-1/2 -translate-y-1/2 transform">
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
                    className={`w-full border py-2 pl-8 pr-3 ${errors.sellingPrice ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white`}
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
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
                  Unidade de Medida
                </label>
                <select
                  name="unitOfMeasure"
                  value={formData.unitOfMeasure}
                  onChange={handleChange}
                  className="card-theme text-theme-primary dark:text-dark-text-primary w-full rounded-lg border border-light-border px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-dark-border dark:bg-gray-700"
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
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
                  Estoque Atual
                </label>
                <input
                  type="number"
                  name="currentStock"
                  value={formData.currentStock}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  className={`w-full border px-3 py-2 ${errors.currentStock ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white`}
                />
                {errors.currentStock && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.currentStock}
                  </p>
                )}
              </div>

              {/* Estoque Mínimo */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
                  Estoque Mínimo
                </label>
                <input
                  type="number"
                  name="minStock"
                  value={formData.minStock}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  className={`w-full border px-3 py-2 ${errors.minStock ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white`}
                />
                {errors.minStock && (
                  <p className="mt-1 text-sm text-red-500">{errors.minStock}</p>
                )}
              </div>

              {/* Estoque Máximo */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
                  Estoque Máximo
                </label>
                <input
                  type="number"
                  name="maxStock"
                  value={formData.maxStock}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  className={`w-full border px-3 py-2 ${errors.maxStock ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white`}
                />
                {errors.maxStock && (
                  <p className="mt-1 text-sm text-red-500">{errors.maxStock}</p>
                )}
              </div>
            </div>
          </div>

          {/* Informações Adicionais */}
          <div className="space-y-4">
            <h3 className="text-theme-primary dark:text-dark-text-primary flex items-center gap-2 text-lg font-medium">
              <MapPin className="h-5 w-5" />
              Informações Adicionais
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Localização */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
                  Localização no Estoque
                </label>
                <div className="relative">
                  <MapPin className="text-light-text-muted dark:text-dark-text-muted absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform" />
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Ex: Prateleira A1, Gaveta 3"
                    className="card-theme text-theme-primary dark:text-dark-text-primary w-full rounded-lg border border-light-border py-2 pl-10 pr-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-dark-border dark:bg-gray-700"
                  />
                </div>
              </div>

              {/* Fornecedor */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
                  Fornecedor
                </label>
                <input
                  type="text"
                  name="supplierId"
                  value={formData.supplierId}
                  onChange={handleChange}
                  placeholder="ID do fornecedor (opcional)"
                  className="card-theme text-theme-primary dark:text-dark-text-primary w-full rounded-lg border border-light-border px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-dark-border dark:bg-gray-700"
                />
              </div>

              {/* Observações */}
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
                  Observações
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Observações adicionais sobre o produto"
                  rows={2}
                  className="card-theme text-theme-primary dark:text-dark-text-primary w-full rounded-lg border border-light-border px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-dark-border dark:bg-gray-700"
                />
              </div>
            </div>
          </div>

          {/* Info sobre campos obrigatórios */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <span className="text-red-500">*</span> Campos obrigatórios
                </p>
                <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                  O sistema calculará automaticamente o valor total do estoque
                  baseado no preço de custo.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-light-border pt-4 dark:border-dark-border">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-light-border px-4 py-2 text-gray-700 transition-colors hover:bg-light-bg dark:border-dark-border dark:bg-dark-bg dark:text-gray-300 dark:text-gray-600 dark:hover:bg-gray-700"
              disabled={loading}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="text-dark-text-primary flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
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
