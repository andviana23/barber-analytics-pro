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
  Filter,
  Download,
  EyeOff,
  DollarSign,
  Box,
  ShoppingBag,
  Boxes,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  FolderPlus,
} from 'lucide-react';
import { Layout } from '../../components/Layout/Layout';
import { useAuth } from '../../context/AuthContext';
import { useUnit } from '../../context/UnitContext';
import {
  useProducts,
  useProductStatistics,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from '../../hooks/useProducts';
import {
  CreateProductModal,
  EditProductModal,
  StockMovementModal,
} from '../../molecules/ProductModals';
import { ProductCategoryModal } from '../../molecules/ProductCategoryModal';
const ProductsPage = () => {
  const { user } = useAuth();
  const { selectedUnit } = useUnit();

  // Estados
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Hook para buscar produtos com TanStack Query
  const filters = useMemo(
    () => ({
      unit_id: selectedUnit?.id,
      search: searchTerm,
      category: selectedCategory,
      brand: selectedBrand,
      is_active: !showInactive ? true : undefined, // undefined = mostrar todos
    }),
    [
      selectedUnit?.id,
      searchTerm,
      selectedCategory,
      selectedBrand,
      showInactive,
    ]
  );

  const {
    data: productsData,
    isLoading: loading,
    error: productsError,
  } = useProducts(filters);
  const { data: statsData } = useProductStatistics(selectedUnit?.id);
  const { mutate: createProductMutation } = useCreateProduct();
  const { mutate: updateProductMutation } = useUpdateProduct();
  const { mutate: deleteProductMutation } = useDeleteProduct();

  const products = useMemo(() => productsData?.data || [], [productsData]);
  const stats = statsData || {
    totalProducts: 0,
    totalValue: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    totalStockValue: 0,
  };
  const error = productsError?.message;

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
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      setDeletingId(id);
      deleteProductMutation(id, {
        onSuccess: () => {
          setDeletingId(null);
        },
        onError: () => {
          setDeletingId(null);
        },
      });
    }
  };

  const handleCreateProduct = async productData => {
    createProductMutation(productData, {
      onSuccess: () => {
        setIsCreateModalOpen(false);
      },
    });
  };

  const handleUpdateProduct = async (id, productData) => {
    updateProductMutation(
      { id, updates: productData },
      {
        onSuccess: () => {
          setIsEditModalOpen(false);
        },
      }
    );
  };

  const handleCreateMovement = async movementData => {
    // TODO: Implementar mutation de stock movement
    setIsMovementModalOpen(false);
  };
  const formatCurrency = value => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0);
  };
  const getStockStatus = product => {
    if (product.current_stock === 0) {
      return {
        status: 'out',
        color: 'red',
        text: 'Sem Estoque',
      };
    } else if (product.current_stock <= product.min_stock) {
      return {
        status: 'low',
        color: 'yellow',
        text: 'Estoque Baixo',
      };
    } else {
      return {
        status: 'ok',
        color: 'green',
        text: 'Em Estoque',
      };
    }
  };
  if (!selectedUnit) {
    return (
      <Layout>
        <div className="flex h-full items-center justify-center">
          <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
            Selecione uma unidade para gerenciar produtos.
          </p>
        </div>
      </Layout>
    );
  }
  return (
    <Layout activeMenuItem="cadastros" subMenuItem="products">
      <div className="flex flex-1 flex-col space-y-6 p-6">
        {/* 📊 Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-theme-primary mb-2 text-3xl font-bold">
              Controle de Estoque
            </h1>
            <p className="text-theme-secondary">
              Gerencie produtos, estoque e movimentações
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {}}
              className="text-light-text-muted dark:text-dark-text-muted hover:text-theme-primary hover:card-theme rounded-xl p-2.5 transition-all dark:hover:bg-dark-hover"
              title="Atualizar"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
            {canManage && (
              <>
                <button
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="flex items-center gap-2 rounded-xl border border-primary px-4 py-2.5 text-primary transition-all hover:bg-primary/10"
                  title="Cadastrar categoria de produto"
                >
                  <FolderPlus className="h-5 w-5" />
                  <span className="hidden sm:inline">Nova Categoria</span>
                </button>
                <button
                  onClick={handleCreateClick}
                  className="btn-theme-primary flex items-center gap-2 rounded-xl px-5 py-2.5 shadow-lg transition-all hover:shadow-xl"
                >
                  <Plus className="h-5 w-5" />
                  Novo Produto
                </button>
              </>
            )}
          </div>
        </div>

        {/* 📈 KPIs Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
          {/* Total de Produtos */}
          <div className="card-theme rounded-xl border-2 border-transparent p-5 transition-all hover:border-blue-300 dark:hover:border-blue-600">
            <div className="mb-3 flex items-center justify-between">
              <div className="rounded-xl bg-gradient-primary p-3">
                <Package className="text-dark-text-primary h-6 w-6" />
              </div>
            </div>
            <p className="text-theme-secondary mb-1 text-xs font-semibold uppercase tracking-wide">
              Total de Produtos
            </p>
            <p className="text-theme-primary text-3xl font-bold">
              {stats.totalProducts}
            </p>
          </div>

          {/* Valor Total */}
          <div className="card-theme rounded-xl border-2 border-transparent p-5 transition-all hover:border-green-300 dark:hover:border-green-600">
            <div className="mb-3 flex items-center justify-between">
              <div className="rounded-xl bg-gradient-success p-3">
                <DollarSign className="text-dark-text-primary h-6 w-6" />
              </div>
            </div>
            <p className="text-theme-secondary mb-1 text-xs font-semibold uppercase tracking-wide">
              Valor Total
            </p>
            <p className="text-theme-primary text-2xl font-bold">
              {formatCurrency(stats.totalValue)}
            </p>
          </div>

          {/* Estoque Baixo */}
          <div className="card-theme rounded-xl border-2 border-transparent p-5 transition-all hover:border-yellow-300 dark:hover:border-yellow-600">
            <div className="mb-3 flex items-center justify-between">
              <div className="rounded-xl bg-gradient-warning p-3">
                <AlertTriangle className="text-dark-text-primary h-6 w-6" />
              </div>
            </div>
            <p className="text-theme-secondary mb-1 text-xs font-semibold uppercase tracking-wide">
              Estoque Baixo
            </p>
            <p className="text-theme-primary text-3xl font-bold">
              {stats.lowStockProducts}
            </p>
          </div>

          {/* Sem Estoque */}
          <div className="card-theme rounded-xl border-2 border-transparent p-5 transition-all hover:border-red-300 dark:hover:border-red-600">
            <div className="mb-3 flex items-center justify-between">
              <div className="bg-gradient-danger rounded-xl p-3">
                <XCircle className="text-dark-text-primary h-6 w-6" />
              </div>
            </div>
            <p className="text-theme-secondary mb-1 text-xs font-semibold uppercase tracking-wide">
              Sem Estoque
            </p>
            <p className="text-theme-primary text-3xl font-bold">
              {stats.outOfStockProducts}
            </p>
          </div>

          {/* Valor de Venda */}
          <div className="card-theme rounded-xl border-2 border-transparent p-5 transition-all hover:border-purple-300 dark:hover:border-purple-600">
            <div className="mb-3 flex items-center justify-between">
              <div className="bg-gradient-secondary rounded-xl p-3">
                <ShoppingBag className="text-dark-text-primary h-6 w-6" />
              </div>
            </div>
            <p className="text-theme-secondary mb-1 text-xs font-semibold uppercase tracking-wide">
              Valor de Venda
            </p>
            <p className="text-theme-primary text-2xl font-bold">
              {formatCurrency(stats.totalStockValue)}
            </p>
          </div>
        </div>

        {/* 🔍 Barra de Ferramentas */}
        <div className="card-theme rounded-xl p-5">
          <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
            {/* Busca e Filtros */}
            <div className="flex w-full flex-1 flex-col items-start gap-3 sm:flex-row sm:items-center">
              <div className="relative max-w-md flex-1">
                <Search className="text-light-text-muted dark:text-dark-text-muted absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 transform" />
                <input
                  type="text"
                  placeholder="Pesquisar produtos..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="card-theme text-theme-primary w-full rounded-xl border border-light-border py-2.5 pl-11 pr-4 placeholder-gray-400 transition-all focus:border-primary focus:ring-2 focus:ring-primary/50 dark:border-dark-border dark:bg-gray-700"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="group flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showInactive}
                    onChange={() => setShowInactive(!showInactive)}
                    className="form-checkbox h-4 w-4 rounded border-light-border text-primary focus:ring-primary dark:border-dark-border"
                  />
                  <span className="text-theme-secondary group-hover:text-theme-primary text-sm font-medium transition-colors">
                    Mostrar Inativos
                  </span>
                </label>

                <label className="group flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={lowStockOnly}
                    onChange={() => setLowStockOnly(!lowStockOnly)}
                    className="form-checkbox h-4 w-4 rounded border-light-border text-yellow-500 focus:ring-yellow-500 dark:border-dark-border"
                  />
                  <span className="text-theme-secondary group-hover:text-theme-primary text-sm font-medium transition-colors">
                    Estoque Baixo
                  </span>
                </label>
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-2">
              <button className="text-theme-secondary hover:text-theme-primary flex items-center gap-2 rounded-xl border border-light-border px-4 py-2.5 transition-all hover:bg-light-bg dark:border-dark-border dark:bg-dark-bg dark:hover:bg-gray-700">
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Filtros</span>
              </button>
              <button className="text-theme-secondary hover:text-theme-primary flex items-center gap-2 rounded-xl border border-light-border px-4 py-2.5 transition-all hover:bg-light-bg dark:border-dark-border dark:bg-dark-bg dark:hover:bg-gray-700">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Exportar</span>
              </button>
            </div>
          </div>
        </div>

        {/* 📋 Tabela de Produtos */}
        <div className="card-theme flex-1 overflow-hidden rounded-xl">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="flex flex-col items-center gap-4">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <p className="text-theme-secondary font-medium">
                  Carregando produtos...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-24">
              <AlertTriangle className="mb-4 h-16 w-16 text-red-400" />
              <p className="text-xl font-semibold text-red-600 dark:text-red-400">
                Erro ao carregar produtos
              </p>
              <p className="text-theme-secondary mt-2">{error}</p>
            </div>
          ) : paginatedProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24">
              <Package className="dark:text-theme-secondary mb-4 h-16 w-16 text-gray-300 dark:text-gray-600" />
              <p className="text-theme-primary mb-2 text-xl font-semibold">
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
                  className="btn-theme-primary mt-6 flex items-center gap-2 rounded-xl px-6 py-3"
                >
                  <Plus className="h-5 w-5" />
                  Criar Primeiro Produto
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b-2 border-light-border bg-gradient-light dark:border-dark-border dark:from-gray-800 dark:to-gray-700">
                    <tr>
                      <th className="text-theme-secondary px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                        Produto
                      </th>
                      <th className="text-theme-secondary px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                        Categoria/Marca
                      </th>
                      <th className="text-theme-secondary px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                        Estoque
                      </th>
                      <th className="text-theme-secondary px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                        Preços
                      </th>
                      <th className="text-theme-secondary px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                        Status
                      </th>
                      {canManage && (
                        <th className="text-theme-secondary px-6 py-4 text-right text-xs font-bold uppercase tracking-wider">
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
                          className="group transition-all duration-200 hover:bg-light-hover dark:hover:bg-dark-hover"
                        >
                          {/* Produto */}
                          <td className="whitespace-nowrap px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="rounded-xl bg-blue-100 p-2.5 transition-transform group-hover:scale-110 dark:bg-blue-900/30">
                                <Box className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <p className="text-theme-primary font-semibold">
                                  {product.name}
                                </p>
                                {product.sku && (
                                  <p className="text-theme-secondary text-xs">
                                    SKU: {product.sku}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Categoria / Marca */}
                          <td className="whitespace-nowrap px-6 py-4">
                            <div className="text-theme-primary text-sm">
                              {product.category || '-'}
                            </div>
                            <div className="text-theme-secondary text-sm">
                              {product.brand || '-'}
                            </div>
                          </td>

                          {/* Estoque */}
                          <td className="whitespace-nowrap px-6 py-4">
                            <div className="text-theme-primary text-sm font-semibold">
                              {product.current_stock} {product.unit_of_measure}
                            </div>
                            <div className="text-theme-secondary text-sm">
                              Mín: {product.min_stock} | Máx:{' '}
                              {product.max_stock}
                            </div>
                          </td>

                          {/* Preços */}
                          <td className="whitespace-nowrap px-6 py-4">
                            <div className="text-theme-primary text-sm">
                              <span className="font-medium">Custo:</span>{' '}
                              {formatCurrency(product.cost_price)}
                            </div>
                            <div className="text-sm font-bold text-green-600 dark:text-green-400">
                              <span className="font-medium">Venda:</span>{' '}
                              {formatCurrency(product.selling_price)}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="whitespace-nowrap px-6 py-4">
                            <div className="flex flex-col gap-1.5">
                              {/* Status Ativo/Inativo */}
                              {product.is_active ? (
                                <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-300">
                                  <CheckCircle className="h-3.5 w-3.5" />
                                  Ativo
                                </span>
                              ) : (
                                <span className="card-theme text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold dark:bg-gray-700">
                                  <EyeOff className="h-3.5 w-3.5" />
                                  Inativo
                                </span>
                              )}

                              {/* Status Estoque */}
                              <span
                                className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${stockStatus.color === 'green' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : stockStatus.color === 'yellow' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}
                              >
                                {stockStatus.text}
                              </span>
                            </div>
                          </td>

                          {/* Ações */}
                          {canManage && (
                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleMovementClick(product)}
                                  className="rounded-lg p-2 text-blue-600 transition-all hover:bg-blue-100 dark:hover:bg-blue-900/30"
                                  title="Movimentação de Estoque"
                                >
                                  <Boxes className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleEditClick(product)}
                                  className="rounded-lg p-2 text-green-600 transition-all hover:bg-green-100 dark:hover:bg-green-900/30"
                                  title="Editar Produto"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(product.id)}
                                  className="rounded-lg p-2 text-red-600 transition-all hover:bg-red-100 dark:hover:bg-red-900/30"
                                  title="Excluir Produto"
                                  disabled={deletingId === product.id}
                                >
                                  {deletingId === product.id ? (
                                    <Loader className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
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
                <div className="flex items-center justify-between border-t border-light-border bg-light-bg px-6 py-4 dark:border-dark-border dark:bg-dark-bg dark:bg-dark-surface/50">
                  <div className="text-theme-secondary flex items-center gap-2 text-sm">
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
                      className="text-theme-secondary hover:text-theme-primary rounded-lg p-2 transition-all hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-gray-700 dark:hover:bg-gray-700"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from(
                        {
                          length: totalPages,
                        },
                        (_, i) => i + 1
                      ).map(page => {
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`h-10 min-w-[2.5rem] rounded-lg font-semibold transition-all ${currentPage === page ? 'bg-primary text-white shadow-lg' : 'text-theme-secondary hover:bg-gray-200 dark:hover:bg-gray-700'}`}
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
                              className="text-theme-secondary px-2"
                            >
                              ...
                            </span>
                          );
                        }
                        return null;
                      })}
                    </div>

                    <button
                      onClick={() =>
                        setCurrentPage(prev => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className="text-theme-secondary hover:text-theme-primary rounded-lg p-2 transition-all hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-gray-700 dark:hover:bg-gray-700"
                    >
                      <ChevronRight className="h-5 w-5" />
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

        <ProductCategoryModal
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
        />
      </div>
    </Layout>
  );
};
export default ProductsPage;
