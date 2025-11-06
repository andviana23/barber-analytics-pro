import React, { useState } from 'react';
import { X, User, Mail, Percent, UserPlus, Eye } from 'lucide-react';
import { Button } from '../../../atoms/Button/Button';
import { Input } from '../../../atoms/Input/Input';
import { ProfissionaisService } from '../../../services/profissionaisService';
import { useToast } from '../../../context/ToastContext';

/**
 * Modal para criar novo profissional
 */
export function CreateProfessionalModal({ onClose, onSuccess }) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Estados do formulário
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    unit_id: '',
    role: 'barbeiro',
    commission_rate: 0,
    is_active: true,
  });
  const [errors, setErrors] = useState({});

  /**
   * Atualiza o estado do formulário
   */
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Limpar erro do campo se houver
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null,
      }));
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

    // Email obrigatório e válido
    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    // Senha obrigatória
    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }

    // Confirmação de senha
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Senhas não conferem';
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
  const handleSubmit = async e => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      setLoading(true);

      // Criar usuário e profissional em uma única operação
      await ProfissionaisService.createProfessionalComplete({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: formData.role,
        unit_id: formData.role === 'admin' ? null : formData.unit_id,
        commission_rate: formData.commission_rate,
      });
      showToast({
        type: 'success',
        message: 'Profissional criado com sucesso!',
        description: `${formData.name} foi adicionado à equipe.`,
      });
      onSuccess();
    } catch (error) {
      showToast({
        type: 'error',
        message: 'Erro ao criar profissional',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="card-theme max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-light-border p-6 dark:border-dark-border">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <UserPlus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-light-primary dark:text-text-dark-primary">
                Novo Profissional
              </h2>
              <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                Adicionar um novo membro à equipe
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" icon={X} onClick={onClose} />
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* Informações Pessoais */}
          <div>
            <h3 className="mb-4 text-lg font-medium text-text-light-primary dark:text-text-dark-primary">
              Informações Pessoais
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Input
                  label="Nome Completo *"
                  icon={User}
                  value={formData.name}
                  onChange={e => handleInputChange('name', e.target.value)}
                  error={errors.name}
                  placeholder="Ex: João Silva"
                />
              </div>

              <Input
                label="Email *"
                type="email"
                icon={Mail}
                value={formData.email}
                onChange={e => handleInputChange('email', e.target.value)}
                error={errors.email}
                placeholder="joao@example.com"
              />

              <div>
                <label className="mb-2 block text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                  Cargo *
                </label>
                <select
                  className="w-full rounded-lg border border-light-border bg-light-bg px-3 py-2 text-sm text-text-light-primary transition-colors duration-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 dark:border-dark-border dark:bg-dark-bg dark:text-text-dark-primary"
                  value={formData.role}
                  onChange={e => handleInputChange('role', e.target.value)}
                >
                  <option value="barbeiro">Barbeiro</option>
                  <option value="gerente">Gerente</option>
                  <option value="admin">Administrador</option>
                </select>
                {errors.role && (
                  <p className="mt-1 text-xs text-feedback-light-error dark:text-feedback-dark-error">
                    {errors.role}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Credenciais de Acesso */}
          <div>
            <h3 className="mb-4 text-lg font-medium text-text-light-primary dark:text-text-dark-primary">
              Credenciais de Acesso
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Input
                  label="Senha *"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={e => handleInputChange('password', e.target.value)}
                  error={errors.password}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div>
                <Input
                  label="Confirmar Senha *"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={e =>
                    handleInputChange('confirmPassword', e.target.value)
                  }
                  error={errors.confirmPassword}
                  placeholder="Repita a senha"
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
                  <input
                    type="checkbox"
                    checked={showPassword}
                    onChange={e => setShowPassword(e.target.checked)}
                    className="rounded border-light-border dark:border-dark-border"
                  />
                  <Eye className="h-4 w-4" />
                  Mostrar senhas
                </label>
              </div>
            </div>
          </div>

          {/* Configurações do Trabalho */}
          <div>
            <h3 className="mb-4 text-lg font-medium text-text-light-primary dark:text-text-dark-primary">
              Configurações do Trabalho
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {formData.role !== 'admin' && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                    Unidade *
                  </label>
                  <select
                    className="w-full rounded-lg border border-light-border bg-light-bg px-3 py-2 text-sm text-text-light-primary transition-colors duration-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 dark:border-dark-border dark:bg-dark-bg dark:text-text-dark-primary"
                    value={formData.unit_id}
                    onChange={e => handleInputChange('unit_id', e.target.value)}
                  >
                    <option value="">Selecione uma unidade</option>
                    <option value="0db46613-5273-4625-a41d-b4a0dec7dfe7">
                      Mangabeiras
                    </option>
                    <option value="f18050b4-0954-41c1-a1ee-d17617b95bad">
                      Nova Lima
                    </option>
                  </select>
                  {errors.unit_id && (
                    <p className="mt-1 text-xs text-feedback-light-error dark:text-feedback-dark-error">
                      {errors.unit_id}
                    </p>
                  )}
                </div>
              )}

              <Input
                label="Comissão (%)"
                type="number"
                icon={Percent}
                min="0"
                max="100"
                step="0.01"
                value={formData.commission_rate}
                onChange={e =>
                  handleInputChange(
                    'commission_rate',
                    parseFloat(e.target.value) || 0
                  )
                }
                error={errors.commission_rate}
                placeholder="0.00"
              />

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={e =>
                    handleInputChange('is_active', e.target.checked)
                  }
                  className="rounded border-light-border dark:border-dark-border"
                />
                <label
                  htmlFor="is_active"
                  className="cursor-pointer text-sm text-text-light-primary dark:text-text-dark-primary"
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
              Criar Profissional
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
