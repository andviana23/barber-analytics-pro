/**
 * EDIT UNIT MODAL
 *
 * Modal para edição de unidade existente
 */

import React, { useState, useEffect } from 'react';
import { Button, Input } from '../../atoms';
import { useUnits } from '../../hooks';

// Icons
import { X, Building2, Check, AlertTriangle } from 'lucide-react';
const EditUnitModal = ({
  isOpen,
  onClose,
  onSuccess,
  unit
}) => {
  const {
    updateUnit,
    updating
  } = useUnits(false);

  // Estado do formulário
  const [formData, setFormData] = useState({
    name: '',
    status: true
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  // Inicializar form com dados da unidade
  useEffect(() => {
    if (unit && isOpen) {
      setFormData({
        name: unit.name || '',
        status: unit.status !== false
      });
      setErrors({});
      setTouched({});
      setHasChanges(false);
    }
  }, [unit, isOpen]);

  // Verificar mudanças
  useEffect(() => {
    if (unit) {
      const changed = formData.name !== unit.name || formData.status !== unit.status;
      setHasChanges(changed);
    }
  }, [formData, unit]);

  // Validação
  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Nome da unidade é obrigatório';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Nome não pode ter mais de 100 caracteres';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handlers
  const handleInputChange = e => {
    const {
      name,
      value,
      type,
      checked
    } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Limpar erro do campo ao digitar
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  const handleInputBlur = field => {
    setTouched(prev => ({
      ...prev,
      [field]: true
    }));
  };
  const handleSubmit = async e => {
    e.preventDefault();
    if (!hasChanges) {
      onClose();
      return;
    }

    // Marcar todos os campos como touched
    const allFields = Object.keys(formData);
    setTouched(allFields.reduce((acc, field) => ({
      ...acc,
      [field]: true
    }), {}));
    if (!validateForm()) {
      return;
    }
    try {
      await updateUnit(unit.id, {
        name: formData.name.trim(),
        status: formData.status
      });
      onSuccess();
    } catch (error) {
      // Error já tratado no hook
    }
  };
  const handleClose = () => {
    if (updating) return; // Não fechar durante atualização

    onClose();
  };
  if (!isOpen || !unit) return null;
  return <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        {/* Overlay */}
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleClose} />

        {/* Modal */}
        <div className="relative transform overflow-hidden rounded-lg card-theme dark:bg-dark-surface px-6 pb-6 pt-5 text-left shadow-xl transition-all w-full max-w-lg">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-3">
                <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-theme-primary dark:text-dark-text-primary">
                  Editar Unidade
                </h3>
                <p className="text-sm text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
                  Altere as informações da unidade
                </p>
              </div>
            </div>
            <button onClick={handleClose} disabled={updating} className="p-2 text-light-text-muted dark:text-dark-text-muted hover:text-theme-secondary dark:hover:text-gray-200 rounded-lg hover:card-theme dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nome da Unidade */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">
                Nome da Unidade *
              </label>
              <Input id="name" name="name" type="text" placeholder="Ex: Mangabeiras, Nova Lima..." value={formData.name} onChange={handleInputChange} onBlur={() => handleInputBlur('name')} error={touched.name && errors.name} disabled={updating} className="w-full" autoFocus />
              {touched.name && errors.name && <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  {errors.name}
                </p>}
            </div>

            {/* Status */}
            <div>
              <label className="flex items-center">
                <input type="checkbox" name="status" checked={formData.status} onChange={handleInputChange} disabled={updating} className="rounded border-light-border dark:border-dark-border text-blue-600 focus:ring-blue-500 dark:bg-gray-700 disabled:opacity-50" />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 dark:text-gray-600">
                  Unidade ativa (habilitada para operação)
                </span>
              </label>
              <p className="mt-1 text-xs text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
                Desativar removerá a unidade das listas de seleção
              </p>
            </div>

            {/* Info sobre alterações */}
            {hasChanges && <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 mr-3" />
                  <div className="text-sm">
                    <p className="text-amber-800 dark:text-amber-300 font-medium mb-1">
                      Alterações detectadas:
                    </p>
                    <ul className="text-amber-700 dark:text-amber-400 space-y-1">
                      {formData.name !== unit.name && <li>
                          • Nome: "{unit.name}" → "{formData.name}"
                        </li>}
                      {formData.status !== unit.status && <li>
                          • Status: {unit.status ? 'Ativa' : 'Inativa'} →{' '}
                          {formData.status ? 'Ativa' : 'Inativa'}
                        </li>}
                    </ul>
                  </div>
                </div>
              </div>}

            {/* Informações da unidade */}
            <div className="bg-light-bg dark:bg-dark-bg dark:bg-gray-700 rounded-lg p-4 space-y-2">
              <h4 className="text-sm font-medium text-theme-primary dark:text-dark-text-primary">
                Informações da Unidade
              </h4>
              <div className="text-sm text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted space-y-1">
                <div>
                  <span className="font-medium">ID:</span> {unit.id}
                </div>
                <div>
                  <span className="font-medium">Criada em:</span>{' '}
                  {new Date(unit.created_at).toLocaleDateString('pt-BR')}
                </div>
                {unit.updated_at && unit.updated_at !== unit.created_at && <div>
                    <span className="font-medium">Última atualização:</span>{' '}
                    {new Date(unit.updated_at).toLocaleDateString('pt-BR')}
                  </div>}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-light-border dark:border-dark-border">
              <Button type="button" variant="secondary" onClick={handleClose} disabled={updating}>
                Cancelar
              </Button>

              <Button type="submit" variant="primary" disabled={updating || !formData.name.trim() || !hasChanges} loading={updating} loadingText="Salvando...">
                <Check className="h-4 w-4 mr-2" />
                {hasChanges ? 'Salvar Alterações' : 'Sem Alterações'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>;
};
export default EditUnitModal;