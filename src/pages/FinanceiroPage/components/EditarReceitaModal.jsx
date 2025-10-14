import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, User, Building2, Tag, FileText } from 'lucide-react';
import { Button, Input } from '../../../atoms';
import { supabase } from '../../../services/supabase';

const TIPOS_RECEITA = [
  { value: 'servico', label: 'Serviço' },
  { value: 'produto', label: 'Produto' },
  { value: 'assinatura', label: 'Assinatura' },
  { value: 'outros', label: 'Outros' }
];

export default function EditarReceitaModal({ receita, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    tipo: receita?.tipo || 'servico',
    valor: receita?.valor?.toString() || '',
    data: receita?.data || new Date().toISOString().split('T')[0],
    origem: receita?.origem || '',
    observacoes: receita?.observacoes || '',
    professionalId: '',
    unitId: ''
  });

  const [loading, setLoading] = useState(false);
  const [professionals, setProfessionals] = useState([]);
  const [units, setUnits] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchProfessionals();
    fetchUnits();
  }, []);

  // Atualizar form quando receita mudar
  useEffect(() => {
    if (receita) {
      setFormData({
        tipo: receita.tipo || 'servico',
        valor: receita.valor?.toString() || '',
        data: receita.data || new Date().toISOString().split('T')[0],
        origem: receita.origem || '',
        observacoes: receita.observacoes || '',
        professionalId: receita.professionalId || '',
        unitId: receita.unitId || ''
      });
    }
  }, [receita]);

  const fetchProfessionals = async () => {
    try {
      const { data, error } = await supabase
        .from('professionals')
        .select('id, name, unit_id')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setProfessionals(data || []);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao buscar profissionais:', error);
    }
  };

  const fetchUnits = async () => {
    try {
      const { data, error } = await supabase
        .from('units')
        .select('id, name')
        .eq('status', true)
        .order('name');

      if (error) throw error;
      setUnits(data || []);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao buscar unidades:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.tipo) {
      newErrors.tipo = 'Tipo é obrigatório';
    }

    if (!formData.valor || isNaN(parseFloat(formData.valor)) || parseFloat(formData.valor) <= 0) {
      newErrors.valor = 'Valor deve ser um número positivo';
    }

    if (!formData.data) {
      newErrors.data = 'Data é obrigatória';
    }

    if (!formData.professionalId) {
      newErrors.professionalId = 'Profissional é obrigatório';
    }

    if (!formData.unitId) {
      newErrors.unitId = 'Unidade é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      const receitaAtualizada = {
        tipo: formData.tipo,
        valor: parseFloat(formData.valor),
        data: formData.data,
        origem: formData.origem || null,
        observacoes: formData.observacoes || null,
        professionalId: formData.professionalId,
        unitId: formData.unitId
      };

      await onSubmit(receitaAtualizada);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao editar receita:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Editar Receita
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Primeira linha: Tipo e Valor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Tag className="h-4 w-4 inline mr-2" />
                Tipo de Receita *
              </label>
              <select
                value={formData.tipo}
                onChange={(e) => handleInputChange('tipo', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.tipo ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                {TIPOS_RECEITA.map(tipo => (
                  <option key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </option>
                ))}
              </select>
              {errors.tipo && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.tipo}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <DollarSign className="h-4 w-4 inline mr-2" />
                Valor *
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={formData.valor}
                onChange={(e) => handleInputChange('valor', e.target.value)}
                className={errors.valor ? 'border-red-300' : ''}
              />
              {errors.valor && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.valor}</p>
              )}
            </div>
          </div>

          {/* Segunda linha: Data e Profissional */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="h-4 w-4 inline mr-2" />
                Data *
              </label>
              <Input
                type="date"
                value={formData.data}
                onChange={(e) => handleInputChange('data', e.target.value)}
                className={errors.data ? 'border-red-300' : ''}
              />
              {errors.data && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.data}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <User className="h-4 w-4 inline mr-2" />
                Profissional *
              </label>
              <select
                value={formData.professionalId}
                onChange={(e) => handleInputChange('professionalId', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.professionalId ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <option value="">Selecione um profissional</option>
                {professionals.map(prof => (
                  <option key={prof.id} value={prof.id}>
                    {prof.name}
                  </option>
                ))}
              </select>
              {errors.professionalId && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.professionalId}</p>
              )}
            </div>
          </div>

          {/* Terceira linha: Unidade e Origem */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Building2 className="h-4 w-4 inline mr-2" />
                Unidade *
              </label>
              <select
                value={formData.unitId}
                onChange={(e) => handleInputChange('unitId', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.unitId ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <option value="">Selecione uma unidade</option>
                {units.map(unit => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name}
                  </option>
                ))}
              </select>
              {errors.unitId && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.unitId}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Origem
              </label>
              <Input
                type="text"
                placeholder="Ex: Cliente referenciado, promoção, etc."
                value={formData.origem}
                onChange={(e) => handleInputChange('origem', e.target.value)}
              />
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FileText className="h-4 w-4 inline mr-2" />
              Observações
            </label>
            <textarea
              rows={3}
              placeholder="Informações adicionais sobre esta receita..."
              value={formData.observacoes}
              onChange={(e) => handleInputChange('observacoes', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? 'Salvando...' : 'Atualizar Receita'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}