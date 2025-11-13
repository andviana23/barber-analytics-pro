/**
 * SupplierModal Component
 * @module components/suppliers/SupplierModal
 * @description Modal para criar/editar fornecedores
 * @author Andrey Viana
 * @version 1.0.0
 * @date 2025-11-13
 */

import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import PropTypes from 'prop-types';

// Brazilian states (UF)
const BRAZILIAN_STATES = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
];

/**
 * Máscara para CNPJ: 12.345.678/9012-34
 */
const maskCNPJ = value => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 14) {
    return numbers
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return value;
};

/**
 * Máscara para CPF: 123.456.789-01
 */
const maskCPF = value => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 11) {
    return numbers
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2');
  }
  return value;
};

/**
 * Máscara para telefone: (31) 98765-4321 ou (31) 3876-5432
 */
const maskPhone = value => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 11) {
    return numbers
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return value;
};

/**
 * Máscara para CEP: 12345-678
 */
const maskCEP = value => {
  return value.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2');
};

/**
 * Validação de CNPJ (check digits MOD 11)
 */
const validateCNPJ = cnpj => {
  const numbers = cnpj.replace(/\D/g, '');
  if (numbers.length !== 14 || /^(\d)\1+$/.test(numbers)) return false;

  const calcDigit = base => {
    let sum = 0;
    let weight = 2;
    for (let i = base.length - 1; i >= 0; i--) {
      sum += parseInt(base[i]) * weight;
      weight = weight === 9 ? 2 : weight + 1;
    }
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const base1 = numbers.substring(0, 12);
  const digit1 = calcDigit(base1);
  if (digit1 !== parseInt(numbers[12])) return false;

  const base2 = numbers.substring(0, 13);
  const digit2 = calcDigit(base2);
  return digit2 === parseInt(numbers[13]);
};

/**
 * Validação de CPF (check digits MOD 11)
 */
const validateCPF = cpf => {
  const numbers = cpf.replace(/\D/g, '');
  if (numbers.length !== 11 || /^(\d)\1+$/.test(numbers)) return false;

  const calcDigit = (base, multiplier) => {
    let sum = 0;
    for (let i = 0; i < base.length; i++) {
      sum += parseInt(base[i]) * (multiplier - i);
    }
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const digit1 = calcDigit(numbers.substring(0, 9), 10);
  if (digit1 !== parseInt(numbers[9])) return false;

  const digit2 = calcDigit(numbers.substring(0, 10), 11);
  return digit2 === parseInt(numbers[10]);
};

/**
 * Componente principal: SupplierModal
 */
export default function SupplierModal({
  isOpen,
  onClose,
  onSave,
  supplier = null,
  isSaving = false,
}) {
  // Initialize form data directly from supplier or defaults
  const getInitialFormData = () => {
    if (supplier) {
      return {
        name: supplier.name || '',
        cnpj_cpf: supplier.cnpj_cpf_formatted || supplier.cnpj_cpf || '',
        email: supplier.email || '',
        phone: supplier.phone_formatted || supplier.phone || '',
        address: supplier.address || '',
        city: supplier.city || '',
        state: supplier.state || '',
        zip_code: supplier.zip_code || '',
        status: supplier.status || 'ATIVO',
        payment_terms: supplier.payment_terms || '',
        notes: supplier.notes || '',
      };
    }
    return {
      name: '',
      cnpj_cpf: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      status: 'ATIVO',
      payment_terms: '',
      notes: '',
    };
  };

  const [formData, setFormData] = useState(getInitialFormData);
  const [errors, setErrors] = useState({});
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Reset form when supplier changes
  useEffect(() => {
    if (isOpen) {
      const initialData = getInitialFormData();
      setFormData(initialData);
      setIsDirty(false);
      setErrors({});
      setShowUnsavedWarning(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supplier?.id, isOpen]);

  // Handle input change
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Validate form
  const validate = () => {
    const newErrors = {};

    if (!formData.name || formData.name.trim().length < 2) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
    }

    if (formData.cnpj_cpf) {
      const numbers = formData.cnpj_cpf.replace(/\D/g, '');
      if (numbers.length === 11) {
        if (!validateCPF(formData.cnpj_cpf)) {
          newErrors.cnpj_cpf = 'CPF inválido';
        }
      } else if (numbers.length === 14) {
        if (!validateCNPJ(formData.cnpj_cpf)) {
          newErrors.cnpj_cpf = 'CNPJ inválido';
        }
      } else if (numbers.length > 0) {
        newErrors.cnpj_cpf = 'CNPJ/CPF inválido (deve ter 11 ou 14 dígitos)';
      }
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'E-mail inválido';
    }

    if (formData.phone) {
      const numbers = formData.phone.replace(/\D/g, '');
      if (numbers.length < 10 || numbers.length > 11) {
        newErrors.phone = 'Telefone inválido (deve ter 10 ou 11 dígitos)';
      }
    }

    if (
      formData.state &&
      !BRAZILIAN_STATES.includes(formData.state.toUpperCase())
    ) {
      newErrors.state = 'UF inválida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save
  const handleSave = () => {
    if (!validate()) {
      return;
    }

    // Remove formatting before saving
    const cleanData = {
      ...formData,
      cnpj_cpf: formData.cnpj_cpf.replace(/\D/g, ''),
      phone: formData.phone.replace(/\D/g, ''),
      zip_code: formData.zip_code.replace(/\D/g, ''),
      state: formData.state.toUpperCase(),
    };

    onSave(cleanData);
    setIsDirty(false);
  };

  // Handle close with unsaved changes
  const handleClose = () => {
    if (isDirty && !showUnsavedWarning) {
      setShowUnsavedWarning(true);
    } else {
      onClose();
      setShowUnsavedWarning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="card-theme max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-light-border p-6 dark:border-dark-border">
          <h2 className="text-theme-primary text-xl font-bold">
            {supplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}
          </h2>
          <button
            onClick={handleClose}
            className="text-theme-secondary hover:text-theme-primary rounded p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Unsaved Warning */}
        {showUnsavedWarning && (
          <div className="m-6 rounded-lg border border-feedback-light-warning/30 bg-feedback-light-warning/10 p-4 dark:border-feedback-dark-warning/30 dark:bg-feedback-dark-warning/10">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-feedback-light-warning dark:text-feedback-dark-warning" />
              <div className="flex-1">
                <p className="text-sm font-medium text-feedback-light-warning dark:text-feedback-dark-warning">
                  Você tem alterações não salvas
                </p>
                <p className="text-theme-secondary mt-1 text-xs">
                  Deseja realmente sair sem salvar?
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => {
                      onClose();
                      setShowUnsavedWarning(false);
                    }}
                    className="btn-theme-secondary text-sm"
                  >
                    Sair sem salvar
                  </button>
                  <button
                    onClick={() => setShowUnsavedWarning(false)}
                    className="btn-theme-primary text-sm"
                  >
                    Continuar editando
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="space-y-4 p-6">
          {/* Name (required) */}
          <div>
            <label className="text-theme-primary mb-1 block text-sm font-medium">
              Nome do Fornecedor{' '}
              <span className="text-feedback-light-error">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => handleChange('name', e.target.value)}
              className={`input-theme w-full ${errors.name ? 'border-feedback-light-error' : ''}`}
              placeholder="Nome completo ou razão social"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-feedback-light-error">
                {errors.name}
              </p>
            )}
          </div>

          {/* CNPJ/CPF */}
          <div>
            <label className="text-theme-primary mb-1 block text-sm font-medium">
              CNPJ/CPF
            </label>
            <input
              type="text"
              value={formData.cnpj_cpf}
              onChange={e => {
                const numbers = e.target.value.replace(/\D/g, '');
                const masked =
                  numbers.length <= 11
                    ? maskCPF(e.target.value)
                    : maskCNPJ(e.target.value);
                handleChange('cnpj_cpf', masked);
              }}
              className={`input-theme w-full ${errors.cnpj_cpf ? 'border-feedback-light-error' : ''}`}
              placeholder="00.000.000/0000-00 ou 000.000.000-00"
              maxLength="18"
            />
            {errors.cnpj_cpf && (
              <p className="mt-1 text-xs text-feedback-light-error">
                {errors.cnpj_cpf}
              </p>
            )}
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-theme-primary mb-1 block text-sm font-medium">
                E-mail
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={e => handleChange('email', e.target.value)}
                className={`input-theme w-full ${errors.email ? 'border-feedback-light-error' : ''}`}
                placeholder="contato@fornecedor.com"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-feedback-light-error">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label className="text-theme-primary mb-1 block text-sm font-medium">
                Telefone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={e => handleChange('phone', maskPhone(e.target.value))}
                className={`input-theme w-full ${errors.phone ? 'border-feedback-light-error' : ''}`}
                placeholder="(00) 00000-0000"
                maxLength="15"
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-feedback-light-error">
                  {errors.phone}
                </p>
              )}
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="text-theme-primary mb-1 block text-sm font-medium">
              Endereço
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={e => handleChange('address', e.target.value)}
              className="input-theme w-full"
              placeholder="Rua, número, bairro"
            />
          </div>

          {/* City, State, ZIP */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="text-theme-primary mb-1 block text-sm font-medium">
                Cidade
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={e => handleChange('city', e.target.value)}
                className="input-theme w-full"
                placeholder="Cidade"
              />
            </div>

            <div>
              <label className="text-theme-primary mb-1 block text-sm font-medium">
                UF
              </label>
              <select
                value={formData.state}
                onChange={e => handleChange('state', e.target.value)}
                className={`input-theme w-full ${errors.state ? 'border-feedback-light-error' : ''}`}
              >
                <option value="">Selecione</option>
                {BRAZILIAN_STATES.map(uf => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </select>
              {errors.state && (
                <p className="mt-1 text-xs text-feedback-light-error">
                  {errors.state}
                </p>
              )}
            </div>

            <div>
              <label className="text-theme-primary mb-1 block text-sm font-medium">
                CEP
              </label>
              <input
                type="text"
                value={formData.zip_code}
                onChange={e =>
                  handleChange('zip_code', maskCEP(e.target.value))
                }
                className="input-theme w-full"
                placeholder="00000-000"
                maxLength="9"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="text-theme-primary mb-1 block text-sm font-medium">
              Status
            </label>
            <select
              value={formData.status}
              onChange={e => handleChange('status', e.target.value)}
              className="input-theme w-full"
            >
              <option value="ATIVO">Ativo</option>
              <option value="INATIVO">Inativo</option>
              <option value="BLOQUEADO">Bloqueado</option>
            </select>
          </div>

          {/* Payment Terms */}
          <div>
            <label className="text-theme-primary mb-1 block text-sm font-medium">
              Condições de Pagamento
            </label>
            <input
              type="text"
              value={formData.payment_terms}
              onChange={e => handleChange('payment_terms', e.target.value)}
              className="input-theme w-full"
              placeholder="Ex: 30 dias, À vista, etc"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-theme-primary mb-1 block text-sm font-medium">
              Observações
            </label>
            <textarea
              value={formData.notes}
              onChange={e => handleChange('notes', e.target.value)}
              className="input-theme w-full"
              rows="3"
              placeholder="Informações adicionais sobre o fornecedor"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-light-border p-6 dark:border-dark-border">
          <button
            onClick={handleClose}
            disabled={isSaving}
            className="btn-theme-secondary"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn-theme-primary"
          >
            {isSaving ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-light-surface border-t-transparent dark:border-dark-surface" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

SupplierModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  supplier: PropTypes.object,
  isSaving: PropTypes.bool,
};
