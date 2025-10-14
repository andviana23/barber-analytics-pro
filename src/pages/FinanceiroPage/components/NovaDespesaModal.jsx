import React, { useState, useEffect } from 'react';
import { X, TrendingDown } from 'lucide-react';
import { Button, Input } from '../../../atoms';
import { supabase } from '../../../services/supabase';

const TIPOS_DESPESA = [
  { value: 'fixa', label: 'Fixa' },
  { value: 'variavel', label: 'Variável' }
];

const CATEGORIAS_DESPESA = [
  { value: 'aluguel', label: 'Aluguel' },
  { value: 'energia', label: 'Energia Elétrica' },
  { value: 'agua', label: 'Água' },
  { value: 'internet', label: 'Internet/Telefone' },
  { value: 'produtos', label: 'Produtos' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'manutencao', label: 'Manutenção' },
  { value: 'limpeza', label: 'Limpeza' },
  { value: 'salarios', label: 'Salários' },
  { value: 'impostos', label: 'Impostos/Taxas' },
  { value: 'outros', label: 'Outros' }
];

export default function NovaDespesaModal({ onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    tipo: 'fixa',
    categoria: 'outros',
    valor: '',
    data: new Date().toISOString().split('T')[0],
    recorrente: false,
    observacoes: '',
    unitId: ''
  });

  const [loading, setLoading] = useState(false);
  const [units, setUnits] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchUnits();
  }, []);

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
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.tipo) newErrors.tipo = 'Tipo é obrigatório';
    if (!formData.categoria) newErrors.categoria = 'Categoria é obrigatória';
    if (!formData.valor || isNaN(parseFloat(formData.valor)) || parseFloat(formData.valor) <= 0) {
      newErrors.valor = 'Valor deve ser um número positivo';
    }
    if (!formData.data) newErrors.data = 'Data é obrigatória';
    if (!formData.unitId) newErrors.unitId = 'Unidade é obrigatória';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      const despesa = {
        tipo: formData.tipo,
        categoria: formData.categoria,
        valor: parseFloat(formData.valor),
        data: formData.data,
        recorrente: formData.recorrente,
        observacoes: formData.observacoes || null,
        unitId: formData.unitId
      };

      await onSubmit(despesa);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao criar despesa:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Nova Despesa</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo *
              </label>
              <select
                value={formData.tipo}
                onChange={(e) => handleInputChange('tipo', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  errors.tipo ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                {TIPOS_DESPESA.map(tipo => (
                  <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                ))}
              </select>
              {errors.tipo && <p className="mt-1 text-sm text-red-600">{errors.tipo}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Categoria *
              </label>
              <select
                value={formData.categoria}
                onChange={(e) => handleInputChange('categoria', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  errors.categoria ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                {CATEGORIAS_DESPESA.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
              {errors.categoria && <p className="mt-1 text-sm text-red-600">{errors.categoria}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
              {errors.valor && <p className="mt-1 text-sm text-red-600">{errors.valor}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data *
              </label>
              <Input
                type="date"
                value={formData.data}
                onChange={(e) => handleInputChange('data', e.target.value)}
                className={errors.data ? 'border-red-300' : ''}
              />
              {errors.data && <p className="mt-1 text-sm text-red-600">{errors.data}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Unidade *
            </label>
            <select
              value={formData.unitId}
              onChange={(e) => handleInputChange('unitId', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 ${
                errors.unitId ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
              }`}
            >
              <option value="">Selecione uma unidade</option>
              {units.map(unit => (
                <option key={unit.id} value={unit.id}>{unit.name}</option>
              ))}
            </select>
            {errors.unitId && <p className="mt-1 text-sm text-red-600">{errors.unitId}</p>}
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.recorrente}
                onChange={(e) => handleInputChange('recorrente', e.target.checked)}
                className="rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Despesa recorrente (mensal)
              </span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Observações
            </label>
            <textarea
              rows={3}
              placeholder="Informações adicionais sobre esta despesa..."
              value={formData.observacoes}
              onChange={(e) => handleInputChange('observacoes', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-red-600 hover:bg-red-700 text-white">
              {loading ? 'Salvando...' : 'Salvar Despesa'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}