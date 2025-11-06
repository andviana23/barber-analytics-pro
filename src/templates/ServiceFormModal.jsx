import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Modal from '../atoms/Modal';
import CurrencyInput from '../atoms/CurrencyInput';
import TimeInput from '../atoms/TimeInput';
import categoriesService from '../services/categoriesService';

/**
 * ServiceFormModal - Modal para criar/editar serviço
 *
 * Template modal CRUD de serviços.
 * Permite gerenciar nome, preço, duração, comissão e categoria.
 *
 * ✅ Integrado com categorias de "Receita de Serviço"
 * ✅ Validação completa
 * ✅ Tratamento de erros
 *
 * @component
 * @example
 * ```jsx
 * <ServiceFormModal
 *   isOpen={showModal}
 *   onClose={handleClose}
 *   onSave={handleSave}
 *   unitId={selectedUnit.id}
 *   service={serviceData}
 *   mode="create"
 * />
 * ```
 */
const ServiceFormModal = ({
  isOpen,
  onClose,
  onSave,
  unitId,
  service = null,
  mode = 'create',
  // 'create' | 'edit'
  loading = false,
}) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState(0);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [commissionPercentage, setCommissionPercentage] = useState(45);
  const [categoryId, setCategoryId] = useState('');
  const [errors, setErrors] = useState({});

  // Estados para categorias
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categoriesError, setCategoriesError] = useState(null);
  const isEditMode = mode === 'edit';

  // 🔄 Carrega categorias quando o modal abre
  useEffect(() => {
    console.log('🎯 ServiceFormModal - useEffect disparado:', {
      isOpen,
    });
    if (isOpen) {
      console.log('✅ Modal aberto, carregando categorias...');
      loadCategories();
    } else {
      console.log('⏸️ Modal fechado, não carregando categorias');
    }
  }, [isOpen]);

  // 📥 Função para carregar categorias de "Receita de Serviço"
  const loadCategories = async () => {
    console.log('🔄 ServiceFormModal - Carregando categorias...');
    setLoadingCategories(true);
    setCategoriesError(null);
    try {
      const result = await categoriesService.getRevenueCategories();
      console.log('📦 Categorias recebidas:', result);
      if (result && Array.isArray(result)) {
        // Filtra apenas categorias de serviço (não de produto)
        const serviceCategories = result.filter(
          cat => cat.revenue_type === 'service'
        );
        console.log('✅ Categorias de serviço filtradas:', serviceCategories);
        setCategories(serviceCategories);

        // Se não há categoria selecionada e há categorias disponíveis, seleciona a primeira
        if (!categoryId && serviceCategories.length > 0) {
          setCategoryId(serviceCategories[0].id);
          console.log('✅ Categoria auto-selecionada:', serviceCategories[0]);
        }
      } else {
        console.warn('⚠️ Nenhuma categoria retornada');
        setCategories([]);
        setCategoriesError('Nenhuma categoria de serviço encontrada');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar categorias:', error);
      setCategoriesError(
        'Erro ao carregar categorias. Por favor, tente novamente.'
      );
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };
  useEffect(() => {
    if (service && isEditMode) {
      setName(service.name || '');
      setPrice(service.price || 0);
      setDurationMinutes(service.duration_minutes || 30);
      setCommissionPercentage(service.commission_percentage || 45);
      setCategoryId(service.category_id || '');
    } else {
      handleReset();
    }
  }, [service, mode, isOpen]);
  const handleReset = () => {
    setName('');
    setPrice(0);
    setDurationMinutes(30);
    setCommissionPercentage(45);
    setCategoryId('');
    setErrors({});
    setCategoriesError(null);
  };
  const handleClose = () => {
    if (!loading) {
      handleReset();
      onClose();
    }
  };
  const validate = () => {
    const newErrors = {};
    if (!name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    } else if (name.trim().length < 3) {
      newErrors.name = 'Nome deve ter pelo menos 3 caracteres';
    } else if (name.trim().length > 100) {
      newErrors.name = 'Nome muito longo (máximo 100 caracteres)';
    }
    if (price <= 0) {
      newErrors.price = 'Preço deve ser maior que zero';
    } else if (price > 10000) {
      newErrors.price = 'Preço muito alto (máximo R$ 10.000)';
    }
    if (durationMinutes < 5) {
      newErrors.durationMinutes = 'Duração mínima: 5 minutos';
    } else if (durationMinutes > 480) {
      newErrors.durationMinutes = 'Duração máxima: 8 horas (480 min)';
    }
    if (commissionPercentage < 0) {
      newErrors.commissionPercentage = 'Comissão não pode ser negativa';
    } else if (commissionPercentage > 100) {
      newErrors.commissionPercentage = 'Comissão máxima: 100%';
    }
    if (!categoryId) {
      newErrors.categoryId = 'Selecione uma categoria';
    }
    if (!unitId) {
      newErrors.unitId = 'Unidade não identificada. Selecione uma unidade.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = e => {
    e.preventDefault();
    if (!validate()) return;
    if (onSave) {
      onSave({
        name: name.trim(),
        price,
        duration_minutes: durationMinutes,
        commission_percentage: commissionPercentage,
        category_id: categoryId,
        unitId, // ✅ Inclui unitId no payload
      });
    }
  };
  const calculateCommission = () => {
    return (price * commissionPercentage) / 100;
  };
  const commission = calculateCommission();
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditMode ? 'Editar Serviço' : 'Novo Serviço'}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6 p-6">
        {/* Aviso se não houver unitId */}
        {!unitId && (
          <div className="rounded-lg border border-feedback-light-error/30 bg-feedback-light-error/10 p-4 dark:border-feedback-dark-error/30 dark:bg-feedback-dark-error/10">
            <div className="flex items-start gap-3">
              <svg
                className="mt-0.5 h-5 w-5 flex-shrink-0 text-feedback-light-error dark:text-feedback-dark-error"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h4 className="mb-1 font-semibold text-feedback-light-error dark:text-feedback-dark-error">
                  Unidade não selecionada
                </h4>
                <p className="text-sm text-feedback-light-error dark:text-feedback-dark-error">
                  Por favor, selecione uma unidade antes de cadastrar um
                  serviço.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Aviso de erro ao carregar categorias */}
        {categoriesError && (
          <div className="rounded-lg border border-feedback-light-warning/30 bg-feedback-light-warning/10 p-4 dark:border-feedback-dark-warning/30 dark:bg-feedback-dark-warning/10">
            <div className="flex items-start gap-3">
              <svg
                className="mt-0.5 h-5 w-5 flex-shrink-0 text-feedback-light-warning dark:text-feedback-dark-warning"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h4 className="mb-1 font-semibold text-feedback-light-warning dark:text-feedback-dark-warning">
                  Problema ao carregar categorias
                </h4>
                <p className="text-sm text-feedback-light-warning dark:text-feedback-dark-warning">
                  {categoriesError}
                </p>
                <button
                  type="button"
                  onClick={loadCategories}
                  className="mt-2 text-sm font-medium text-feedback-light-warning hover:underline dark:text-feedback-dark-warning"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Nome do Serviço */}
        <div>
          <label className="text-theme-primary mb-2 block text-sm font-medium">
            Nome do Serviço
            <span className="ml-1 text-feedback-light-error dark:text-feedback-dark-error">
              *
            </span>
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            disabled={loading}
            placeholder="Ex: Corte + Barba"
            maxLength={100}
            className={`input-theme ${errors.name ? 'border-feedback-light-error focus:border-feedback-light-error dark:border-feedback-dark-error' : ''}`}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-feedback-light-error dark:text-feedback-dark-error">
              {errors.name}
            </p>
          )}
        </div>

        {/* 📂 Categoria do Serviço */}
        <div>
          <label className="text-theme-primary mb-2 block text-sm font-medium">
            Categoria
            <span className="ml-1 text-feedback-light-error dark:text-feedback-dark-error">
              *
            </span>
          </label>
          {(() => {
            console.log('🎨 Renderizando campo categoria:', {
              loadingCategories,
              categoriesCount: categories.length,
              categoriesError,
              categories,
            });
            if (loadingCategories) {
              return (
                <div className="flex items-center gap-2 rounded-lg border border-light-border bg-light-surface px-4 py-2.5 dark:border-dark-border dark:bg-dark-hover">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span className="text-theme-secondary text-sm">
                    Carregando categorias...
                  </span>
                </div>
              );
            }
            if (categories.length > 0) {
              return (
                <>
                  <select
                    value={categoryId}
                    onChange={e => setCategoryId(e.target.value)}
                    disabled={loading}
                    className={`input-theme ${errors.categoryId ? 'border-feedback-light-error focus:border-feedback-light-error dark:border-feedback-dark-error' : ''}`}
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                        {cat.parent?.name ? ` (${cat.parent.name})` : ''}
                      </option>
                    ))}
                  </select>
                  {errors.categoryId && (
                    <p className="mt-1 text-sm text-feedback-light-error dark:text-feedback-dark-error">
                      {errors.categoryId}
                    </p>
                  )}
                  <p className="text-theme-secondary mt-1 text-xs">
                    Apenas categorias de "Receita de Serviço" são exibidas
                  </p>
                </>
              );
            }
            return (
              <div className="rounded-lg border border-feedback-light-warning/30 bg-feedback-light-warning/10 px-4 py-3 dark:border-feedback-dark-warning/30 dark:bg-feedback-dark-warning/10">
                <p className="text-sm text-feedback-light-warning dark:text-feedback-dark-warning">
                  ⚠️ Nenhuma categoria de serviço cadastrada. Cadastre
                  categorias na página de Categorias primeiro.
                </p>
              </div>
            );
          })()}
        </div>

        {/* Preço e Duração */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Preço */}
          <div>
            <CurrencyInput
              label="Preço"
              value={price}
              onChange={setPrice}
              min={0}
              max={10000}
              error={errors.price}
              required
              placeholder="0,00"
              helperText="Valor cobrado do cliente"
            />
          </div>

          {/* Duração */}
          <div>
            <TimeInput
              label="Duração"
              value={durationMinutes}
              onChange={setDurationMinutes}
              min={5}
              max={480}
              step={5}
              error={errors.durationMinutes}
              required
              showFormatted
              helperText="Tempo médio de execução"
            />
          </div>
        </div>

        {/* Comissão */}
        <div>
          <label className="text-theme-primary mb-2 block text-sm font-medium">
            Comissão do Profissional (%)
            <span className="ml-1 text-feedback-light-error dark:text-feedback-dark-error">
              *
            </span>
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              value={commissionPercentage}
              onChange={e =>
                setCommissionPercentage(parseFloat(e.target.value))
              }
              disabled={loading}
              min={0}
              max={100}
              step={5}
              className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-light-surface accent-primary dark:bg-dark-hover"
            />
            <div className="text-theme-primary w-20 rounded-lg border border-light-border bg-light-surface px-3 py-2 text-center font-semibold dark:border-dark-border dark:bg-dark-hover">
              {commissionPercentage}%
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-theme-secondary text-xs">
              Arraste para ajustar a porcentagem
            </p>
            <p className="text-sm font-medium text-feedback-light-success dark:text-feedback-dark-success">
              ={' '}
              {commission.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </p>
          </div>
          {errors.commissionPercentage && (
            <p className="mt-1 text-sm text-feedback-light-error dark:text-feedback-dark-error">
              {errors.commissionPercentage}
            </p>
          )}
        </div>

        {/* Preview/Resumo */}
        <div className="rounded-lg border border-light-border bg-light-surface p-4 dark:border-dark-border dark:bg-dark-hover">
          <h4 className="text-theme-primary mb-4 font-semibold">
            Resumo do Serviço
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-theme-secondary text-sm">
                Preço para o cliente:
              </span>
              <span className="text-lg font-bold text-primary">
                {price.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-theme-secondary text-sm">
                Comissão ({commissionPercentage}%):
              </span>
              <span className="text-lg font-semibold text-feedback-light-success dark:text-feedback-dark-success">
                {commission.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-theme-secondary text-sm">
                Duração estimada:
              </span>
              <span className="text-theme-primary font-medium">
                {durationMinutes >= 60
                  ? `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}min`
                  : `${durationMinutes} min`}
              </span>
            </div>
          </div>
        </div>

        {/* Dicas */}
        <div className="rounded-lg border border-primary/30 bg-primary/10 p-4 dark:border-primary/40 dark:bg-primary/20">
          <div className="flex items-start gap-3">
            <svg
              className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <h4 className="text-theme-primary mb-1 font-semibold">
                Dicas para Precificação
              </h4>
              <ul className="text-theme-secondary space-y-1 text-sm">
                <li>• Considere custos de materiais e tempo de execução</li>
                <li>• A comissão típica varia entre 40% e 60%</li>
                <li>• Revise preços periodicamente conforme o mercado</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-3 border-t border-light-border pt-4 dark:border-dark-border">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="btn-theme-secondary flex-1"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-theme-primary inline-flex flex-1 items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-light-surface border-t-transparent dark:border-dark-surface" />
                Salvando...
              </>
            ) : (
              <>
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {isEditMode ? 'Salvar Alterações' : 'Criar Serviço'}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
ServiceFormModal.propTypes = {
  /** Se o modal está aberto */
  isOpen: PropTypes.bool.isRequired,
  /** Callback ao fechar */
  onClose: PropTypes.func.isRequired,
  /** Callback ao salvar */
  onSave: PropTypes.func.isRequired,
  /** Dados do serviço (para edição) */
  service: PropTypes.shape({
    name: PropTypes.string,
    price: PropTypes.number,
    duration_minutes: PropTypes.number,
    commission_percentage: PropTypes.number,
    category_id: PropTypes.string,
  }),
  /** Modo de operação */
  mode: PropTypes.oneOf(['create', 'edit']),
  /** Estado de carregamento */
  loading: PropTypes.bool,
  /** ID da unidade (obrigatório para criar/editar serviços) */
  unitId: PropTypes.string.isRequired,
};
export default ServiceFormModal;
