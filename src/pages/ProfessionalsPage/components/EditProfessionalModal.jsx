import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Percent,
  Edit,
  Settings,
  DollarSign,
} from 'lucide-react';
import { Button } from '../../../atoms/Button/Button';
import { Input } from '../../../atoms/Input/Input';
import { ProfissionaisService } from '../../../services/profissionaisService';
import { useToast } from '../../../context/ToastContext';
import CommissionsTable from '../../../molecules/CommissionsTable';
import { useProfessionalCommissions } from '../../../hooks/useProfessionalCommissions';

/**
 * Modal para editar profissional existente
 */
export function EditProfessionalModal({ professional, onClose, onSuccess }) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic'); // 'basic' ou 'commissions'

  // Estados do formulário - inicializar com dados do profissional
  const [formData, setFormData] = useState({
    name: professional.name || '',
    // ✅ FIX: Garantir que unit_id seja null se vazio ou inválido
    unit_id:
      professional.unit_id && professional.unit_id.trim() !== ''
        ? professional.unit_id
        : null,
    role: professional.role || 'barbeiro',
    commission_rate: professional.commission_rate || 0,
    is_active: professional.is_active ?? true,
  });
  const [errors, setErrors] = useState({});

  // Hook para comissões do profissional
  const {
    commissions,
    loading: commissionsLoading,
    error: commissionsError,
    fetchCommissions,
    saveCommission,
  } = useProfessionalCommissions(professional.id, professional.unit_id);

  // Carregar comissões quando a aba for ativada
  useEffect(() => {
    if (
      activeTab === 'commissions' &&
      professional.id &&
      professional.unit_id
    ) {
      fetchCommissions();
    }
  }, [activeTab, professional.id, professional.unit_id, fetchCommissions]);

  /**
   * Atualiza o estado do formulário
   */
  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const updated = {
        ...prev,
        [field]: value,
      };

      // Se mudou para admin, limpar unit_id
      if (field === 'role' && value === 'admin') {
        updated.unit_id = null;
      }
      return updated;
    });

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

    // Unidade obrigatória para barbeiros, gerentes e recepcionistas (não para admin)
    if (formData.role !== 'admin') {
      const unitId = formData.unit_id?.trim();
      if (!unitId || unitId === '') {
        newErrors.unit_id = 'Unidade é obrigatória para este cargo';
      }
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

      // Preparar dados para atualização
      const updates = {
        name: formData.name.trim(),
        role: formData.role,
        commission_rate: formData.commission_rate,
        is_active: formData.is_active,
      };

      // ✅ CORRIGIDO: Garantir que unit_id seja null para admin ou UUID válido (nunca string vazia)
      if (formData.role === 'admin') {
        updates.unit_id = null;
      } else {
        // Para gerente/barbeiro/recepcionista: garantir UUID válido ou null
        const unitId = formData.unit_id?.trim();
        updates.unit_id = unitId && unitId !== '' ? unitId : null;
      }

      // 🐛 DEBUG: Log detalhado antes de enviar
      console.log('🔍 DEBUG - EditProfessionalModal.handleSubmit');
      console.log('📋 formData:', formData);
      console.log('📤 updates a serem enviados:', updates);
      console.log('🔑 professional.id:', professional.id);
      console.log('💼 formData.role:', formData.role);
      console.log('🏢 formData.unit_id (RAW):', formData.unit_id);
      console.log('🏢 updates.unit_id (FINAL):', updates.unit_id);
      console.log('🔍 Tipo de updates.unit_id:', typeof updates.unit_id);
      await ProfissionaisService.updateProfissional(professional.id, updates);
      showToast({
        type: 'success',
        message: 'Profissional atualizado com sucesso!',
        description: `As informações de ${formData.name} foram atualizadas.`,
      });
      onSuccess();
    } catch (error) {
      console.error('❌ Erro no handleSubmit:', error);
      showToast({
        type: 'error',
        message: 'Erro ao atualizar profissional',
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
          <Button variant="ghost" size="sm" icon={X} onClick={onClose} />
        </div>

        {/* Tabs Navigation */}
        <div className="border-b border-light-border dark:border-dark-border">
          <nav className="flex space-x-8 px-6">
            {[
              {
                id: 'basic',
                label: 'Informações Básicas',
                icon: User,
              },
              {
                id: 'commissions',
                label: 'Comissões por Serviço',
                icon: DollarSign,
              },
            ].map(tab => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 border-b-2 px-2 py-4 text-sm font-medium transition-colors ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-text-light-secondary hover:border-light-border hover:text-text-light-primary dark:text-text-dark-secondary dark:hover:border-dark-border dark:hover:text-text-dark-primary'}`}
                >
                  <TabIcon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'basic' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informações Básicas */}
              <div>
                <h3 className="mb-4 text-lg font-medium text-text-light-primary dark:text-text-dark-primary">
                  Informações Básicas
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

                  {professional.user?.email && (
                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary">
                        Email (não editável)
                      </label>
                      <div className="flex items-center gap-2 rounded-lg border border-light-border bg-light-bg/50 px-3 py-2 dark:border-dark-border dark:bg-dark-bg/50">
                        <Mail className="h-4 w-4 text-text-light-secondary dark:text-text-dark-secondary" />
                        <span className="text-text-light-secondary dark:text-text-dark-secondary">
                          {professional.user.email}
                        </span>
                      </div>
                    </div>
                  )}

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

                  {formData.role !== 'admin' && (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                        Unidade *
                      </label>
                      <select
                        className="w-full rounded-lg border border-light-border bg-light-bg px-3 py-2 text-sm text-text-light-primary transition-colors duration-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 dark:border-dark-border dark:bg-dark-bg dark:text-text-dark-primary"
                        value={formData.unit_id || ''}
                        onChange={e =>
                          handleInputChange('unit_id', e.target.value || null)
                        }
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
                </div>
              </div>

              {/* Configurações do Trabalho */}
              <div>
                <h3 className="mb-4 text-lg font-medium text-text-light-primary dark:text-text-dark-primary">
                  Configurações do Trabalho
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

                  <div className="mt-8 flex items-center gap-2">
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
                  Salvar Alterações
                </Button>
              </div>
            </form>
          )}

          {activeTab === 'commissions' && (
            <div className="space-y-6">
              <div>
                <h3 className="mb-4 text-lg font-medium text-text-light-primary dark:text-text-dark-primary">
                  Comissões por Serviço
                </h3>
                <p className="mb-6 text-sm text-text-light-secondary dark:text-text-dark-secondary">
                  Configure a porcentagem de comissão que {professional.name}{' '}
                  recebe por cada serviço realizado.
                </p>
                {/* Se não há unidade associada, instruir usuário a preencher na aba "Informações Básicas" */}
                {!professional.unit_id && (
                  <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      Este profissional não possui uma unidade associada. Para
                      configurar comissões por serviço, primeiro selecione a
                      unidade na aba "Informações Básicas".
                    </p>
                  </div>
                )}

                {commissionsError && (
                  <div className="mb-4 rounded-lg border border-feedback-light-error/20 bg-feedback-light-error/10 p-4 dark:border-feedback-dark-error/20 dark:bg-feedback-dark-error/10">
                    <p className="text-sm text-feedback-light-error dark:text-feedback-dark-error">
                      Erro ao carregar comissões: {commissionsError}
                    </p>
                  </div>
                )}

                {commissionsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                    <span className="ml-3 text-text-light-secondary dark:text-text-dark-secondary">
                      Carregando comissões...
                    </span>
                  </div>
                ) : commissions.length > 0 ? (
                  <CommissionsTable
                    commissions={commissions}
                    onSave={saveCommission}
                    loading={commissionsLoading}
                  />
                ) : (
                  <div className="py-8 text-center">
                    <DollarSign className="mx-auto mb-4 h-12 w-12 text-text-light-secondary dark:text-text-dark-secondary" />
                    <p className="text-text-light-secondary dark:text-text-dark-secondary">
                      Nenhum serviço encontrado para esta unidade.
                    </p>
                  </div>
                )}
              </div>

              {/* Ações da aba de comissões */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
