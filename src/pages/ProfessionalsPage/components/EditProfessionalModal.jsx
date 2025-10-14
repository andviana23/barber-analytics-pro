import React, { useState } from 'react';
import { X, User, Mail, Percent, Edit } from 'lucide-react';

import { Button } from '../../../atoms/Button/Button';
import { Input } from '../../../atoms/Input/Input';
import { ProfissionaisService } from '../../../services/profissionaisService';
import { useToast } from '../../../context/ToastContext';

/**
 * Modal para editar profissional existente
 */
export function EditProfessionalModal({ professional, onClose, onSuccess }) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  // Estados do formulário - inicializar com dados do profissional
  const [formData, setFormData] = useState({
    name: professional.name || '',
    unit_id: professional.unit_id || '',
    role: professional.role || 'barbeiro',
    commission_rate: professional.commission_rate || 0,
    is_active: professional.is_active ?? true
  });

  const [errors, setErrors] = useState({});

  /**
   * Atualiza o estado do formulário
   */
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro do campo se houver
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  /**
   * Valida o formulário
   */
  const validateForm = () => {
    const newErrors = {};

    // Nome obrigatório
    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    // Unidade obrigatória para barbeiros e gerentes
    if (formData.role !== 'admin' && !formData.unit_id) {
      newErrors.unit_id = 'Unidade é obrigatória para este cargo';
    }

    // Comissão deve ser válida
    if (formData.commission_rate < 0 || formData.commission_rate > 100) {
      newErrors.commission_rate = 'Comissão deve estar entre 0 e 100%';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Submete o formulário
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);

      // Preparar dados para atualização
      const updates = {
        name: formData.name,
        unit_id: formData.role === 'admin' ? null : formData.unit_id,
        role: formData.role,
        commission_rate: formData.commission_rate,
        is_active: formData.is_active
      };

      await ProfissionaisService.updateProfissional(professional.id, updates);

      showToast({
        type: 'success',
        message: 'Profissional atualizado com sucesso!',
        description: `As informações de ${formData.name} foram atualizadas.`
      });

      onSuccess();
    } catch (error) {
      showToast({
        type: 'error',
        message: 'Erro ao atualizar profissional',
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-light-surface dark:bg-dark-surface rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-light-border dark:border-dark-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Edit className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-light-primary dark:text-text-dark-primary">
                Editar Profissional
              </h2>
              <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                Atualizar informações de {professional.name}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            icon={X}
            onClick={onClose}
          />
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Informações Básicas */}
          <div>
            <h3 className="text-lg font-medium text-text-light-primary dark:text-text-dark-primary mb-4">
              Informações Básicas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Input
                  label="Nome Completo *"
                  icon={User}
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  error={errors.name}
                  placeholder="Ex: João Silva"
                />
              </div>

              {professional.user?.email && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
                    Email (não editável)
                  </label>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-bg/50 dark:bg-dark-bg/50">
                    <Mail className="h-4 w-4 text-text-light-secondary dark:text-text-dark-secondary" />
                    <span className="text-text-light-secondary dark:text-text-dark-secondary">
                      {professional.user.email}
                    </span>
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-2">
                  Cargo *
                </label>
                <select 
                  className="w-full px-3 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-text-light-primary dark:text-text-dark-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors duration-300"
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                >
                  <option value="barbeiro">Barbeiro</option>
                  <option value="gerente">Gerente</option>
                  <option value="admin">Administrador</option>
                </select>
                {errors.role && (
                  <p className="text-feedback-light-error dark:text-feedback-dark-error text-xs mt-1">
                    {errors.role}
                  </p>
                )}
              </div>

              {formData.role !== 'admin' && (
                <div>
                  <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-2">
                    Unidade *
                  </label>
                  <select 
                    className="w-full px-3 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-text-light-primary dark:text-text-dark-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors duration-300"
                    value={formData.unit_id}
                    onChange={(e) => handleInputChange('unit_id', e.target.value)}
                  >
                    <option value="">Selecione uma unidade</option>
                    <option value="0db46613-5273-4625-a41d-b4a0dec7dfe7">Mangabeiras</option>
                    <option value="f18050b4-0954-41c1-a1ee-d17617b95bad">Nova Lima</option>
                  </select>
                  {errors.unit_id && (
                    <p className="text-feedback-light-error dark:text-feedback-dark-error text-xs mt-1">
                      {errors.unit_id}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Configurações do Trabalho */}
          <div>
            <h3 className="text-lg font-medium text-text-light-primary dark:text-text-dark-primary mb-4">
              Configurações do Trabalho
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Comissão (%)"
                type="number"
                icon={Percent}
                min="0"
                max="100"
                step="0.01"
                value={formData.commission_rate}
                onChange={(e) => handleInputChange('commission_rate', parseFloat(e.target.value) || 0)}
                error={errors.commission_rate}
                placeholder="0.00"
              />

              <div className="flex items-center gap-2 mt-8">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => handleInputChange('is_active', e.target.checked)}
                  className="rounded border-light-border dark:border-dark-border"
                />
                <label 
                  htmlFor="is_active"
                  className="text-sm text-text-light-primary dark:text-text-dark-primary cursor-pointer"
                >
                  Profissional ativo
                </label>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="flex-1"
            >
              Salvar Alterações
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}