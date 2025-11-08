/**
 * 🎨 Modal: Criar Fornecedor - 100% REFATORADO COM DESIGN SYSTEM
 *
 * Formulário premium para cadastro de novo fornecedor
 *
 * Features:
 * - ✅ Design System completo aplicado
 * - ✅ Layout em 2 colunas responsivo
 * - ✅ Validação em tempo real
 * - ✅ Máscaras automáticas (CPF/CNPJ)
 * - ✅ Feedback visual de erros
 * - ✅ Loading states elegantes
 * - ✅ Dark mode completo
 * - ✅ Animações suaves
 * - ✅ Acessibilidade (ARIA, foco)
 *
 * Campos:
 * - Descrição* (nome de exibição)
 * - CNPJ* (CPF ou CNPJ com máscara)
 * - Razão Social (para CNPJ)
 * - Email (com validação)
 * - Telefone (com máscara)
 * - Endereço
 * - Observações (textarea)
 */

import React, { useState } from 'react';
import {
  X,
  Package,
  Save,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
const CreateSupplierModalRefactored = ({ isOpen, onClose, onSave, unitId }) => {
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
  const formatPhone = value => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 10) {
      // (00) 0000-0000
      return cleaned
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
    // (00) 00000-0000
    return cleaned
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
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
      // Limpar formatação do CNPJ e telefone antes de enviar
      const cleanedData = {
        ...formData,
        cpf_cnpj: formData.cpf_cnpj.replace(/\D/g, ''),
        telefone: formData.telefone.replace(/\D/g, ''),
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
    <div
      className="fixed inset-0 z-50 flex animate-fadeIn items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="card-theme animate-slideUp max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* 🎯 Header Premium - DESIGN SYSTEM */}
        <div className="border-b-2 border-light-border bg-blue-600/10 px-6 py-5 dark:border-dark-border dark:bg-blue-600/20">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-blue-500 p-3 shadow-lg dark:bg-indigo-600">
                <Package className="text-dark-text-primary h-6 w-6" />
              </div>
              <div>
                <h2 className="text-theme-primary text-2xl font-bold">
                  Novo Fornecedor
                </h2>
                <p className="text-theme-secondary mt-1 text-sm">
                  Cadastre um novo fornecedor no sistema
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 rounded-lg p-2 transition-colors hover:bg-light-surface focus:outline-none focus:ring-2 focus:ring-primary/50 dark:hover:bg-dark-surface"
              aria-label="Fechar modal"
            >
              <X className="text-theme-secondary hover:text-theme-primary h-6 w-6 transition-colors" />
            </button>
          </div>
        </div>

        {/* 📊 Formulário Scrollável - DESIGN SYSTEM */}
        <form
          onSubmit={handleSubmit}
          className="max-h-[calc(90vh-180px)] flex-1 overflow-y-auto px-6 py-6"
        >
          {/* Seção: Dados Cadastrais */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b-2 border-light-border pb-3 dark:border-dark-border">
              <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-theme-primary text-lg font-bold">
                Dados Cadastrais
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Nome/Descrição */}
              <div className="md:col-span-1">
                <label className="text-theme-primary mb-2 block text-sm font-bold">
                  Descrição <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Package className="text-light-text-muted dark:text-dark-text-muted dark:text-theme-secondary absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform" />
                  <input
                    type="text"
                    placeholder="Nome do fornecedor"
                    value={formData.nome}
                    onChange={e => handleChange('nome', e.target.value)}
                    className={`text-theme-primary w-full rounded-xl border-2 bg-white py-3 pl-11 pr-4 placeholder-gray-400 transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:placeholder-gray-500 ${errors.nome ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500 dark:border-gray-600'}`}
                  />
                </div>
                {errors.nome && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-500">
                    <span className="inline-block h-1 w-1 rounded-full bg-red-500"></span>
                    {errors.nome}
                  </p>
                )}
              </div>

              {/* CNPJ */}
              <div className="md:col-span-1">
                <label className="text-theme-primary mb-2 block text-sm font-bold">
                  CNPJ <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FileText className="text-light-text-muted dark:text-dark-text-muted dark:text-theme-secondary absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform" />
                  <input
                    type="text"
                    placeholder="00.000.000/0000-00"
                    value={formData.cpf_cnpj}
                    onChange={e =>
                      handleChange('cpf_cnpj', formatCNPJ(e.target.value))
                    }
                    maxLength={18}
                    className={`text-theme-primary w-full rounded-xl border-2 bg-white py-3 pl-11 pr-4 font-mono placeholder-gray-400 transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:placeholder-gray-500 ${errors.cpf_cnpj ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500 dark:border-gray-600'}`}
                  />
                </div>
                {errors.cpf_cnpj && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-500">
                    <span className="inline-block h-1 w-1 rounded-full bg-red-500"></span>
                    {errors.cpf_cnpj}
                  </p>
                )}
              </div>

              {/* Razão Social */}
              <div className="md:col-span-2">
                <label className="text-theme-primary mb-2 block text-sm font-bold">
                  Razão Social
                </label>
                <div className="relative">
                  <Building2 className="text-light-text-muted dark:text-dark-text-muted dark:text-theme-secondary absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform" />
                  <input
                    type="text"
                    placeholder="Razão Social da empresa"
                    value={formData.razao_social}
                    onChange={e => handleChange('razao_social', e.target.value)}
                    className="card-theme text-theme-primary w-full rounded-xl border-2 border-light-border py-3 pl-11 pr-4 placeholder-gray-400 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-dark-border dark:bg-dark-surface dark:placeholder-gray-500"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="md:col-span-1">
                <label className="text-theme-primary mb-2 block text-sm font-bold">
                  Email
                </label>
                <div className="relative">
                  <Mail className="text-light-text-muted dark:text-dark-text-muted dark:text-theme-secondary absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform" />
                  <input
                    type="email"
                    placeholder="email@exemplo.com"
                    value={formData.email}
                    onChange={e => handleChange('email', e.target.value)}
                    className={`text-theme-primary w-full rounded-xl border-2 bg-white py-3 pl-11 pr-4 placeholder-gray-400 transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:placeholder-gray-500 ${errors.email ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500 dark:border-gray-600'}`}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-500">
                    <span className="inline-block h-1 w-1 rounded-full bg-red-500"></span>
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Telefone */}
              <div className="md:col-span-1">
                <label className="text-theme-primary mb-2 block text-sm font-bold">
                  Telefone
                </label>
                <div className="relative">
                  <Phone className="text-light-text-muted dark:text-dark-text-muted dark:text-theme-secondary absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform" />
                  <input
                    type="text"
                    placeholder="(00) 00000-0000"
                    value={formData.telefone}
                    onChange={e =>
                      handleChange('telefone', formatPhone(e.target.value))
                    }
                    maxLength={15}
                    className="card-theme text-theme-primary w-full rounded-xl border-2 border-light-border py-3 pl-11 pr-4 font-mono placeholder-gray-400 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-dark-border dark:bg-dark-surface dark:placeholder-gray-500"
                  />
                </div>
              </div>

              {/* Endereço */}
              <div className="md:col-span-2">
                <label className="text-theme-primary mb-2 block text-sm font-bold">
                  Endereço
                </label>
                <div className="relative">
                  <MapPin className="text-light-text-muted dark:text-dark-text-muted dark:text-theme-secondary absolute left-3 top-3 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Endereço completo"
                    value={formData.endereco}
                    onChange={e => handleChange('endereco', e.target.value)}
                    className="card-theme text-theme-primary w-full rounded-xl border-2 border-light-border py-3 pl-11 pr-4 placeholder-gray-400 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-dark-border dark:bg-dark-surface dark:placeholder-gray-500"
                  />
                </div>
              </div>

              {/* Observações */}
              <div className="md:col-span-2">
                <label className="text-theme-primary mb-2 block text-sm font-bold">
                  Observações
                </label>
                <textarea
                  placeholder="Observações adicionais sobre o fornecedor..."
                  value={formData.observacoes}
                  onChange={e => handleChange('observacoes', e.target.value)}
                  rows={3}
                  className="card-theme text-theme-primary w-full resize-none rounded-xl border-2 border-light-border px-4 py-3 placeholder-gray-400 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-dark-border dark:bg-dark-surface dark:placeholder-gray-500"
                />
              </div>
            </div>
          </div>
        </form>

        {/* 🎬 Footer com Ações - DESIGN SYSTEM */}
        <div className="dark:to-gray-750 border-t-2 border-light-border bg-gradient-light px-6 py-4 dark:border-dark-border dark:from-gray-800">
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="text-theme-primary rounded-xl border-2 border-transparent px-5 py-2.5 text-sm font-semibold transition-all duration-200 hover:border-light-border hover:bg-light-surface disabled:opacity-50 dark:border-dark-border dark:hover:border-dark-border dark:hover:bg-dark-surface"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="text-dark-text-primary flex transform items-center gap-2 rounded-xl bg-gradient-success px-6 py-2.5 font-semibold shadow-lg shadow-green-500/30 transition-all duration-200 hover:scale-105 hover:from-green-700 hover:to-emerald-700 hover:shadow-green-500/50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none dark:focus:ring-offset-dark-bg"
            >
              {loading ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-light-surface border-t-white dark:border-dark-surface/30" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Cadastrar Fornecedor
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default CreateSupplierModalRefactored;
