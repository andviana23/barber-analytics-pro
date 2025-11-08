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
        <div className="card-theme relative w-full max-w-lg transform overflow-hidden rounded-lg px-6 pb-6 pt-5 text-left shadow-xl transition-all dark:bg-dark-surface">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center">
              <div className="mr-3 rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
                <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-theme-primary dark:text-dark-text-primary text-lg font-semibold">
                  Editar Unidade
                </h3>
                <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm">
                  Altere as informações da unidade
                </p>
              </div>
            </div>
            <button onClick={handleClose} disabled={updating} className="text-light-text-muted dark:text-dark-text-muted hover:text-theme-secondary hover:card-theme rounded-lg p-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-gray-700 dark:hover:text-gray-200">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nome da Unidade */}
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 dark:text-theme-secondary">
                Nome da Unidade *
              </label>
              <Input id="name" name="name" type="text" placeholder="Ex: Mangabeiras, Nova Lima..." value={formData.name} onChange={handleInputChange} onBlur={() => handleInputBlur('name')} error={touched.name && errors.name} disabled={updating} className="w-full" autoFocus />
              {touched.name && errors.name && <p className="mt-1 flex items-center text-sm text-red-600 dark:text-red-400">
                  <AlertTriangle className="mr-1 h-4 w-4" />
                  {errors.name}
                </p>}
            </div>

            {/* Status */}
            <div>
              <label className="flex items-center">
                <input type="checkbox" name="status" checked={formData.status} onChange={handleInputChange} disabled={updating} className="rounded border-light-border text-blue-600 focus:ring-blue-500 disabled:opacity-50 dark:border-dark-border dark:bg-gray-700" />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 dark:text-gray-600 dark:text-theme-secondary">
                  Unidade ativa (habilitada para operação)
                </span>
              </label>
              <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mt-1 text-xs">
                Desativar removerá a unidade das listas de seleção
              </p>
            </div>

            {/* Info sobre alterações */}
            {hasChanges && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
                <div className="flex">
                  <AlertTriangle className="mr-3 mt-0.5 h-5 w-5 text-amber-600 dark:text-amber-400" />
                  <div className="text-sm">
                    <p className="mb-1 font-medium text-amber-800 dark:text-amber-300">
                      Alterações detectadas:
                    </p>
                    <ul className="space-y-1 text-amber-700 dark:text-amber-400">
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
            <div className="space-y-2 rounded-lg bg-light-bg p-4 dark:bg-dark-bg dark:bg-gray-700">
              <h4 className="text-theme-primary dark:text-dark-text-primary text-sm font-medium">
                Informações da Unidade
              </h4>
              <div className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted space-y-1 text-sm">
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
            <div className="flex items-center justify-end space-x-3 border-t border-light-border pt-4 dark:border-dark-border">
              <Button type="button" variant="secondary" onClick={handleClose} disabled={updating}>
                Cancelar
              </Button>

              <Button type="submit" variant="primary" disabled={updating || !formData.name.trim() || !hasChanges} loading={updating} loadingText="Salvando...">
                <Check className="mr-2 h-4 w-4" />
                {hasChanges ? 'Salvar Alterações' : 'Sem Alterações'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>;
};
export default EditUnitModal;