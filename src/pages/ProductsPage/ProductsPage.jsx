import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Package,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Loader,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Filter,
  Download,
  Eye,
  EyeOff,
  DollarSign,
  Box,
  ShoppingBag,
  BarChart3,
  Boxes,
  RefreshCw,
} from 'lucide-react';
import { Layout } from '../../components/Layout/Layout';
import { useAuth } from '../../context/AuthContext';
import { useUnit } from '../../context/UnitContext';
import { useToast } from '../../context/ToastContext';
import { useProducts } from '../../hooks/useProducts';
import {
  CreateProductModal,
  EditProductModal,
  StockMovementModal,
} from '../../molecules/ProductModals';

const ProductsPage = () => {
  const { user } = useAuth();
  const { selectedUnit } = useUnit();
  const { showToast } = useToast();

  // Estados
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Hook para buscar produtos
  const {
    products,
    loading,
    error,
    stats,
    createProduct,
    updateProduct,
    toggleProductStatus,
    deleteProduct,
    createStockMovement,
    getProductCategories,
    getProductBrands,
  } = useProducts({
    includeInactive: showInactive,
    enableCache: true,
    filters: {
      search: searchTerm,
      category: selectedCategory,
      brand: selectedBrand,
      lowStock: lowStockOnly,
    },
  });

  // Verificar permissões - Admin e Gerente podem gerenciar
  const canManage = useMemo(() => {
    return ['admin', 'gerente'].includes(user?.user_metadata?.role);
  }, [user]);

  // Filtrar e paginar produtos
  const filteredProducts = useMemo(() => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(
        product =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.barcode?.includes(searchTerm) ||
          product.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.brand?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(
        product => product.category === selectedCategory
      );
    }

    if (selectedBrand) {
      filtered = filtered.filter(product => product.brand === selectedBrand);
    }

    if (lowStockOnly) {
      filtered = filtered.filter(
        product => product.current_stock <= product.min_stock
      );
    }

    return filtered;
  }, [products, searchTerm, selectedCategory, selectedBrand, lowStockOnly]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  // Handlers para modais
  const handleCreateClick = () => {
    setSelectedProduct(null);
    setIsCreateModalOpen(true);
  };

  const handleEditClick = product => {
    setSelectedProduct(product);
    setIsEditModalOpen(true);
  };

  const handleMovementClick = product => {
    setSelectedProduct(product);
    setIsMovementModalOpen(true);
  };

  const handleDeleteClick = id => {
    setDeletingId(id);
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      handleDeleteProduct(id);
    }
    setDeletingId(null);
  };

  const handleToggleStatus = async (id, currentStatus) => {
    await toggleProductStatus(id, currentStatus);
  };

  const handleCreateProduct = async productData => {
    const { success } = await createProduct(productData);
    if (success) {
      setIsCreateModalOpen(false);
    }
  };

  const handleUpdateProduct = async (id, productData) => {
    const { success } = await updateProduct(id, productData);
    if (success) {
      setIsEditModalOpen(false);
    }
  };

  const handleDeleteProduct = async id => {
    const { success } = await deleteProduct(id);
    if (success) {
      // A lista será atualizada automaticamente pelo hook
    }
  };

  const handleCreateMovement = async movementData => {
    const { success } = await createStockMovement(movementData);
    if (success) {
      setIsMovementModalOpen(false);
    }
  };

  const formatCurrency = value => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0);
  };

  const getStockStatus = product => {
    if (product.current_stock === 0) {
      return { status: 'out', color: 'red', text: 'Sem Estoque' };
    } else if (product.current_stock <= product.min_stock) {
      return { status: 'low', color: 'yellow', text: 'Estoque Baixo' };
    } else {
      return { status: 'ok', color: 'green', text: 'Em Estoque' };
    }
  };

  if (!selectedUnit) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-full">
          <p className="text-gray-500 dark:text-gray-400">
            Selecione uma unidade para gerenciar produtos.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout activeMenuItem="cadastros" subMenuItem="products">
      <div className="flex flex-col flex-1 p-6 space-y-6">
        {/* 📊 Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-theme-primary mb-2">
              Controle de Estoque
            </h1>
            <p className="text-theme-secondary">
              Gerencie produtos, estoque e movimentações
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {}}
              className="p-2.5 text-gray-400 hover:text-theme-primary hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all"
              title="Atualizar"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            {canManage && (
              <button
                onClick={handleCreateClick}
                className="btn-theme-primary px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
              >
                <Plus className="w-5 h-5" />
                Novo Produto
              </button>
            )}
          </div>
        </div>

        {/* 📈 KPIs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Total de Produtos */}
          <div className="card-theme p-5 rounded-xl border-2 border-transparent hover:border-blue-300 dark:hover:border-blue-600 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-xs font-semibold text-theme-secondary uppercase tracking-wide mb-1">
              Total de Produtos
            </p>
            <p className="text-3xl font-bold text-theme-primary">
              {stats.totalProducts}
            </p>
          </div>

          {/* Valor Total */}
          <div className="card-theme p-5 rounded-xl border-2 border-transparent hover:border-green-300 dark:hover:border-green-600 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-xs font-semibold text-theme-secondary uppercase tracking-wide mb-1">
              Valor Total
            </p>
            <p className="text-2xl font-bold text-theme-primary">
              {formatCurrency(stats.totalValue)}
            </p>
          </div>

          {/* Estoque Baixo */}
          <div className="card-theme p-5 rounded-xl border-2 border-transparent hover:border-yellow-300 dark:hover:border-yellow-600 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-xs font-semibold text-theme-secondary uppercase tracking-wide mb-1">
              Estoque Baixo
            </p>
            <p className="text-3xl font-bold text-theme-primary">
              {stats.lowStockProducts}
            </p>
          </div>

          {/* Sem Estoque */}
          <div className="card-theme p-5 rounded-xl border-2 border-transparent hover:border-red-300 dark:hover:border-red-600 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl">
                <XCircle className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-xs font-semibold text-theme-secondary uppercase tracking-wide mb-1">
              Sem Estoque
            </p>
            <p className="text-3xl font-bold text-theme-primary">
              {stats.outOfStockProducts}
            </p>
          </div>

          {/* Valor de Venda */}
          <div className="card-theme p-5 rounded-xl border-2 border-transparent hover:border-purple-300 dark:hover:border-purple-600 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-xs font-semibold text-theme-secondary uppercase tracking-wide mb-1">
              Valor de Venda
            </p>
            <p className="text-2xl font-bold text-theme-primary">
              {formatCurrency(stats.totalStockValue)}
            </p>
          </div>
        </div>

        {/* 🔍 Barra de Ferramentas */}
        <div className="card-theme p-5 rounded-xl">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            {/* Busca e Filtros */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1 w-full">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Pesquisar produtos..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-theme-primary placeholder-gray-400 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={showInactive}
                    onChange={() => setShowInactive(!showInactive)}
                    className="form-checkbox h-4 w-4 text-primary rounded border-gray-300 dark:border-gray-600 focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-theme-secondary group-hover:text-theme-primary transition-colors">
                    Mostrar Inativos
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={lowStockOnly}
                    onChange={() => setLowStockOnly(!lowStockOnly)}
                    className="form-checkbox h-4 w-4 text-yellow-500 rounded border-gray-300 dark:border-gray-600 focus:ring-yellow-500"
                  />
                  <span className="text-sm font-medium text-theme-secondary group-hover:text-theme-primary transition-colors">
                    Estoque Baixo
                  </span>
                </label>
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-4 py-2.5 text-theme-secondary border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-theme-primary transition-all">
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filtros</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 text-theme-secondary border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-theme-primary transition-all">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Exportar</span>
              </button>
            </div>
          </div>
        </div>

        {/* 📋 Tabela de Produtos */}
        <div className="card-theme rounded-xl overflow-hidden flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-theme-secondary font-medium">
                  Carregando produtos...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-24">
              <AlertTriangle className="w-16 h-16 text-red-400 mb-4" />
              <p className="text-xl font-semibold text-red-600 dark:text-red-400">
                Erro ao carregar produtos
              </p>
              <p className="text-theme-secondary mt-2">{error}</p>
            </div>
          ) : paginatedProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24">
              <Package className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-xl font-semibold text-theme-primary mb-2">
                Nenhum produto encontrado
              </p>
              <p className="text-theme-secondary">
                {searchTerm
                  ? 'Tente ajustar os filtros de pesquisa'
                  : 'Adicione seu primeiro produto para começar'}
              </p>
              {canManage && !searchTerm && (
                <button
                  onClick={handleCreateClick}
                  className="mt-6 btn-theme-primary px-6 py-3 rounded-xl flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Criar Primeiro Produto
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border-b-2 border-gray-200 dark:border-gray-600">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-theme-secondary uppercase tracking-wider">
                        Produto
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-theme-secondary uppercase tracking-wider">
                        Categoria/Marca
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-theme-secondary uppercase tracking-wider">
                        Estoque
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-theme-secondary uppercase tracking-wider">
                        Preços
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-theme-secondary uppercase tracking-wider">
                        Status
                      </th>
                      {canManage && (
                        <th className="px-6 py-4 text-right text-xs font-bold text-theme-secondary uppercase tracking-wider">
                          Ações
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {paginatedProducts.map(product => {
                      const stockStatus = getStockStatus(product);
                      return (
                        <tr
                          key={product.id}
                          className="group hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 dark:hover:from-blue-900/10 dark:hover:to-indigo-900/10 transition-all duration-200"
                        >
                          {/* Produto */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl group-hover:scale-110 transition-transform">
                                <Box className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <p className="font-semibold text-theme-primary">
                                  {product.name}
                                </p>
                                {product.sku && (
                                  <p className="text-xs text-theme-secondary">
                                    SKU: {product.sku}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Categoria / Marca */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-theme-primary">
                              {product.category || '-'}
                            </div>
                            <div className="text-sm text-theme-secondary">
                              {product.brand || '-'}
                            </div>
                          </td>

                          {/* Estoque */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-theme-primary font-semibold">
                              {product.current_stock} {product.unit_of_measure}
                            </div>
                            <div className="text-sm text-theme-secondary">
                              Mín: {product.min_stock} | Máx:{' '}
                              {product.max_stock}
                            </div>
                          </td>

                          {/* Preços */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-theme-primary">
                              <span className="font-medium">Custo:</span>{' '}
                              {formatCurrency(product.cost_price)}
                            </div>
                            <div className="text-sm font-bold text-green-600 dark:text-green-400">
                              <span className="font-medium">Venda:</span>{' '}
                              {formatCurrency(product.selling_price)}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col gap-1.5">
                              {/* Status Ativo/Inativo */}
                              {product.is_active ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-semibold w-fit">
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  Ativo
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs font-semibold w-fit">
                                  <EyeOff className="w-3.5 h-3.5" />
                                  Inativo
                                </span>
                              )}

                              {/* Status Estoque */}
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold w-fit ${
                                  stockStatus.color === 'green'
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                    : stockStatus.color === 'yellow'
                                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                }`}
                              >
                                {stockStatus.text}
                              </span>
                            </div>
                          </td>

                          {/* Ações */}
                          {canManage && (
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleMovementClick(product)}
                                  className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                                  title="Movimentação de Estoque"
                                >
                                  <Boxes className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleEditClick(product)}
                                  className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-all"
                                  title="Editar Produto"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(product.id)}
                                  className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-all"
                                  title="Excluir Produto"
                                  disabled={deletingId === product.id}
                                >
                                  {deletingId === product.id ? (
                                    <Loader className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-2 text-sm text-theme-secondary">
                    <span className="font-medium">
                      Mostrando {(currentPage - 1) * itemsPerPage + 1} a{' '}
                      {Math.min(
                        currentPage * itemsPerPage,
                        filteredProducts.length
                      )}{' '}
                      de {filteredProducts.length} produtos
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setCurrentPage(prev => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className="p-2 text-theme-secondary hover:text-theme-primary hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        page => {
                          if (
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          ) {
                            return (
                              <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`min-w-[2.5rem] h-10 rounded-lg font-semibold transition-all ${
                                  currentPage === page
                                    ? 'bg-primary text-white shadow-lg'
                                    : 'text-theme-secondary hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                              >
                                {page}
                              </button>
                            );
                          } else if (
                            page === currentPage - 2 ||
                            page === currentPage + 2
                          ) {
                            return (
                              <span
                                key={page}
                                className="px-2 text-theme-secondary"
                              >
                                ...
                              </span>
                            );
                          }
                          return null;
                        }
                      )}
                    </div>

                    <button
                      onClick={() =>
                        setCurrentPage(prev => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className="p-2 text-theme-secondary hover:text-theme-primary hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modais */}
        <CreateProductModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleCreateProduct}
          loading={loading}
        />

        <EditProductModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onUpdate={handleUpdateProduct}
          product={selectedProduct}
          loading={loading}
        />

        <StockMovementModal
          isOpen={isMovementModalOpen}
          onClose={() => setIsMovementModalOpen(false)}
          onCreateMovement={handleCreateMovement}
          product={selectedProduct}
          loading={loading}
        />
      </div>
    </Layout>
  );
};

export default ProductsPage;
