import React, { useState, useEffect } from 'react';
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

const EditProductModal = ({
  isOpen,
  onClose,
  onUpdate,
  product,
  loading = false,
}) => {
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
    { value: 'unidade', label: 'Unidade' },
    { value: 'litro', label: 'Litro' },
    { value: 'ml', label: 'Mililitro (ml)' },
    { value: 'grama', label: 'Grama' },
    { value: 'kg', label: 'Quilograma (kg)' },
    { value: 'caixa', label: 'Caixa' },
    { value: 'pacote', label: 'Pacote' },
  ];

  // Carregar dados do produto quando abrir o modal
  useEffect(() => {
    if (product && isOpen) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        sku: product.sku || '',
        category: product.category || '',
        brand: product.brand || '',
        costPrice: product.cost_price?.toString() || '',
        sellingPrice: product.selling_price?.toString() || '',
        currentStock: product.current_stock?.toString() || '',
        minStock: product.min_stock?.toString() || '',
        maxStock: product.max_stock?.toString() || '',
        unitOfMeasure: product.unit_of_measure || 'unidade',
        supplierId: product.supplier_id || '',
        barcode: product.barcode || '',
        location: product.location || '',
        notes: product.notes || '',
      });
    }
  }, [product, isOpen]);

  // Validar formulário
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name || formData.name.trim().length < 3) {
      newErrors.name = 'Nome deve ter pelo menos 3 caracteres';
    }

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

    await onUpdate(product.id, dataToSubmit);
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg">
              <Package className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Editar Produto
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Atualizar dados do produto
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
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <Package className="w-5 h-5" />
              Informações Básicas
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nome - OBRIGATÓRIO */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome do Produto <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Digite o nome do produto"
                    className={`w-full pl-10 pr-3 py-2 border ${
                      errors.name
                        ? 'border-red-500'
                        : 'border-gray-300 dark:border-gray-600'
                    } rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              {/* SKU */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Código (SKU)
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    placeholder="Ex: SHM001"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Código de Barras */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Código de Barras
                </label>
                <input
                  type="text"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleChange}
                  placeholder="7891234567890"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Categoria */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Categoria
                </label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    placeholder="Ex: Shampoo, Condicionador"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Marca */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Marca
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    placeholder="Ex: L'Oréal, Schwarzkopf"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Descrição */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descrição
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Descrição detalhada do produto"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Preços e Estoque */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Preços e Estoque
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Preço de Custo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Preço de Custo
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
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
                    className={`w-full pl-8 pr-3 py-2 border ${
                      errors.costPrice
                        ? 'border-red-500'
                        : 'border-gray-300 dark:border-gray-600'
                    } rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Preço de Venda
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
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
                    className={`w-full pl-8 pr-3 py-2 border ${
                      errors.sellingPrice
                        ? 'border-red-500'
                        : 'border-gray-300 dark:border-gray-600'
                    } rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Unidade de Medida
                </label>
                <select
                  name="unitOfMeasure"
                  value={formData.unitOfMeasure}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estoque Atual
                </label>
                <input
                  type="number"
                  name="currentStock"
                  value={formData.currentStock}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  className={`w-full px-3 py-2 border ${
                    errors.currentStock
                      ? 'border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  } rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                />
                {errors.currentStock && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.currentStock}
                  </p>
                )}
              </div>

              {/* Estoque Mínimo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estoque Mínimo
                </label>
                <input
                  type="number"
                  name="minStock"
                  value={formData.minStock}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  className={`w-full px-3 py-2 border ${
                    errors.minStock
                      ? 'border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  } rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                />
                {errors.minStock && (
                  <p className="mt-1 text-sm text-red-500">{errors.minStock}</p>
                )}
              </div>

              {/* Estoque Máximo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estoque Máximo
                </label>
                <input
                  type="number"
                  name="maxStock"
                  value={formData.maxStock}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  className={`w-full px-3 py-2 border ${
                    errors.maxStock
                      ? 'border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  } rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                />
                {errors.maxStock && (
                  <p className="mt-1 text-sm text-red-500">{errors.maxStock}</p>
                )}
              </div>
            </div>
          </div>

          {/* Informações Adicionais */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Informações Adicionais
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Localização */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Localização no Estoque
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Ex: Prateleira A1, Gaveta 3"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Fornecedor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fornecedor
                </label>
                <input
                  type="text"
                  name="supplierId"
                  value={formData.supplierId}
                  onChange={handleChange}
                  placeholder="ID do fornecedor (opcional)"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Observações */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Observações
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Observações adicionais sobre o produto"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

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
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Atualizando...
                </>
              ) : (
                'Atualizar Produto'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

EditProductModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  product: PropTypes.object,
  loading: PropTypes.bool,
};

export default EditProductModal;

