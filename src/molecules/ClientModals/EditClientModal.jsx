/**
 * EDIT CLIENT MODAL
 * Modal para edição de clientes existentes
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X, User, Phone, Mail, CreditCard, Calendar, Loader } from 'lucide-react';
const EditClientModal = ({
  isOpen,
  onClose,
  onUpdate,
  client,
  loading = false
}) => {
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    cpf_cnpj: '',
    date_of_birth: ''
  });
  const [errors, setErrors] = useState({});

  // Carregar dados do cliente quando abrir o modal
  useEffect(() => {
    if (client && isOpen) {
      setFormData({
        nome: client.nome || '',
        telefone: client.telefone || '',
        email: client.email || '',
        cpf_cnpj: client.cpf_cnpj || '',
        date_of_birth: client.date_of_birth || ''
      });
    }
  }, [client, isOpen]);

  // Validar formulário
  const validateForm = () => {
    const newErrors = {};
    if (!formData.nome || formData.nome.trim().length < 3) {
      newErrors.nome = 'Nome deve ter pelo menos 3 caracteres';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    // CPF/CNPJ agora é opcional - sem validação obrigatória

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleChange = e => {
    const {
      name,
      value
    } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  const handlePhoneChange = e => {
    let value = e.target.value.replace(/\D/g, '');
    value = value.slice(0, 11);
    if (value.length > 10) {
      value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (value.length > 6) {
      value = value.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    } else if (value.length > 2) {
      value = value.replace(/(\d{2})(\d{0,5})/, '($1) $2');
    }
    setFormData(prev => ({
      ...prev,
      telefone: value
    }));
  };
  const handleCpfChange = e => {
    let value = e.target.value.replace(/\D/g, '');
    value = value.slice(0, 11);
    if (value.length > 9) {
      value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (value.length > 6) {
      value = value.replace(/(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3');
    } else if (value.length > 3) {
      value = value.replace(/(\d{3})(\d{0,3})/, '$1.$2');
    }
    setFormData(prev => ({
      ...prev,
      cpf_cnpj: value
    }));
  };
  const handleSubmit = async e => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    const dataToSubmit = {
      ...formData,
      telefone: formData.telefone.replace(/\D/g, ''),
      cpf_cnpj: formData.cpf_cnpj.replace(/\D/g, '')
    };
    await onUpdate(client.id, dataToSubmit);
  };
  const handleClose = () => {
    setErrors({});
    onClose();
  };
  if (!isOpen || !client) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="card-theme max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg shadow-xl dark:bg-dark-surface">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-light-border p-6 dark:border-dark-border">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
              <User className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-theme-primary dark:text-dark-text-primary text-xl font-semibold">
                Editar Cliente
              </h2>
              <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm">
                Atualizar dados do cliente
              </p>
            </div>
          </div>

          <button onClick={handleClose} className="text-light-text-muted dark:text-dark-text-muted hover:text-theme-secondary hover:card-theme flex h-8 w-8 items-center justify-center rounded-lg transition-colors dark:text-theme-secondary dark:hover:bg-gray-700 dark:hover:text-gray-300 dark:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* Nome - OBRIGATÓRIO */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 dark:text-theme-secondary">
              Nome Completo <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="text-light-text-muted dark:text-dark-text-muted absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform" />
              <input type="text" name="nome" value={formData.nome} onChange={handleChange} placeholder="Digite o nome completo" className={`w-full border py-2 pl-10 pr-3 ${errors.nome ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg bg-white text-gray-900 focus:border-green-500 focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white`} />
            </div>
            {errors.nome && <p className="mt-1 text-sm text-red-500">{errors.nome}</p>}
          </div>

          {/* Grid de 2 colunas */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Telefone */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 dark:text-theme-secondary">
                Telefone
              </label>
              <div className="relative">
                <Phone className="text-light-text-muted dark:text-dark-text-muted absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform" />
                <input type="text" value={formData.telefone} onChange={handlePhoneChange} placeholder="(00) 00000-0000" maxLength={15} className="card-theme text-theme-primary dark:text-dark-text-primary w-full rounded-lg border border-light-border py-2 pl-10 pr-3 focus:border-green-500 focus:ring-2 focus:ring-green-500 dark:border-dark-border dark:bg-gray-700" />
              </div>
            </div>

            {/* CPF - Opcional */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 dark:text-theme-secondary">
                CPF
              </label>
              <div className="relative">
                <CreditCard className="text-light-text-muted dark:text-dark-text-muted absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform" />
                <input type="text" value={formData.cpf_cnpj} onChange={handleCpfChange} placeholder="000.000.000-00" maxLength={14} className="card-theme text-theme-primary dark:text-dark-text-primary w-full rounded-lg border border-light-border py-2 pl-10 pr-3 focus:border-green-500 focus:ring-2 focus:ring-green-500 dark:border-dark-border dark:bg-gray-700" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 dark:text-theme-secondary">
                E-mail
              </label>
              <div className="relative">
                <Mail className="text-light-text-muted dark:text-dark-text-muted absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform" />
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="email@exemplo.com" className={`w-full border py-2 pl-10 pr-3 ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg bg-white text-gray-900 focus:border-green-500 focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white`} />
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
            </div>

            {/* Data de Nascimento */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 dark:text-theme-secondary">
                Data de Nascimento
              </label>
              <div className="relative">
                <Calendar className="text-light-text-muted dark:text-dark-text-muted absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform" />
                <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} max={new Date().toISOString().split('T')[0]} className="card-theme text-theme-primary dark:text-dark-text-primary w-full rounded-lg border border-light-border py-2 pl-10 pr-3 focus:border-green-500 focus:ring-2 focus:ring-green-500 dark:border-dark-border dark:bg-gray-700" />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-light-border pt-4 dark:border-dark-border">
            <button type="button" onClick={handleClose} className="rounded-lg border border-light-border px-4 py-2 text-gray-700 dark:text-gray-300 dark:text-gray-600 transition-colors hover:bg-light-bg dark:border-dark-border dark:bg-dark-bg dark:text-theme-secondary dark:hover:bg-gray-700" disabled={loading}>
              Cancelar
            </button>

            <button type="submit" disabled={loading} className="text-dark-text-primary flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2 transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? <>
                  <Loader className="h-4 w-4 animate-spin" />
                  Atualizando...
                </> : 'Atualizar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>;
};
EditClientModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  client: PropTypes.object,
  loading: PropTypes.bool
};
export default EditClientModal;