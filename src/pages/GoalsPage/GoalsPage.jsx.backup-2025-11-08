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
      gradient: 'bg-gradient-success',
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-500',
      text: 'text-green-600 dark:text-green-400',
    },
    {
      value: 'subscription',
      label: 'Assinaturas',
      icon: Users,
      gradient: 'bg-gradient-primary',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-500',
      text: 'text-blue-600 dark:text-blue-400',
    },
    {
      value: 'product_sales',
      label: 'Venda de Produtos',
      icon: Package,
      gradient: 'bg-gradient-secondary',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      border: 'border-purple-500',
      text: 'text-purple-600 dark:text-purple-400',
    },
    {
      value: 'expenses',
      label: 'Despesas',
      icon: CreditCard,
      gradient: 'bg-gradient-danger',
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-500',
      text: 'text-red-600 dark:text-red-400',
    },
    {
      value: 'profit',
      label: 'Resultado/Lucro',
      icon: TrendingUp,
      gradient: 'bg-gradient-warning',
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      border: 'border-orange-500',
      text: 'text-orange-600 dark:text-orange-400',
    },
  ];
  const periods = [
    {
      value: 'monthly',
      label: 'Mensal',
      icon: Calendar,
    },
    {
      value: 'quarterly',
      label: 'Trimestral',
      icon: BarChart3,
    },
    {
      value: 'yearly',
      label: 'Anual',
      icon: Target,
    },
  ];
  const months = [
    {
      value: 1,
      label: 'Janeiro',
    },
    {
      value: 2,
      label: 'Fevereiro',
    },
    {
      value: 3,
      label: 'Março',
    },
    {
      value: 4,
      label: 'Abril',
    },
    {
      value: 5,
      label: 'Maio',
    },
    {
      value: 6,
      label: 'Junho',
    },
    {
      value: 7,
      label: 'Julho',
    },
    {
      value: 8,
      label: 'Agosto',
    },
    {
      value: 9,
      label: 'Setembro',
    },
    {
      value: 10,
      label: 'Outubro',
    },
    {
      value: 11,
      label: 'Novembro',
    },
    {
      value: 12,
      label: 'Dezembro',
    },
  ];
  const quarters = [
    {
      value: 1,
      label: '1º Trimestre',
      period: 'Jan-Mar',
    },
    {
      value: 2,
      label: '2º Trimestre',
      period: 'Abr-Jun',
    },
    {
      value: 3,
      label: '3º Trimestre',
      period: 'Jul-Set',
    },
    {
      value: 4,
      label: '4º Trimestre',
      period: 'Out-Dez',
    },
  ];
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null,
      }));
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm dark:bg-black/70">
        <div className="card-theme w-full max-w-md rounded-2xl border-2 border-light-border shadow-2xl dark:border-dark-border dark:bg-dark-surface">
          <div className="p-8 text-center">
            <div className="bg-gradient-danger mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl p-4 shadow-lg shadow-red-500/30">
              <AlertCircle className="text-dark-text-primary h-10 w-10" />
            </div>
            <h3 className="text-theme-primary dark:text-dark-text-primary mb-3 text-2xl font-bold">
              Unidade Necessária
            </h3>
            <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mb-8 leading-relaxed">
              Selecione uma unidade no topo da página antes de criar uma meta.
            </p>
            <button
              onClick={onClose}
              className="bg-gradient-secondary text-dark-text-primary w-full rounded-xl px-6 py-3 font-semibold shadow-lg transition-all"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm dark:bg-black/70">
      <div className="card-theme mx-auto my-8 flex max-h-[calc(100vh-4rem)] w-full max-w-3xl flex-col rounded-2xl border-2 border-light-border shadow-2xl dark:border-dark-border dark:bg-dark-surface">
        {/* 🎨 Header com gradiente dinâmico */}
        <div
          className={`relative flex flex-shrink-0 items-center justify-between border-b-2 border-light-border bg-gradient-to-r px-6 py-6 dark:border-gray-700 ${selectedGoalType?.gradient || 'bg-gradient-primary'} rounded-t-2xl`}
        >
          <div className="flex items-center gap-4">
            <div className="card-theme/20 rounded-xl p-3 shadow-lg backdrop-blur-sm">
              <Target className="text-dark-text-primary h-7 w-7" />
            </div>
            <div>
              <h2 className="text-dark-text-primary text-2xl font-bold tracking-wide">
                {goal ? '✏️ Editar Meta' : '✨ Nova Meta'}
              </h2>
              <p className="text-dark-text-primary/80 mt-1 text-sm">
                {goal
                  ? 'Atualize os parâmetros da meta'
                  : 'Configure uma nova meta financeira'}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <div className="card-theme/20 rounded-lg px-3 py-1 backdrop-blur-sm">
                  <span className="text-dark-text-primary text-xs font-bold">
                    📍 {selectedUnitName || 'Unidade não selecionada'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-dark-text-primary/80 hover:text-dark-text-primary hover:card-theme/20 rounded-xl p-2 transition-all"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* 📋 Corpo do Modal - Formulário Premium */}
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-6">
          {/* 🏢 Seletor de Unidade */}
          <div>
            <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 dark:text-gray-300 dark:text-gray-600">
              <Award className="h-4 w-4 text-purple-600 dark:text-purple-400" />
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
                  setErrors(prev => ({
                    ...prev,
                    unit: null,
                  }));
                }
              }}
              className={`w-full rounded-xl border-2 bg-white px-4 py-3 font-medium text-gray-900 transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 dark:bg-gray-700 dark:text-white ${errors.unit ? 'border-red-400 dark:border-red-500' : 'border-gray-200 dark:border-gray-600'}`}
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
              <div className="mt-2 flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                <p className="text-xs font-medium text-red-600 dark:text-red-400">
                  {errors.unit}
                </p>
              </div>
            )}
          </div>

          {/* 🎯 Tipo de Meta - Cards Premium */}
          <div>
            <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 dark:text-gray-300 dark:text-gray-600">
              <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              Tipo de Meta *
            </label>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {goalTypes.map(type => {
                const Icon = type.icon;
                const isSelected = formData.goal_type === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleInputChange('goal_type', type.value)}
                    className={`group rounded-xl border-2 p-4 transition-all duration-300 ${isSelected ? `${type.border} ${type.bg} shadow-lg` : 'border-gray-200 hover:border-gray-300 hover:shadow-md dark:border-gray-600 dark:hover:border-gray-500'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`rounded-lg p-2 transition-all ${isSelected ? `bg-gradient-to-r ${type.gradient} shadow-md` : 'bg-gray-100 group-hover:scale-110 dark:bg-gray-700'}`}
                      >
                        <Icon
                          className={`h-5 w-5 ${isSelected ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}
                        />
                      </div>
                      <span
                        className={`text-sm font-semibold ${isSelected ? type.text : 'text-gray-900 dark:text-white'}`}
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
            <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 dark:text-gray-300 dark:text-gray-600">
              <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
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
                    className={`group rounded-xl border-2 p-3 transition-all duration-300 ${isSelected ? 'border-indigo-500 bg-indigo-50 shadow-lg dark:bg-indigo-900/30' : 'border-gray-200 hover:border-indigo-300 hover:shadow-md dark:border-gray-600 dark:hover:border-indigo-500'}`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <PeriodIcon
                        className={`h-5 w-5 transition-all ${isSelected ? 'scale-110 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 group-hover:scale-110 dark:text-gray-400'}`}
                      />
                      <span
                        className={`text-sm font-semibold ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-900 dark:text-white'}`}
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Ano */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 dark:text-gray-300 dark:text-gray-600">
                <Calendar className="h-4 w-4 text-teal-600 dark:text-teal-400" />
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
                className={`w-full rounded-xl border-2 bg-white px-4 py-3 text-lg font-semibold text-gray-900 transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 dark:bg-gray-700 dark:text-white ${errors.goal_year ? 'border-red-400 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
              />
              {errors.goal_year && (
                <div className="mt-2 flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                  <p className="text-xs font-medium text-red-600 dark:text-red-400">
                    {errors.goal_year}
                  </p>
                </div>
              )}
            </div>

            {/* Mês (se mensal) */}
            {formData.period === 'monthly' && (
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 dark:text-gray-300 dark:text-gray-600">
                  <Calendar className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                  Mês *
                </label>
                <select
                  value={formData.goal_month}
                  onChange={e =>
                    handleInputChange('goal_month', parseInt(e.target.value))
                  }
                  className={`w-full rounded-xl border-2 bg-white px-4 py-3 font-medium text-gray-900 transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 dark:bg-gray-700 dark:text-white ${errors.goal_month ? 'border-red-400 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                >
                  <option value="">📅 Selecionar mês...</option>
                  {months.map(month => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
                {errors.goal_month && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                    <p className="text-xs font-medium text-red-600 dark:text-red-400">
                      {errors.goal_month}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Trimestre (se trimestral) */}
            {formData.period === 'quarterly' && (
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 dark:text-gray-300 dark:text-gray-600">
                  <BarChart3 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  Trimestre *
                </label>
                <select
                  value={formData.goal_quarter}
                  onChange={e =>
                    handleInputChange('goal_quarter', parseInt(e.target.value))
                  }
                  className={`w-full rounded-xl border-2 bg-white px-4 py-3 font-medium text-gray-900 transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 dark:bg-gray-700 dark:text-white ${errors.goal_quarter ? 'border-red-400 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                >
                  <option value="">📊 Selecionar trimestre...</option>
                  {quarters.map(quarter => (
                    <option key={quarter.value} value={quarter.value}>
                      {quarter.label} ({quarter.period})
                    </option>
                  ))}
                </select>
                {errors.goal_quarter && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                    <p className="text-xs font-medium text-red-600 dark:text-red-400">
                      {errors.goal_quarter}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 💰 Valor da Meta */}
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 dark:text-gray-300 dark:text-gray-600">
              <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
              Valor da Meta *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-green-600 dark:text-green-400">
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
                className={`w-full rounded-xl border-2 bg-white py-4 pl-14 pr-4 text-xl font-bold text-gray-900 transition-all focus:border-green-500 focus:ring-4 focus:ring-green-500/20 dark:bg-gray-700 dark:text-white ${errors.target_value ? 'border-red-400 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
              />
            </div>
            {errors.target_value && (
              <div className="mt-2 flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                <p className="text-xs font-medium text-red-600 dark:text-red-400">
                  {errors.target_value}
                </p>
              </div>
            )}
            {formData.target_value && (
              <div className="mt-2 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
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
          <div className="flex items-center gap-3 rounded-xl border border-light-border bg-light-bg p-4 dark:border-dark-border dark:bg-dark-bg dark:bg-gray-700/50">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={e => handleInputChange('is_active', e.target.checked)}
              className="card-theme h-5 w-5 cursor-pointer rounded-lg border-light-border text-green-600 transition-all focus:ring-2 focus:ring-green-500 dark:border-dark-border dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-green-600"
            />
            <label
              htmlFor="is_active"
              className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 dark:text-gray-600"
            >
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              Meta ativa (visível nos relatórios)
            </label>
          </div>
        </div>

        {/* 🎯 Footer com Botões Gradientes */}
        <div className="flex flex-shrink-0 justify-end gap-3 rounded-b-2xl border-t-2 border-light-border bg-light-bg px-6 py-4 dark:border-dark-border dark:bg-dark-bg dark:bg-dark-surface/50">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="hover:card-theme rounded-xl border-2 border-light-border px-5 py-2.5 font-medium text-gray-700 transition-all disabled:opacity-50 dark:border-dark-border dark:text-gray-300 dark:text-gray-600 dark:hover:bg-gray-700"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className={`bg-gradient-to-r px-6 py-2.5 ${selectedGoalType?.gradient || 'bg-gradient-primary'} flex items-center gap-2 rounded-xl font-semibold text-white shadow-lg transition-all hover:opacity-90 disabled:opacity-50`}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                {goal ? (
                  <Edit className="h-4 w-4" />
                ) : (
                  <Sparkles className="h-4 w-4" />
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
    <div className="card-theme group overflow-hidden rounded-2xl border border-light-border transition-all duration-300 hover:shadow-2xl hover:shadow-gray-300/50 dark:border-dark-border dark:bg-dark-surface dark:hover:shadow-gray-900/50">
      {/* 🎨 Header com gradiente dinâmico */}
      <div className={`bg-gradient-to-r ${typeInfo.gradient} p-5`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="card-theme/20 rounded-xl p-2.5 shadow-lg backdrop-blur-sm transition-transform group-hover:scale-110">
              <Icon className="text-dark-text-primary h-6 w-6" />
            </div>
            <div>
              <h3 className="text-dark-text-primary text-lg font-bold tracking-wide">
                {typeInfo.label}
              </h3>
              <p className="text-dark-text-primary/80 text-sm font-medium">
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
              className={`rounded-full px-3 py-1.5 text-xs font-bold shadow-lg backdrop-blur-sm ${goal.is_active ? 'border border-white/50 bg-white/30 text-white' : 'border border-white/30 bg-black/20 text-white/70'}`}
            >
              {goal.is_active ? '✓ Ativa' : '○ Inativa'}
            </span>
          </div>
        </div>
      </div>

      {/* 💰 Body com valores e progresso */}
      <div className="space-y-4 p-6">
        {/* Valor da meta */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mb-1 text-xs font-semibold uppercase tracking-wider">
              🎯 Meta
            </p>
            <div className="text-theme-primary dark:text-dark-text-primary text-3xl font-black">
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
            <div className="text-dark-text-primary animate-pulse rounded-xl bg-gradient-success bg-gradient-to-r px-3 py-2 shadow-lg">
              <div className="flex items-center gap-1.5">
                <Award className="h-5 w-5" />
                <span className="text-sm font-bold">META ATINGIDA!</span>
              </div>
            </div>
          )}
        </div>

        {/* Valor atingido */}
        <div className="flex items-center justify-between rounded-xl bg-light-bg p-3 dark:bg-dark-bg dark:bg-dark-surface/30">
          <span className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm font-semibold">
            💎 Atingido:
          </span>
          <span className="text-theme-primary dark:text-dark-text-primary text-lg font-black">
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
            <span className="font-semibold text-gray-700 dark:text-gray-300 dark:text-gray-600">
              Progresso
            </span>
            <span
              className={`text-lg font-black ${percentage >= 100 ? 'text-green-600 dark:text-green-400' : percentage >= 75 ? 'text-blue-600 dark:text-blue-400' : percentage >= 50 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-600 dark:text-gray-400'}`}
            >
              {percentage.toFixed(1)}%
            </span>
          </div>

          <div className="relative h-3 w-full overflow-hidden rounded-full bg-gray-200 shadow-inner dark:bg-gray-700">
            <div
              className={`h-3 rounded-full bg-gradient-to-r ${typeInfo.progress} relative shadow-lg transition-all duration-700 ease-out`}
              style={{
                width: `${percentage}%`,
              }}
            >
              {/* Brilho animado */}
              <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
            </div>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex items-center justify-end gap-2 border-t border-light-border pt-3 dark:border-dark-border">
          <button
            onClick={() => onToggleStatus(goal)}
            className={`group/btn rounded-xl p-2.5 transition-all duration-300 ${goal.is_active ? 'text-orange-600 hover:bg-orange-50 hover:shadow-lg hover:shadow-orange-500/30 dark:hover:bg-orange-900/20' : 'text-green-600 hover:bg-green-50 hover:shadow-lg hover:shadow-green-500/30 dark:hover:bg-green-900/20'}`}
            title={goal.is_active ? 'Desativar meta' : 'Ativar meta'}
          >
            {goal.is_active ? (
              <AlertCircle className="h-5 w-5 transition-transform group-hover/btn:scale-110" />
            ) : (
              <CheckCircle className="h-5 w-5 transition-transform group-hover/btn:scale-110" />
            )}
          </button>

          <button
            onClick={() => onEdit(goal)}
            className="group/btn rounded-xl p-2.5 text-blue-600 transition-all duration-300 hover:bg-blue-50 hover:shadow-lg hover:shadow-blue-500/30 dark:hover:bg-blue-900/20"
            title="Editar meta"
          >
            <Edit className="h-5 w-5 transition-transform group-hover/btn:scale-110" />
          </button>

          <button
            onClick={() => onDelete(goal)}
            className="group/btn rounded-xl p-2.5 text-red-600 transition-all duration-300 hover:bg-red-50 hover:shadow-lg hover:shadow-red-500/30 dark:hover:bg-red-900/20"
            title="Excluir meta"
          >
            <Trash2 className="h-5 w-5 transition-transform group-hover/btn:scale-110" />
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
    <div className="min-h-screen bg-light-bg from-gray-50 via-blue-50/30 to-purple-50/30 p-6 dark:bg-dark-bg dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      {/* 🎨 Header Premium com gradiente */}
      <div className="mb-8">
        <div className="mb-8 flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-gradient-primary p-3 shadow-lg">
                <Target className="text-dark-text-primary h-8 w-8" />
              </div>
              <div>
                <h1 className="text-theme-primary dark:text-dark-text-primary text-4xl font-black tracking-tight">
                  🎯 Cadastro de Metas
                </h1>
                <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-base font-medium">
                  Gerencie as metas financeiras por unidade e período
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="card-theme rounded-xl border border-light-border p-1 shadow-lg dark:border-dark-border dark:bg-dark-surface">
              <UnitSelector userId="current-user" />
            </div>
            {hasSelectedUnit ? (
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-dark-text-primary group flex items-center gap-2 rounded-xl bg-gradient-primary px-6 py-3 font-bold transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/50"
              >
                <Plus className="h-5 w-5 transition-transform group-hover:rotate-90" />
                Nova Meta
              </button>
            ) : (
              <div className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted card-theme flex items-center gap-2 rounded-xl border-2 border-dashed border-light-border px-5 py-3 text-sm dark:border-dark-border dark:bg-dark-surface">
                <Info className="h-4 w-4" />
                Selecione uma unidade para criar metas
              </div>
            )}
          </div>
        </div>

        {/* 🔍 Filtros Premium */}
        <div className="card-theme flex items-center gap-4 rounded-2xl border border-light-border p-5 shadow-lg dark:border-dark-border dark:bg-dark-surface">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 dark:text-gray-600">
            <Calendar className="h-5 w-5 text-indigo-600" />
            Filtrar por:
          </div>

          <div className="grid flex-1 grid-cols-2 gap-4">
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 dark:text-gray-600">
                <Calendar className="h-4 w-4 text-teal-600" />
                Ano
              </label>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(parseInt(e.target.value))}
                className="card-theme text-theme-primary dark:text-dark-text-primary w-full rounded-xl border-2 border-light-border px-4 py-2.5 font-semibold transition-all hover:border-indigo-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-dark-border dark:bg-gray-700"
              >
                {Array.from(
                  {
                    length: 5,
                  },
                  (_, i) => {
                    const year = new Date().getFullYear() - 2 + i;
                    return (
                      <option key={year} value={year}>
                        📅 {year}
                      </option>
                    );
                  }
                )}
              </select>
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 dark:text-gray-600">
                <Calendar className="h-4 w-4 text-cyan-600" />
                Mês
              </label>
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(parseInt(e.target.value))}
                className="card-theme text-theme-primary dark:text-dark-text-primary w-full rounded-xl border-2 border-light-border px-4 py-2.5 font-semibold transition-all hover:border-indigo-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-dark-border dark:bg-gray-700"
              >
                {Array.from(
                  {
                    length: 12,
                  },
                  (_, i) => {
                    const month = i + 1;
                    const monthName = format(new Date(2024, i), 'MMMM', {
                      locale: ptBR,
                    });
                    return (
                      <option key={month} value={month}>
                        {monthName.charAt(0).toUpperCase() + monthName.slice(1)}
                      </option>
                    );
                  }
                )}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 📊 Lista de Metas com Estados Premium */}
      {!hasSelectedUnit ? (
        <div className="card-theme rounded-2xl border-2 border-dashed border-light-border py-16 text-center shadow-xl dark:border-dark-border dark:bg-dark-surface">
          <div className="mb-6 inline-block rounded-2xl bg-blue-50 p-4 dark:bg-blue-900/20">
            <Target className="h-20 w-20 text-blue-500 dark:text-blue-400" />
          </div>
          <h3 className="text-theme-primary dark:text-dark-text-primary mb-3 text-2xl font-black">
            🏢 Selecione uma unidade
          </h3>
          <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mx-auto mb-6 max-w-md text-base">
            Escolha uma unidade no seletor acima para visualizar e gerenciar
            suas metas financeiras.
          </p>
          <div className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted flex items-center justify-center gap-2 text-sm">
            <Info className="h-4 w-4" />
            <span>Você pode criar metas personalizadas para cada unidade</span>
          </div>
        </div>
      ) : goalsLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, index) => (
            <div
              key={index}
              className="card-theme overflow-hidden rounded-2xl border border-light-border shadow-lg dark:border-dark-border dark:bg-dark-surface"
            >
              {/* Header skeleton com cor sólida */}
              <div className="h-28 animate-pulse bg-gray-200 dark:bg-gray-700"></div>

              {/* Body skeleton */}
              <div className="space-y-4 p-6">
                <div className="h-6 w-32 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"></div>
                <div className="h-10 w-40 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"></div>
                <div className="h-4 w-full animate-pulse rounded-full bg-gray-200 dark:bg-gray-700"></div>
                <div className="flex gap-2 pt-3">
                  <div className="h-10 w-10 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700"></div>
                  <div className="h-10 w-10 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700"></div>
                  <div className="h-10 w-10 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : goals.length === 0 ? (
        <div className="card-theme rounded-2xl border-2 border-dashed border-indigo-300 py-16 text-center shadow-xl dark:border-indigo-600 dark:bg-dark-surface">
          <div className="relative mb-6 inline-block">
            <div className="rounded-2xl bg-indigo-50 from-indigo-50 to-purple-50 p-4 dark:bg-indigo-900/20 dark:from-indigo-900/20 dark:to-purple-900/20">
              <Target className="h-20 w-20 text-indigo-500 dark:text-indigo-400" />
            </div>
            <div className="absolute -right-2 -top-2 animate-bounce rounded-full bg-yellow-400 from-yellow-400 to-orange-400 p-2 shadow-lg">
              <Sparkles className="text-dark-text-primary h-6 w-6" />
            </div>
          </div>

          <h3 className="text-theme-primary dark:text-dark-text-primary mb-3 text-2xl font-black">
            📈 Nenhuma meta cadastrada
          </h3>
          <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mb-2 text-base font-medium">
            {selectedUnit?.name}
          </p>
          <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mx-auto mb-8 max-w-md text-base">
            Comece criando sua primeira meta financeira para esta unidade e
            acompanhe o progresso em tempo real.
          </p>

          <button
            onClick={() => setIsModalOpen(true)}
            className="text-dark-text-primary group inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-6 py-3 font-bold transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/50"
          >
            <Plus className="h-5 w-5 transition-transform group-hover:rotate-90" />
            Criar primeira meta
          </button>

          <div className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mt-8 flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span>Faturamento</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500"></div>
              <span>Assinaturas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-purple-500"></div>
              <span>Produtos</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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
