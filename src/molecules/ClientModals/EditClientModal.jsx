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
  return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="card-theme dark:bg-dark-surface rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-light-border dark:border-dark-border">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg">
              <User className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-theme-primary dark:text-dark-text-primary">
                Editar Cliente
              </h2>
              <p className="text-sm text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
                Atualizar dados do cliente
              </p>
            </div>
          </div>

          <button onClick={handleClose} className="flex items-center justify-center w-8 h-8 text-light-text-muted dark:text-dark-text-muted hover:text-theme-secondary dark:hover:text-gray-300 dark:text-gray-600 rounded-lg hover:card-theme dark:hover:bg-gray-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Nome - OBRIGATÓRIO */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">
              Nome Completo <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-light-text-muted dark:text-dark-text-muted" />
              <input type="text" name="nome" value={formData.nome} onChange={handleChange} placeholder="Digite o nome completo" className={`w-full pl-10 pr-3 py-2 border ${errors.nome ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white`} />
            </div>
            {errors.nome && <p className="mt-1 text-sm text-red-500">{errors.nome}</p>}
          </div>

          {/* Grid de 2 colunas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Telefone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">
                Telefone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-light-text-muted dark:text-dark-text-muted" />
                <input type="text" value={formData.telefone} onChange={handlePhoneChange} placeholder="(00) 00000-0000" maxLength={15} className="w-full pl-10 pr-3 py-2 border border-light-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 card-theme dark:bg-gray-700 text-theme-primary dark:text-dark-text-primary" />
              </div>
            </div>

            {/* CPF - Opcional */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">
                CPF
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-light-text-muted dark:text-dark-text-muted" />
                <input type="text" value={formData.cpf_cnpj} onChange={handleCpfChange} placeholder="000.000.000-00" maxLength={14} className="w-full pl-10 pr-3 py-2 border border-light-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 card-theme dark:bg-gray-700 text-theme-primary dark:text-dark-text-primary" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-light-text-muted dark:text-dark-text-muted" />
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="email@exemplo.com" className={`w-full pl-10 pr-3 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white`} />
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
            </div>

            {/* Data de Nascimento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">
                Data de Nascimento
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-light-text-muted dark:text-dark-text-muted" />
                <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} max={new Date().toISOString().split('T')[0]} className="w-full pl-10 pr-3 py-2 border border-light-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 card-theme dark:bg-gray-700 text-theme-primary dark:text-dark-text-primary" />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-light-border dark:border-dark-border">
            <button type="button" onClick={handleClose} className="px-4 py-2 text-gray-700 dark:text-gray-300 dark:text-gray-600 border border-light-border dark:border-dark-border rounded-lg hover:bg-light-bg dark:bg-dark-bg dark:hover:bg-gray-700 transition-colors" disabled={loading}>
              Cancelar
            </button>

            <button type="submit" disabled={loading} className="px-6 py-2 bg-green-600 text-dark-text-primary rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2">
              {loading ? <>
                  <Loader className="w-4 h-4 animate-spin" />
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