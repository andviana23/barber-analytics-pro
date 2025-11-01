/**
 * CREATE BANK ACCOUNT MODAL
 *
 * Modal para criação de nova conta bancária
 */

import React, { useState } from 'react';
import { Button, Input } from '../../atoms';
import { useBankAccounts, useUnits } from '../../hooks';
import { useToast } from '../../context';

// Icons
import { X, CreditCard, Check, AlertTriangle, Building, MapPin, Hash, DollarSign } from 'lucide-react';
const CreateBankAccountModal = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const {
    createBankAccount,
    loading,
    checkAccountExists
  } = useBankAccounts();
  const {
    units
  } = useUnits();
  const {
    showSuccess,
    showError
  } = useToast();

  // Estado do formulário
  const [formData, setFormData] = useState({
    name: '',
    bank: '',
    agency: '',
    account_number: '',
    unit_id: '',
    initial_balance: 0
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [checking, setChecking] = useState(false);

  // Validação
  const validateForm = async () => {
    const newErrors = {};

    // Nome da conta
    if (!formData.name.trim()) {
      newErrors.name = 'Nome da conta é obrigatório';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Nome deve ter pelo menos 3 caracteres';
    } else if (formData.name.trim().length > 255) {
      newErrors.name = 'Nome não pode ter mais de 255 caracteres';
    }

    // Banco
    if (!formData.bank.trim()) {
      newErrors.bank = 'Nome do banco é obrigatório';
    } else if (formData.bank.trim().length < 2) {
      newErrors.bank = 'Nome do banco deve ter pelo menos 2 caracteres';
    }

    // Agência
    if (!formData.agency.trim()) {
      newErrors.agency = 'Agência é obrigatória';
    } else if (!/^[\d-]+$/.test(formData.agency.trim())) {
      newErrors.agency = 'Agência deve conter apenas números e hífen';
    }

    // Número da conta
    if (!formData.account_number.trim()) {
      newErrors.account_number = 'Número da conta é obrigatório';
    } else if (!/^[\d-]+$/.test(formData.account_number.trim())) {
      newErrors.account_number = 'Número da conta deve conter apenas números e hífen';
    }

    // Unidade
    if (!formData.unit_id) {
      newErrors.unit_id = 'Unidade é obrigatória';
    }

    // Saldo inicial
    if (formData.initial_balance < 0) {
      newErrors.initial_balance = 'Saldo inicial não pode ser negativo';
    }

    // Verificar se a conta já existe
    if (!newErrors.bank && !newErrors.agency && !newErrors.account_number && !newErrors.unit_id) {
      try {
        setChecking(true);
        const exists = await checkAccountExists(formData.bank.trim(), formData.agency.trim(), formData.account_number.trim(), formData.unit_id);
        if (exists) {
          newErrors.account_number = 'Esta conta já existe para a unidade selecionada';
        }
      } catch {
        // Erro ao verificar será ignorado para não bloquear o formulário
      } finally {
        setChecking(false);
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handlers
  const handleInputChange = e => {
    const {
      name,
      value
    } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Limpar erro do campo atual
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  const handleBlur = field => {
    setTouched(prev => ({
      ...prev,
      [field]: true
    }));
  };
  const handleSubmit = async e => {
    e.preventDefault();
    const isValid = await validateForm();
    if (!isValid) return;
    try {
      const newAccount = await createBankAccount(formData);
      showSuccess('Conta bancária criada', `A conta ${formData.name} foi criada com sucesso.`);

      // Reset form
      setFormData({
        name: '',
        bank: '',
        agency: '',
        account_number: '',
        unit_id: '',
        initial_balance: 0
      });
      setErrors({});
      setTouched({});
      onSuccess?.(newAccount);
      onClose();
    } catch (error) {
      showError('Erro ao criar conta', error.message);
    }
  };
  const handleClose = () => {
    if (loading) return;
    setFormData({
      name: '',
      bank: '',
      agency: '',
      account_number: '',
      unit_id: '',
      initial_balance: 0
    });
    setErrors({});
    setTouched({});
    onClose();
  };
  if (!isOpen) return null;
  return <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-lg transform rounded-lg card-theme dark:bg-dark-surface shadow-xl transition-all">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-light-border dark:border-dark-border">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-theme-primary dark:text-dark-text-primary">
                  Nova Conta Bancária
                </h3>
                <p className="text-sm text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
                  Cadastre uma nova conta bancária
                </p>
              </div>
            </div>

            <Button variant="ghost" size="sm" onClick={handleClose} disabled={loading} className="h-8 w-8 p-0">
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Nome da conta */}
            <div>
              <Input label="Nome da Conta" name="name" placeholder="Ex: Conta Corrente Principal" value={formData.name} onChange={handleInputChange} onBlur={() => handleBlur('name')} error={touched.name && errors.name} disabled={loading} icon={CreditCard} required />
            </div>

            {/* Banco */}
            <div>
              <Input label="Banco" name="bank" placeholder="Ex: Itaú, Bradesco, Banco do Brasil" value={formData.bank} onChange={handleInputChange} onBlur={() => handleBlur('bank')} error={touched.bank && errors.bank} disabled={loading} icon={Building} required />
            </div>

            {/* Grid com agência e conta */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Input label="Agência" name="agency" placeholder="1234" value={formData.agency} onChange={handleInputChange} onBlur={() => handleBlur('agency')} error={touched.agency && errors.agency} disabled={loading} icon={MapPin} required />
              </div>

              <div>
                <Input label="Número da Conta" name="account_number" placeholder="12345-6" value={formData.account_number} onChange={handleInputChange} onBlur={() => handleBlur('account_number')} error={touched.account_number && errors.account_number} disabled={loading} icon={Hash} required />
              </div>
            </div>

            {/* Unidade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">
                Unidade *
              </label>
              <select name="unit_id" value={formData.unit_id} onChange={handleInputChange} onBlur={() => handleBlur('unit_id')} disabled={loading} className={`
                  w-full px-3 py-2 border rounded-md shadow-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  disabled:bg-gray-50 disabled:text-gray-500
                  ${touched.unit_id && errors.unit_id ? 'border-red-300 bg-red-50' : 'border-gray-300 dark:border-gray-600'}
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                `}>
                <option value="">Selecione uma unidade</option>
                {units.map(unit => <option key={unit.id} value={unit.id}>
                    {unit.name}
                  </option>)}
              </select>
              {touched.unit_id && errors.unit_id && <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  {errors.unit_id}
                </p>}
            </div>

            {/* Saldo inicial */}
            <div>
              <Input label="Saldo Inicial" name="initial_balance" type="number" step="0.01" min="0" placeholder="0,00" value={formData.initial_balance} onChange={handleInputChange} onBlur={() => handleBlur('initial_balance')} error={touched.initial_balance && errors.initial_balance} disabled={loading} icon={DollarSign} />
            </div>

            {/* Indicador de verificação */}
            {checking && <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                Verificando se a conta já existe...
              </div>}

            {/* Botões */}
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleClose} disabled={loading} className="flex-1">
                Cancelar
              </Button>

              <Button type="submit" disabled={loading || checking} className="flex-1">
                {loading ? <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-light-surface dark:border-dark-surface"></div>
                    Criando...
                  </div> : <div className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Criar Conta
                  </div>}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>;
};
export default CreateBankAccountModal;