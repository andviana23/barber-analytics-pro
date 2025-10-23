/**
 * 🎯 GoalsPage.jsx
 *
 * Página de cadastro e gerenciamento de metas financeiras
 * ✅ 100% Design System (gradientes premium, validação, feedback)
 * ✅ Integração com view vw_goals_detailed (Supabase)
 * ✅ Cards interativos com progresso visual
 * ✅ Modal premium com validação em tempo real
 *
 * @author Barber Analytics Pro - Andrey Viana
 * @date 2025-10-22
 */

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
  Loader2,
  Award,
  TrendingDown,
  Info,
  Sparkles,
} from 'lucide-react';
import { UnitSelector } from '../../atoms';
import { useGoals } from '../../hooks';
import { useUnit } from '../../context/UnitContext';
import { supabase } from '../../services/supabase';
import { useToast } from '../../context/ToastContext';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// 🎨 Componente para modal de criação/edição de meta (100% Design System)
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
  const { showSuccess, showError } = useToast();

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
  const unitsLoading = false;

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

  useEffect(() => {
    setSelectedUnitId(unitId);
    setSelectedUnitName(unitName);
  }, [unitId, unitName]);

  // 🎯 Configuração dos tipos de metas com cores e ícones
  const goalTypes = [
    {
      value: 'revenue_general',
      label: 'Faturamento Geral',
      icon: DollarSign,
      gradient: 'from-green-600 to-emerald-600',
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-500',
      text: 'text-green-600 dark:text-green-400',
    },
    {
      value: 'subscription',
      label: 'Assinaturas',
      icon: Users,
      gradient: 'from-blue-600 to-indigo-600',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-500',
      text: 'text-blue-600 dark:text-blue-400',
    },
    {
      value: 'product_sales',
      label: 'Venda de Produtos',
      icon: Package,
      gradient: 'from-purple-600 to-pink-600',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      border: 'border-purple-500',
      text: 'text-purple-600 dark:text-purple-400',
    },
    {
      value: 'expenses',
      label: 'Despesas',
      icon: CreditCard,
      gradient: 'from-red-600 to-rose-600',
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-500',
      text: 'text-red-600 dark:text-red-400',
    },
    {
      value: 'profit',
      label: 'Resultado/Lucro',
      icon: TrendingUp,
      gradient: 'from-orange-600 to-amber-600',
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      border: 'border-orange-500',
      text: 'text-orange-600 dark:text-orange-400',
    },
  ];

  const periods = [
    { value: 'monthly', label: 'Mensal', icon: Calendar },
    { value: 'quarterly', label: 'Trimestral', icon: BarChart3 },
    { value: 'yearly', label: 'Anual', icon: Target },
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
    { value: 1, label: '1º Trimestre', period: 'Jan-Mar' },
    { value: 2, label: '2º Trimestre', period: 'Abr-Jun' },
    { value: 3, label: '3º Trimestre', period: 'Jul-Set' },
    { value: 4, label: '4º Trimestre', period: 'Out-Dez' },
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
    if (!validateForm()) {
      showError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setLoading(true);
    try {
      const numericValue = parseFloat(
        formData.target_value.toString().replace(',', '.')
      );

      const goalData = {
        unit_id: selectedUnitId,
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

      showSuccess(
        `Meta ${goal ? 'atualizada' : 'criada'} com sucesso! ${goalTypes.find(t => t.value === formData.goal_type)?.label}`
      );

      onClose();
    } catch (error) {
      console.error('Erro ao salvar meta:', error);
      showError(error.message || 'Erro ao salvar meta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Alerta se não houver unidade selecionada
  if (!selectedUnitId) {
    return (
      <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-100 dark:border-gray-700 w-full max-w-md shadow-2xl">
          <div className="p-8 text-center">
            <div className="p-4 bg-gradient-to-br from-red-500 to-rose-500 rounded-2xl w-20 h-20 mx-auto mb-6 flex items-center justify-center shadow-lg shadow-red-500/30">
              <AlertCircle className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Unidade Necessária
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
              Selecione uma unidade no topo da página antes de criar uma meta.
            </p>
            <button
              onClick={onClose}
              className="w-full px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all font-semibold shadow-lg shadow-gray-500/30"
            >
              Entendi
            </button>
          </div>
        </div>
      </div>
    );
  }

  const selectedGoalType = goalTypes.find(t => t.value === formData.goal_type);

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-100 dark:border-gray-700 w-full max-w-3xl my-8 mx-auto flex flex-col max-h-[calc(100vh-4rem)] shadow-2xl">
        {/* 🎨 Header com gradiente dinâmico */}
        <div
          className={`relative px-6 py-6 border-b-2 border-gray-100 dark:border-gray-700 flex items-center justify-between flex-shrink-0 bg-gradient-to-r ${selectedGoalType?.gradient || 'from-blue-600 to-indigo-600'} rounded-t-2xl`}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
              <Target className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-wide">
                {goal ? '✏️ Editar Meta' : '✨ Nova Meta'}
              </h2>
              <p className="text-sm text-white/80 mt-1">
                {goal
                  ? 'Atualize os parâmetros da meta'
                  : 'Configure uma nova meta financeira'}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg">
                  <span className="text-xs font-bold text-white">
                    📍 {selectedUnitName || 'Unidade não selecionada'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 📋 Corpo do Modal - Formulário Premium */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 min-h-0">
          {/* 🏢 Seletor de Unidade */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
              <Award className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              Unidade *
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
                if (errors.unit) {
                  setErrors(prev => ({ ...prev, unit: null }));
                }
              }}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium ${
                errors.unit
                  ? 'border-red-400 dark:border-red-500'
                  : 'border-gray-200 dark:border-gray-600'
              }`}
              disabled={unitsLoading}
            >
              <option value="">
                {unitsLoading
                  ? '⏳ Carregando unidades...'
                  : '📍 Selecione uma unidade'}
              </option>
              {allUnits?.map(unit => (
                <option key={unit.id} value={unit.id}>
                  🏢 {unit.name}
                </option>
              ))}
            </select>
            {errors.unit && (
              <div className="flex items-center gap-1.5 mt-2">
                <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                  {errors.unit}
                </p>
              </div>
            )}
          </div>

          {/* 🎯 Tipo de Meta - Cards Premium */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
              <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Tipo de Meta *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {goalTypes.map(type => {
                const Icon = type.icon;
                const isSelected = formData.goal_type === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleInputChange('goal_type', type.value)}
                    className={`group p-4 rounded-xl border-2 transition-all duration-300 ${
                      isSelected
                        ? `${type.border} ${type.bg} shadow-lg`
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg transition-all ${
                          isSelected
                            ? `bg-gradient-to-r ${type.gradient} shadow-md`
                            : 'bg-gray-100 dark:bg-gray-700 group-hover:scale-110'
                        }`}
                      >
                        <Icon
                          className={`w-5 h-5 ${
                            isSelected
                              ? 'text-white'
                              : 'text-gray-600 dark:text-gray-400'
                          }`}
                        />
                      </div>
                      <span
                        className={`text-sm font-semibold ${
                          isSelected
                            ? type.text
                            : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        {type.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 📅 Período - Pills Interativos */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
              <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Período *
            </label>
            <div className="grid grid-cols-3 gap-3">
              {periods.map(period => {
                const PeriodIcon = period.icon;
                const isSelected = formData.period === period.value;
                return (
                  <button
                    key={period.value}
                    type="button"
                    onClick={() => handleInputChange('period', period.value)}
                    className={`group p-3 rounded-xl border-2 transition-all duration-300 ${
                      isSelected
                        ? 'border-indigo-500 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/30 dark:to-blue-900/30 shadow-lg'
                        : 'border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-md'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <PeriodIcon
                        className={`w-5 h-5 transition-all ${
                          isSelected
                            ? 'text-indigo-600 dark:text-indigo-400 scale-110'
                            : 'text-gray-500 dark:text-gray-400 group-hover:scale-110'
                        }`}
                      />
                      <span
                        className={`text-sm font-semibold ${
                          isSelected
                            ? 'text-indigo-700 dark:text-indigo-300'
                            : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        {period.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 📆 Ano + Mês/Trimestre (Grid 2 colunas) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ano */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                Ano *
              </label>
              <input
                type="number"
                value={formData.goal_year}
                onChange={e =>
                  handleInputChange('goal_year', parseInt(e.target.value))
                }
                min="2020"
                max="2030"
                placeholder="2025"
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-semibold text-lg ${
                  errors.goal_year
                    ? 'border-red-400 dark:border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.goal_year && (
                <div className="flex items-center gap-1.5 mt-2">
                  <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                    {errors.goal_year}
                  </p>
                </div>
              )}
            </div>

            {/* Mês (se mensal) */}
            {formData.period === 'monthly' && (
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  <Calendar className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  Mês *
                </label>
                <select
                  value={formData.goal_month}
                  onChange={e =>
                    handleInputChange('goal_month', parseInt(e.target.value))
                  }
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium ${
                    errors.goal_month
                      ? 'border-red-400 dark:border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <option value="">📅 Selecionar mês...</option>
                  {months.map(month => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
                {errors.goal_month && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                    <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                      {errors.goal_month}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Trimestre (se trimestral) */}
            {formData.period === 'quarterly' && (
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  <BarChart3 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  Trimestre *
                </label>
                <select
                  value={formData.goal_quarter}
                  onChange={e =>
                    handleInputChange('goal_quarter', parseInt(e.target.value))
                  }
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium ${
                    errors.goal_quarter
                      ? 'border-red-400 dark:border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <option value="">📊 Selecionar trimestre...</option>
                  {quarters.map(quarter => (
                    <option key={quarter.value} value={quarter.value}>
                      {quarter.label} ({quarter.period})
                    </option>
                  ))}
                </select>
                {errors.goal_quarter && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                    <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                      {errors.goal_quarter}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 💰 Valor da Meta */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
              <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
              Valor da Meta *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-green-600 dark:text-green-400 font-bold text-lg">
                R$
              </span>
              <input
                type="text"
                value={formData.target_value}
                onChange={e => {
                  let value = e.target.value.replace(/[^\d,]/g, '');
                  if (value.includes(',')) {
                    const parts = value.split(',');
                    if (parts[1]?.length > 2) {
                      value = `${parts[0]},${parts[1].substring(0, 2)}`;
                    }
                  }
                  handleInputChange('target_value', value);
                }}
                onBlur={e => {
                  let value = e.target.value.replace(/[^\d,]/g, '');
                  if (value) {
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
                className={`w-full pl-14 pr-4 py-4 border-2 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xl font-bold ${
                  errors.target_value
                    ? 'border-red-400 dark:border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              />
            </div>
            {errors.target_value && (
              <div className="flex items-center gap-1.5 mt-2">
                <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                  {errors.target_value}
                </p>
              </div>
            )}
            {formData.target_value && (
              <div className="mt-2 p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm font-bold text-green-700 dark:text-green-300">
                  💰 Meta Total:{' '}
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(
                    parseFloat(formData.target_value.replace(',', '.')) || 0
                  )}
                </p>
              </div>
            )}
          </div>

          {/* ✅ Status Ativo/Inativo */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={e => handleInputChange('is_active', e.target.checked)}
              className="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 rounded-lg focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer transition-all"
            />
            <label
              htmlFor="is_active"
              className="text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
              Meta ativa (visível nos relatórios)
            </label>
          </div>
        </div>

        {/* 🎯 Footer com Botões Gradientes */}
        <div className="px-6 py-4 border-t-2 border-gray-100 dark:border-gray-700 flex justify-end gap-3 flex-shrink-0 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 text-gray-700 dark:text-gray-300 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all font-medium disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className={`px-6 py-2.5 bg-gradient-to-r ${selectedGoalType?.gradient || 'from-blue-600 to-indigo-600'} text-white rounded-xl hover:opacity-90 disabled:opacity-50 transition-all font-semibold flex items-center gap-2 shadow-lg ${selectedGoalType ? 'shadow-' + selectedGoalType.value.split('_')[0] + '-500/30' : 'shadow-blue-500/30'}`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                {goal ? (
                  <Edit className="w-4 h-4" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {goal ? 'Atualizar Meta' : 'Criar Meta'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// 🎯 Componente para card de meta (100% Design System)
const GoalCard = ({ goal, onEdit, onDelete, onToggleStatus }) => {
  // Debug: verificar dados recebidos
  React.useEffect(() => {
    console.log('📊 GoalCard - Dados da meta:', {
      type: goal.goal_type,
      target: goal.target_value,
      achieved: goal.achieved_value,
      percentage:
        goal.target_value > 0
          ? ((goal.achieved_value || 0) / goal.target_value) * 100
          : 0,
    });
  }, [goal]);

  const getGoalTypeInfo = type => {
    const types = {
      revenue_general: {
        label: 'Faturamento Geral',
        icon: DollarSign,
        gradient: 'from-green-600 to-emerald-600',
        bg: 'bg-green-50 dark:bg-green-900/20',
        text: 'text-green-700 dark:text-green-300',
        progress: 'from-green-500 to-emerald-500',
      },
      subscription: {
        label: 'Assinaturas',
        icon: Users,
        gradient: 'from-blue-600 to-indigo-600',
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        text: 'text-blue-700 dark:text-blue-300',
        progress: 'from-blue-500 to-indigo-500',
      },
      product_sales: {
        label: 'Venda de Produtos',
        icon: Package,
        gradient: 'from-purple-600 to-pink-600',
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        text: 'text-purple-700 dark:text-purple-300',
        progress: 'from-purple-500 to-pink-500',
      },
      expenses: {
        label: 'Despesas',
        icon: CreditCard,
        gradient: 'from-red-600 to-rose-600',
        bg: 'bg-red-50 dark:bg-red-900/20',
        text: 'text-red-700 dark:text-red-300',
        progress: 'from-red-500 to-rose-500',
      },
      profit: {
        label: 'Resultado/Lucro',
        icon: TrendingUp,
        gradient: 'from-orange-600 to-amber-600',
        bg: 'bg-orange-50 dark:bg-orange-900/20',
        text: 'text-orange-700 dark:text-orange-300',
        progress: 'from-orange-500 to-amber-500',
      },
    };
    return (
      types[type] || {
        label: type,
        icon: Target,
        gradient: 'from-gray-600 to-gray-700',
        bg: 'bg-gray-50 dark:bg-gray-900/20',
        text: 'text-gray-700 dark:text-gray-300',
        progress: 'from-gray-500 to-gray-600',
      }
    );
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

  // Calcular percentual de atingimento
  const percentage = Math.min(
    100,
    Math.max(
      0,
      goal.target_value > 0
        ? ((goal.achieved_value || 0) / goal.target_value) * 100
        : 0
    )
  );

  const isAchieved = percentage >= 100;

  return (
    <div className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-2xl hover:shadow-gray-300/50 dark:hover:shadow-gray-900/50 transition-all duration-300">
      {/* 🎨 Header com gradiente dinâmico */}
      <div className={`bg-gradient-to-r ${typeInfo.gradient} p-5`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg group-hover:scale-110 transition-transform">
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg tracking-wide">
                {typeInfo.label}
              </h3>
              <p className="text-sm text-white/80 font-medium">
                📅{' '}
                {getPeriodLabel(
                  goal.period,
                  goal.goal_month,
                  goal.goal_quarter
                )}
              </p>
            </div>
          </div>

          {/* Badge de status premium */}
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm ${
                goal.is_active
                  ? 'bg-white/30 text-white border border-white/50'
                  : 'bg-black/20 text-white/70 border border-white/30'
              }`}
            >
              {goal.is_active ? '✓ Ativa' : '○ Inativa'}
            </span>
          </div>
        </div>
      </div>

      {/* 💰 Body com valores e progresso */}
      <div className="p-6 space-y-4">
        {/* Valor da meta */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              🎯 Meta
            </p>
            <div className="text-3xl font-black text-gray-900 dark:text-white">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(goal.target_value)}
            </div>
          </div>

          {/* Badge de atingimento */}
          {isAchieved && (
            <div className="px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl shadow-lg animate-pulse">
              <div className="flex items-center gap-1.5">
                <Award className="w-5 h-5" />
                <span className="text-sm font-bold">META ATINGIDA!</span>
              </div>
            </div>
          )}
        </div>

        {/* Valor atingido */}
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/30 rounded-xl">
          <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
            💎 Atingido:
          </span>
          <span className="text-lg font-black text-gray-900 dark:text-white">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(goal.achieved_value || 0)}
          </span>
        </div>

        {/* Barra de progresso com gradiente */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              Progresso
            </span>
            <span
              className={`font-black text-lg ${
                percentage >= 100
                  ? 'text-green-600 dark:text-green-400'
                  : percentage >= 75
                    ? 'text-blue-600 dark:text-blue-400'
                    : percentage >= 50
                      ? 'text-orange-600 dark:text-orange-400'
                      : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {percentage.toFixed(1)}%
            </span>
          </div>

          <div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden shadow-inner">
            <div
              className={`h-3 rounded-full bg-gradient-to-r ${typeInfo.progress} transition-all duration-700 ease-out shadow-lg relative`}
              style={{ width: `${percentage}%` }}
            >
              {/* Brilho animado */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => onToggleStatus(goal)}
            className={`group/btn p-2.5 rounded-xl transition-all duration-300 ${
              goal.is_active
                ? 'text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:shadow-lg hover:shadow-orange-500/30'
                : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 hover:shadow-lg hover:shadow-green-500/30'
            }`}
            title={goal.is_active ? 'Desativar meta' : 'Ativar meta'}
          >
            {goal.is_active ? (
              <AlertCircle className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
            ) : (
              <CheckCircle className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
            )}
          </button>

          <button
            onClick={() => onEdit(goal)}
            className="group/btn p-2.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/30"
            title="Editar meta"
          >
            <Edit className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
          </button>

          <button
            onClick={() => onDelete(goal)}
            className="group/btn p-2.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-red-500/30"
            title="Excluir meta"
          >
            <Trash2 className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 p-6">
      {/* 🎨 Header Premium com gradiente */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                <Target className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                  🎯 Cadastro de Metas
                </h1>
                <p className="text-base text-gray-600 dark:text-gray-400 font-medium">
                  Gerencie as metas financeiras por unidade e período
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-1">
              <UnitSelector userId="current-user" />
            </div>
            {hasSelectedUnit ? (
              <button
                onClick={() => setIsModalOpen(true)}
                className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 font-bold hover:scale-105"
              >
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                Nova Meta
              </button>
            ) : (
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 px-5 py-3 bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl">
                <Info className="w-4 h-4" />
                Selecione uma unidade para criar metas
              </div>
            )}
          </div>
        </div>

        {/* 🔍 Filtros Premium */}
        <div className="flex items-center gap-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Filtrar por:
          </div>

          <div className="flex-1 grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="w-4 h-4 text-teal-600" />
                Ano
              </label>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(parseInt(e.target.value))}
                className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-semibold hover:border-indigo-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - 2 + i;
                  return (
                    <option key={year} value={year}>
                      📅 {year}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="w-4 h-4 text-cyan-600" />
                Mês
              </label>
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(parseInt(e.target.value))}
                className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-semibold hover:border-indigo-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              >
                {Array.from({ length: 12 }, (_, i) => {
                  const month = i + 1;
                  const monthName = format(new Date(2024, i), 'MMMM', {
                    locale: ptBR,
                  });
                  return (
                    <option key={month} value={month}>
                      {monthName.charAt(0).toUpperCase() + monthName.slice(1)}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 📊 Lista de Metas com Estados Premium */}
      {!hasSelectedUnit ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl inline-block mb-6">
            <Target className="w-20 h-20 text-blue-500 dark:text-blue-400" />
          </div>
          <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3">
            🏢 Selecione uma unidade
          </h3>
          <p className="text-base text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Escolha uma unidade no seletor acima para visualizar e gerenciar
            suas metas financeiras.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Info className="w-4 h-4" />
            <span>Você pode criar metas personalizadas para cada unidade</span>
          </div>
        </div>
      ) : goalsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-lg"
            >
              {/* Header skeleton com gradiente animado */}
              <div className="h-28 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 animate-pulse"></div>

              {/* Body skeleton */}
              <div className="p-6 space-y-4">
                <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                <div className="h-10 w-40 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                <div className="flex gap-2 pt-3">
                  <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
                  <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
                  <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : goals.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border-2 border-dashed border-indigo-300 dark:border-indigo-600">
          <div className="relative inline-block mb-6">
            <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl">
              <Target className="w-20 h-20 text-indigo-500 dark:text-indigo-400" />
            </div>
            <div className="absolute -top-2 -right-2 p-2 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full shadow-lg animate-bounce">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          </div>

          <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3">
            📈 Nenhuma meta cadastrada
          </h3>
          <p className="text-base text-gray-600 dark:text-gray-400 mb-2 font-medium">
            {selectedUnit?.name}
          </p>
          <p className="text-base text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
            Comece criando sua primeira meta financeira para esta unidade e
            acompanhe o progresso em tempo real.
          </p>

          <button
            onClick={() => setIsModalOpen(true)}
            className="group inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-2xl hover:shadow-indigo-500/50 transition-all duration-300 font-bold hover:scale-105"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            Criar primeira meta
          </button>

          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Faturamento</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Assinaturas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Produtos</span>
            </div>
          </div>
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
