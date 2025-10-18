import React, { useState, useEffect } from 'react';
import {
  Target,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Calendar,
  TrendingUp,
  DollarSign,
  Users,
  Package,
  CreditCard,
  BarChart3,
  RefreshCw,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { UnitSelector } from '../../atoms';
import { useGoals } from '../../hooks';
import { useUnit } from '../../context/UnitContext';
import { supabase } from '../../services/supabase';
import { useToast } from '../../context/ToastContext';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Componente para modal de criação/edição de meta
const GoalModal = ({
  isOpen,
  onClose,
  onSave,
  goal = null,
  unitId,
  unitName,
  year,
  month,
}) => {
  const [formData, setFormData] = useState({
    goal_type: 'revenue_general',
    period: 'monthly',
    target_value: '',
    goal_year: year || new Date().getFullYear(),
    goal_month: month || new Date().getMonth() + 1,
    goal_quarter: null,
    is_active: true,
  });

  const [selectedUnitId, setSelectedUnitId] = useState(unitId);
  const [selectedUnitName, setSelectedUnitName] = useState(unitName);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Unidades via contexto global
  const { allUnits, selectedUnit } = useUnit();
  const unitsLoading = false; // carregamento já é tratado no provider

  useEffect(() => {
    if (goal) {
      setFormData({
        goal_type: goal.goal_type,
        period: goal.period,
        target_value: goal.target_value.toString(),
        goal_year: goal.goal_year,
        goal_month: goal.goal_month,
        goal_quarter: goal.goal_quarter,
        is_active: goal.is_active,
      });
    } else {
      setFormData({
        goal_type: 'revenue_general',
        period: 'monthly',
        target_value: '',
        goal_year: year || new Date().getFullYear(),
        goal_month: month || new Date().getMonth() + 1,
        goal_quarter: null,
        is_active: true,
      });
    }
  }, [goal, year, month]);

  // Atualizar unidade selecionada quando as props mudarem
  useEffect(() => {
    setSelectedUnitId(unitId);
    setSelectedUnitName(unitName);
  }, [unitId, unitName]);

  const goalTypes = [
    {
      value: 'revenue_general',
      label: 'Meta de Faturamento Geral',
      icon: DollarSign,
    },
    { value: 'subscription', label: 'Meta de Assinaturas', icon: Users },
    {
      value: 'product_sales',
      label: 'Meta de Venda de Produtos',
      icon: Package,
    },
    { value: 'expenses', label: 'Meta de Despesas', icon: CreditCard },
    { value: 'profit', label: 'Meta de Resultado/Lucro', icon: TrendingUp },
  ];

  const periods = [
    { value: 'monthly', label: 'Mensal' },
    { value: 'quarterly', label: 'Trimestral' },
    { value: 'yearly', label: 'Anual' },
  ];

  const months = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' },
  ];

  const quarters = [
    { value: 1, label: '1º Trimestre (Jan-Mar)' },
    { value: 2, label: '2º Trimestre (Abr-Jun)' },
    { value: 3, label: '3º Trimestre (Jul-Set)' },
    { value: 4, label: '4º Trimestre (Out-Dez)' },
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!selectedUnitId) {
      newErrors.unit = 'Selecione uma unidade';
    }

    const numericValue = parseFloat(
      formData.target_value.toString().replace(',', '.')
    );
    if (!formData.target_value || isNaN(numericValue) || numericValue <= 0) {
      newErrors.target_value = 'Valor da meta deve ser maior que zero';
    }

    if (
      !formData.goal_year ||
      formData.goal_year < 2020 ||
      formData.goal_year > 2030
    ) {
      newErrors.goal_year = 'Ano deve estar entre 2020 e 2030';
    }

    if (formData.period === 'monthly' && !formData.goal_month) {
      newErrors.goal_month = 'Mês é obrigatório para metas mensais';
    }

    if (formData.period === 'quarterly' && !formData.goal_quarter) {
      newErrors.goal_quarter = 'Trimestre é obrigatório para metas trimestrais';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Converte o valor de string BR para número
      const numericValue = parseFloat(
        formData.target_value.toString().replace(',', '.')
      );

      const goalData = {
        unit_id: selectedUnitId, // Usar a unidade selecionada no modal
        goal_type: formData.goal_type,
        period: formData.period,
        target_value: numericValue,
        goal_year: formData.goal_year,
        goal_month: formData.period === 'monthly' ? formData.goal_month : null,
        goal_quarter:
          formData.period === 'quarterly' ? formData.goal_quarter : null,
        is_active: formData.is_active,
      };

      await onSave(goalData);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar meta:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Verificar se há unidade selecionada
  if (!selectedUnitId) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md">
          <div className="p-6 text-center">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Unidade não selecionada
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Selecione uma unidade antes de criar uma meta.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {goal ? 'Editar Meta' : 'Nova Meta'}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {goal
                    ? 'Atualize os dados da meta'
                    : 'Configure uma nova meta financeira'}
                </p>
                <div className="mt-1 text-xs text-blue-600 dark:text-blue-400 font-medium">
                  Unidade: {selectedUnitName || 'Selecione uma unidade'}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Seletor de Unidade */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Unidade
            </label>
            <select
              value={selectedUnitId || ''}
              onChange={e => {
                const unitId = e.target.value;
                const unit =
                  allUnits?.find(u => u.id === unitId) ||
                  (selectedUnit?.id === unitId ? selectedUnit : null);
                setSelectedUnitId(unitId);
                setSelectedUnitName(unit?.name || '');
                // Limpar erro quando selecionar uma unidade
                if (errors.unit) {
                  setErrors(prev => ({ ...prev, unit: null }));
                }
              }}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                errors.unit
                  ? 'border-red-400 dark:border-red-500'
                  : 'border-gray-200 dark:border-gray-600'
              }`}
              disabled={unitsLoading}
            >
              <option value="">
                {unitsLoading
                  ? 'Carregando unidades...'
                  : 'Selecione uma unidade'}
              </option>
              {allUnits?.map(unit => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </select>
            {errors.unit && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.unit}
              </p>
            )}
          </div>

          {/* Tipo de Meta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Tipo de Meta
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {goalTypes.map(type => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    onClick={() => handleInputChange('goal_type', type.value)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      formData.goal_type === type.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {type.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Período */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Período
            </label>
            <div className="grid grid-cols-3 gap-3">
              {periods.map(period => (
                <button
                  key={period.value}
                  onClick={() => handleInputChange('period', period.value)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.period === period.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {period.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Ano */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ano
            </label>
            <input
              type="number"
              value={formData.goal_year}
              onChange={e =>
                handleInputChange('goal_year', parseInt(e.target.value))
              }
              min="2020"
              max="2030"
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                errors.goal_year
                  ? 'border-red-400 dark:border-red-500'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {errors.goal_year && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.goal_year}
              </p>
            )}
          </div>

          {/* Mês (se mensal) */}
          {formData.period === 'monthly' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mês
              </label>
              <select
                value={formData.goal_month}
                onChange={e =>
                  handleInputChange('goal_month', parseInt(e.target.value))
                }
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                  errors.goal_month
                    ? 'border-red-400 dark:border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <option value="">Selecionar mês...</option>
                {months.map(month => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
              {errors.goal_month && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.goal_month}
                </p>
              )}
            </div>
          )}

          {/* Trimestre (se trimestral) */}
          {formData.period === 'quarterly' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Trimestre
              </label>
              <select
                value={formData.goal_quarter}
                onChange={e =>
                  handleInputChange('goal_quarter', parseInt(e.target.value))
                }
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                  errors.goal_quarter
                    ? 'border-red-400 dark:border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <option value="">Selecionar trimestre...</option>
                {quarters.map(quarter => (
                  <option key={quarter.value} value={quarter.value}>
                    {quarter.label}
                  </option>
                ))}
              </select>
              {errors.goal_quarter && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.goal_quarter}
                </p>
              )}
            </div>
          )}

          {/* Valor da Meta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Valor da Meta (R$)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                R$
              </span>
              <input
                type="text"
                value={formData.target_value}
                onChange={e => {
                  // Permite apenas números e vírgula/ponto
                  let value = e.target.value.replace(/[^\d,]/g, '');

                  // Se tem vírgula, garante apenas 2 casas decimais
                  if (value.includes(',')) {
                    const parts = value.split(',');
                    if (parts[1]?.length > 2) {
                      value = `${parts[0]},${parts[1].substring(0, 2)}`;
                    }
                  }

                  handleInputChange('target_value', value);
                }}
                onBlur={e => {
                  // Ao sair do campo, formata com 2 casas decimais
                  let value = e.target.value.replace(/[^\d,]/g, '');
                  if (value) {
                    // Remove vírgulas múltiplas
                    value = value.replace(/,/g, '.');
                    const number = parseFloat(value);
                    if (!isNaN(number)) {
                      handleInputChange(
                        'target_value',
                        number.toFixed(2).replace('.', ',')
                      );
                    }
                  }
                }}
                placeholder="0,00"
                className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                  errors.target_value
                    ? 'border-red-400 dark:border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              />
            </div>
            {errors.target_value && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.target_value}
              </p>
            )}
            {formData.target_value && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Valor:{' '}
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(
                  parseFloat(formData.target_value.replace(',', '.')) || 0
                )}
              </p>
            )}
          </div>

          {/* Status */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={e => handleInputChange('is_active', e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <label
              htmlFor="is_active"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Meta ativa
            </label>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {goal ? 'Atualizar' : 'Criar'} Meta
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente para card de meta
const GoalCard = ({ goal, onEdit, onDelete, onToggleStatus }) => {
  const getGoalTypeInfo = type => {
    const types = {
      revenue_general: {
        label: 'Faturamento Geral',
        icon: DollarSign,
        color: 'bg-green-500',
      },
      subscription: { label: 'Assinaturas', icon: Users, color: 'bg-blue-500' },
      product_sales: {
        label: 'Venda de Produtos',
        icon: Package,
        color: 'bg-purple-500',
      },
      expenses: { label: 'Despesas', icon: CreditCard, color: 'bg-red-500' },
      profit: {
        label: 'Resultado/Lucro',
        icon: TrendingUp,
        color: 'bg-orange-500',
      },
    };
    return types[type] || { label: type, icon: Target, color: 'bg-gray-500' };
  };

  const getPeriodLabel = (period, month, quarter) => {
    if (period === 'monthly' && month) {
      const months = [
        '',
        'Jan',
        'Fev',
        'Mar',
        'Abr',
        'Mai',
        'Jun',
        'Jul',
        'Ago',
        'Set',
        'Out',
        'Nov',
        'Dez',
      ];
      return `${months[month]}/${goal.goal_year}`;
    }
    if (period === 'quarterly' && quarter) {
      return `T${quarter}/${goal.goal_year}`;
    }
    if (period === 'yearly') {
      return goal.goal_year.toString();
    }
    return 'N/A';
  };

  const typeInfo = getGoalTypeInfo(goal.goal_type);
  const Icon = typeInfo.icon;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${typeInfo.color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {typeInfo.label}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {getPeriodLabel(goal.period, goal.goal_month, goal.goal_quarter)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              goal.is_active
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
            }`}
          >
            {goal.is_active ? 'Ativa' : 'Inativa'}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(goal.target_value)}
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Atingido:</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(goal.achieved_value || 0)}
          </span>
        </div>

        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="h-2 rounded-full bg-blue-500 transition-all duration-500"
            style={{
              width: `${Math.min(100, Math.max(0, goal.target_value > 0 ? ((goal.achieved_value || 0) / goal.target_value) * 100 : 0))}%`,
            }}
          ></div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={() => onToggleStatus(goal)}
            className={`p-2 rounded-lg transition-colors ${
              goal.is_active
                ? 'text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
            }`}
            title={goal.is_active ? 'Desativar meta' : 'Ativar meta'}
          >
            {goal.is_active ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => onEdit(goal)}
            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            title="Editar meta"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(goal)}
            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="Excluir meta"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default function GoalsPage() {
  const { selectedUnit, selectUnit, allUnits } = useUnit();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [loading, setLoading] = useState(false);

  const {
    goals,
    loading: goalsLoading,
    refetch,
    createGoal,
    updateGoal,
    deleteGoal,
  } = useGoals(selectedUnit?.id, selectedYear, selectedMonth);
  const { addToast } = useToast();

  // Forçar refetch quando unidade, ano ou mês mudarem
  useEffect(() => {
    if (selectedUnit?.id) {
      refetch();
    }
  }, [selectedUnit?.id, selectedYear, selectedMonth, refetch]);

  // Verificar se há unidade selecionada
  const hasSelectedUnit = !!selectedUnit;

  const handleCreateGoal = async goalData => {
    try {
      const { data, error } = await createGoal(goalData);
      if (error) throw error;

      // Se a meta foi criada para uma unidade diferente, trocar para ela
      if (goalData.unit_id !== selectedUnit?.id) {
        const targetUnit = allUnits?.find(u => u.id === goalData.unit_id);
        if (targetUnit) {
          selectUnit(targetUnit);
        }
      }

      // Se o ano ou mês forem diferentes, ajustar os filtros
      if (goalData.goal_year !== selectedYear) {
        setSelectedYear(goalData.goal_year);
      }
      if (goalData.goal_month && goalData.goal_month !== selectedMonth) {
        setSelectedMonth(goalData.goal_month);
      }

      addToast({
        type: 'success',
        title: 'Meta criada!',
        message: 'A meta foi cadastrada com sucesso.',
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erro ao criar meta',
        message: error.message || 'Não foi possível criar a meta.',
      });
    }
  };

  const handleUpdateGoal = async goalData => {
    try {
      const { data, error } = await updateGoal(editingGoal.id, goalData);
      if (error) throw error;

      addToast({
        type: 'success',
        title: 'Meta atualizada!',
        message: 'A meta foi atualizada com sucesso.',
      });

      refetch();
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erro ao atualizar meta',
        message: error.message || 'Não foi possível atualizar a meta.',
      });
    }
  };

  const handleDeleteGoal = async goal => {
    if (!confirm(`Tem certeza que deseja excluir a meta de ${goal.goal_type}?`))
      return;

    try {
      const { error } = await deleteGoal(goal.id);
      if (error) throw error;

      addToast({
        type: 'success',
        title: 'Meta excluída!',
        message: 'A meta foi excluída com sucesso.',
      });

      refetch();
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erro ao excluir meta',
        message: error.message || 'Não foi possível excluir a meta.',
      });
    }
  };

  const handleToggleStatus = async goal => {
    try {
      const { error } = await updateGoal(goal.id, {
        is_active: !goal.is_active,
      });
      if (error) throw error;

      addToast({
        type: 'success',
        title: 'Status atualizado!',
        message: `A meta foi ${!goal.is_active ? 'ativada' : 'desativada'}.`,
      });

      refetch();
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erro ao atualizar status',
        message:
          error.message || 'Não foi possível atualizar o status da meta.',
      });
    }
  };

  const handleEditGoal = goal => {
    setEditingGoal(goal);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingGoal(null);
  };

  const handleSaveGoal = async goalData => {
    if (editingGoal) {
      await handleUpdateGoal(goalData);
    } else {
      await handleCreateGoal(goalData);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Cadastro de Metas
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Gerencie as metas financeiras por unidade e período
            </p>
          </div>

          <div className="flex items-center gap-4">
            <UnitSelector userId="current-user" />
            {hasSelectedUnit ? (
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nova Meta
              </button>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                Selecione uma unidade para criar metas
              </div>
            )}
          </div>
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Ano
            </label>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - 2 + i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Mês
            </label>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {Array.from({ length: 12 }, (_, i) => {
                const month = i + 1;
                return (
                  <option key={month} value={month}>
                    {format(new Date(2024, i), 'MMMM', { locale: ptBR })}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Metas */}
      {!hasSelectedUnit ? (
        <div className="text-center py-12">
          <Target className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Selecione uma unidade
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Escolha uma unidade no seletor acima para visualizar e gerenciar
            suas metas.
          </p>
        </div>
      ) : goalsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 animate-pulse"
            >
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      ) : goals.length === 0 ? (
        <div className="text-center py-12">
          <Target className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Nenhuma meta cadastrada para {selectedUnit?.name}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Comece criando sua primeira meta financeira para esta unidade.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Criar primeira meta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map(goal => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={handleEditGoal}
              onDelete={handleDeleteGoal}
              onToggleStatus={handleToggleStatus}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <GoalModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveGoal}
        goal={editingGoal}
        unitId={selectedUnit?.id}
        unitName={selectedUnit?.name}
        year={selectedYear}
        month={selectedMonth}
      />
    </div>
  );
}
