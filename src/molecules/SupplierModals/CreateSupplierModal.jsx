/**
 * Modal: Criar Fornecedor
 *
 * Formulário para cadastro de novo fornecedor
 * Baseado na referência visual fornecida
 *
 * Campos:
 * - Descrição* (nome de exibição)
 * - CNPJ* (CPF ou CNPJ)
 * - Razão Social (para CNPJ)
 * - Email
 * - Telefone
 * - Endereço
 * - Observações
 */

import React, { useState } from 'react';
import { X, Package, Save, Loader } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
const CreateSupplierModal = ({ isOpen, onClose, onSave, unitId }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    cpf_cnpj: '',
    razao_social: '',
    email: '',
    telefone: '',
    endereco: '',
    observacoes: '',
  });
  const [errors, setErrors] = useState({});
  if (!isOpen) return null;

  // Validações
  const validateCNPJ = value => {
    const cleaned = value.replace(/\D/g, '');
    return cleaned.length === 11 || cleaned.length === 14;
  };
  const validateEmail = email => {
    if (!email) return true; // Email é opcional
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };
  const validateForm = () => {
    const newErrors = {};
    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }
    if (!formData.cpf_cnpj.trim()) {
      newErrors.cpf_cnpj = 'CPF/CNPJ é obrigatório';
    } else if (!validateCNPJ(formData.cpf_cnpj)) {
      newErrors.cpf_cnpj = 'CPF/CNPJ inválido';
    }
    if (formData.email && !validateEmail(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    // Limpar erro do campo ao digitar
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null,
      }));
    }
  };
  const formatCNPJ = value => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 11) {
      // CPF: 000.000.000-00
      return cleaned
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
    }
    // CNPJ: 00.000.000/0000-00
    return cleaned
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };
  const handleSubmit = async e => {
    e.preventDefault();
    if (!validateForm()) {
      showToast({
        type: 'error',
        message: 'Erro de validação',
        description: 'Verifique os campos e tente novamente',
      });
      return;
    }
    setLoading(true);
    try {
      // Limpar formatação do CNPJ antes de enviar
      const cleanedData = {
        ...formData,
        cpf_cnpj: formData.cpf_cnpj.replace(/\D/g, ''),
      };
      await onSave(cleanedData);
      showToast({
        type: 'success',
        message: 'Fornecedor cadastrado com sucesso!',
      });

      // Resetar formulário
      setFormData({
        nome: '',
        cpf_cnpj: '',
        razao_social: '',
        email: '',
        telefone: '',
        endereco: '',
        observacoes: '',
      });
      setErrors({});
      onClose();
    } catch (error) {
      showToast({
        type: 'error',
        message: 'Erro ao cadastrar fornecedor',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="card-theme max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-lg shadow-xl dark:bg-dark-surface">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-light-border p-6 dark:border-dark-border">
          <div className="flex items-center gap-3">
            <Package className="text-primary-600 h-6 w-6" />
            <h2 className="text-theme-primary dark:text-dark-text-primary text-xl font-bold">
              Novo Fornecedor
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-light-text-muted dark:text-dark-text-muted hover:text-theme-secondary dark:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSubmit}
          className="max-h-[calc(90vh-140px)] overflow-y-auto p-6"
        >
          <div className="mb-6">
            <h3 className="text-theme-primary dark:text-dark-text-primary mb-4 border-b border-light-border pb-2 text-lg font-semibold dark:border-dark-border">
              Dados Cadastrais
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Nome/Descrição */}
              <div className="md:col-span-1">
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
                  Descrição <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Nome do fornecedor"
                  value={formData.nome}
                  onChange={e => handleChange('nome', e.target.value)}
                  className={`focus:ring-primary-500 w-full rounded-lg border bg-white px-3 py-2 text-gray-900 focus:ring-2 dark:bg-gray-700 dark:text-white ${errors.nome ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                />
                {errors.nome && (
                  <p className="mt-1 text-sm text-red-500">{errors.nome}</p>
                )}
              </div>

              {/* CNPJ */}
              <div className="md:col-span-1">
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
                  CNPJ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="00.000.000/0000-00"
                  value={formData.cpf_cnpj}
                  onChange={e =>
                    handleChange('cpf_cnpj', formatCNPJ(e.target.value))
                  }
                  maxLength={18}
                  className={`focus:ring-primary-500 w-full rounded-lg border bg-white px-3 py-2 text-gray-900 focus:ring-2 dark:bg-gray-700 dark:text-white ${errors.cpf_cnpj ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                />
                {errors.cpf_cnpj && (
                  <p className="mt-1 text-sm text-red-500">{errors.cpf_cnpj}</p>
                )}
              </div>

              {/* Razão Social */}
              <div className="md:col-span-1">
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
                  Razão Social
                </label>
                <input
                  type="text"
                  placeholder="Razão Social"
                  value={formData.razao_social}
                  onChange={e => handleChange('razao_social', e.target.value)}
                  className="card-theme text-theme-primary dark:text-dark-text-primary focus:ring-primary-500 w-full rounded-lg border border-light-border px-3 py-2 focus:ring-2 dark:border-dark-border dark:bg-gray-700"
                />
              </div>

              {/* Email */}
              <div className="md:col-span-1">
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="email@exemplo.com"
                  value={formData.email}
                  onChange={e => handleChange('email', e.target.value)}
                  className={`focus:ring-primary-500 w-full rounded-lg border bg-white px-3 py-2 text-gray-900 focus:ring-2 dark:bg-gray-700 dark:text-white ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                )}
              </div>

              {/* Telefone */}
              <div className="md:col-span-1">
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
                  Telefone
                </label>
                <input
                  type="text"
                  placeholder="(00) 00000-0000"
                  value={formData.telefone}
                  onChange={e => handleChange('telefone', e.target.value)}
                  className="card-theme text-theme-primary dark:text-dark-text-primary focus:ring-primary-500 w-full rounded-lg border border-light-border px-3 py-2 focus:ring-2 dark:border-dark-border dark:bg-gray-700"
                />
              </div>

              {/* Endereço */}
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
                  Endereço
                </label>
                <input
                  type="text"
                  placeholder="Endereço completo"
                  value={formData.endereco}
                  onChange={e => handleChange('endereco', e.target.value)}
                  className="card-theme text-theme-primary dark:text-dark-text-primary focus:ring-primary-500 w-full rounded-lg border border-light-border px-3 py-2 focus:ring-2 dark:border-dark-border dark:bg-gray-700"
                />
              </div>

              {/* Observações */}
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
                  Observações
                </label>
                <textarea
                  placeholder="Observações adicionais..."
                  value={formData.observacoes}
                  onChange={e => handleChange('observacoes', e.target.value)}
                  rows={3}
                  className="card-theme text-theme-primary dark:text-dark-text-primary focus:ring-primary-500 w-full rounded-lg border border-light-border px-3 py-2 focus:ring-2 dark:border-dark-border dark:bg-gray-700"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-light-border pt-4 dark:border-dark-border">
            <button
              type="button"
              onClick={onClose}
              className="hover:card-theme rounded-lg px-4 py-2 text-gray-700 transition-colors dark:text-gray-300 dark:text-gray-600 dark:hover:bg-gray-700"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Cadastrar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default CreateSupplierModal;
