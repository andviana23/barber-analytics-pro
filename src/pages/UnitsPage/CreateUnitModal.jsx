/**
 * CREATE UNIT MODAL
 *
 * Modal para criação de nova unidade
 */

import React, { useState } from 'react';
import { Button, Input } from '../../atoms';
import { useUnits } from '../../hooks';

// Icons
import { X, Building2, Check, AlertTriangle } from 'lucide-react';
const CreateUnitModal = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const {
    createUnit,
    creating
  } = useUnits(false);

  // Estado do formulário
  const [formData, setFormData] = useState({
    name: '',
    status: true
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

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
      await createUnit({
        name: formData.name.trim(),
        status: formData.status
      });

      // Reset form
      setFormData({
        name: '',
        status: true
      });
      setErrors({});
      setTouched({});
      onSuccess();
    } catch (error) {
      // Error já tratado no hook
    }
  };
  const handleClose = () => {
    if (creating) return; // Não fechar durante criação

    // Reset form
    setFormData({
      name: '',
      status: true
    });
    setErrors({});
    setTouched({});
    onClose();
  };
  if (!isOpen) return null;
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
                  Nova Unidade
                </h3>
                <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm">
                  Cadastre uma nova unidade da rede
                </p>
              </div>
            </div>
            <button onClick={handleClose} disabled={creating} className="text-light-text-muted dark:text-dark-text-muted hover:text-theme-secondary hover:card-theme rounded-lg p-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-gray-700 dark:hover:text-gray-200">
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
              <Input id="name" name="name" type="text" placeholder="Ex: Mangabeiras, Nova Lima..." value={formData.name} onChange={handleInputChange} onBlur={() => handleInputBlur('name')} error={touched.name && errors.name} disabled={creating} className="w-full" autoFocus />
              {touched.name && errors.name && <p className="mt-1 flex items-center text-sm text-red-600 dark:text-red-400">
                  <AlertTriangle className="mr-1 h-4 w-4" />
                  {errors.name}
                </p>}
            </div>

            {/* Status */}
            <div>
              <label className="flex items-center">
                <input type="checkbox" name="status" checked={formData.status} onChange={handleInputChange} disabled={creating} className="rounded border-light-border text-blue-600 focus:ring-blue-500 disabled:opacity-50 dark:border-dark-border dark:bg-gray-700" />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 dark:text-gray-600 dark:text-theme-secondary">
                  Unidade ativa (habilitada para operação)
                </span>
              </label>
              <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mt-1 text-xs">
                Unidades inativas não aparecerão nas listas de seleção
              </p>
            </div>

            {/* Info Box */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
              <div className="flex">
                <Building2 className="mr-3 mt-0.5 h-5 w-5 text-blue-600 dark:text-blue-400" />
                <div className="text-sm">
                  <p className="mb-1 font-medium text-blue-800 dark:text-blue-300">
                    Informações importantes:
                  </p>
                  <ul className="space-y-1 text-blue-700 dark:text-blue-400">
                    <li>
                      • A unidade será disponibilizada para cadastro de
                      profissionais
                    </li>
                    <li>
                      • Você poderá configurar detalhes adicionais após a
                      criação
                    </li>
                    <li>• O nome pode ser alterado posteriormente</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 border-t border-light-border pt-4 dark:border-dark-border">
              <Button type="button" variant="secondary" onClick={handleClose} disabled={creating}>
                Cancelar
              </Button>

              <Button type="submit" variant="primary" disabled={creating || !formData.name.trim()} loading={creating} loadingText="Criando...">
                <Check className="mr-2 h-4 w-4" />
                Criar Unidade
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>;
};
export default CreateUnitModal;