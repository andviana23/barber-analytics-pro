import React, { useState } from 'react';
import { formatCurrency } from '../utils/formatters';
import { Edit, Check, X, AlertCircle, Clock, DollarSign } from 'lucide-react';

/**
 * Tabela editável de comissões por serviço - RESPONSIVA
 * Desktop: Tabela completa
 * Mobile: Cards compactos
 *
 * Props:
 * - commissions: [{ serviceId, serviceName, currentCommission, servicePrice, serviceDuration }]
 * - onSave: (serviceId, newCommission) => Promise
 * - loading: boolean
 */
export default function CommissionsTable({ commissions, onSave, loading }) {
  const [editId, setEditId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const handleEdit = (id, value) => {
    setEditId(id);
    setEditValue(value);
    setValidationError(null);
  };
  const handleCancel = () => {
    setEditId(null);
    setEditValue('');
    setValidationError(null);
  };
  const validateCommission = value => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return 'Valor deve ser um número válido';
    }
    if (numValue < 0) {
      return 'Comissão não pode ser negativa';
    }
    if (numValue > 100) {
      return 'Comissão não pode ser maior que 100%';
    }
    return null;
  };
  const handleSave = async id => {
    const error = validateCommission(editValue);
    if (error) {
      setValidationError(error);
      return;
    }
    setSavingId(id);
    setValidationError(null);
    try {
      await onSave(id, parseFloat(editValue));
      setSavingId(null);
      setEditId(null);
      setEditValue('');
    } catch (err) {
      setSavingId(null);
      setValidationError('Erro ao salvar comissão');
    }
  };
  const handleInputChange = value => {
    setEditValue(value);
    if (validationError) {
      setValidationError(null);
    }
  };

  // Componente de input editável reutilizável
  const EditableInput = ({ item }) => (
    <div className="flex flex-col items-center gap-1">
      <input
        type="number"
        min={0}
        max={100}
        step={0.01}
        value={editValue}
        onChange={e => handleInputChange(e.target.value)}
        className={`input-theme w-20 text-right ${validationError ? 'border-feedback-light-error focus:ring-feedback-light-error/50 dark:border-feedback-dark-error' : ''}`}
        disabled={savingId === item.serviceId}
        autoFocus
        placeholder="0.00"
      />
      {validationError && (
        <div className="flex items-center gap-1 text-xs text-feedback-light-error dark:text-feedback-dark-error">
          <AlertCircle className="h-3 w-3" />
          <span>{validationError}</span>
        </div>
      )}
    </div>
  );

  // Botões de ação reutilizáveis
  const ActionButtons = ({ item }) => {
    if (editId === item.serviceId) {
      return (
        <div className="flex items-center justify-center gap-2">
          <button
            className="rounded-lg p-1.5 text-feedback-light-success transition-colors hover:bg-light-bg disabled:opacity-50 dark:text-feedback-dark-success dark:hover:bg-dark-hover"
            onClick={() => handleSave(item.serviceId)}
            disabled={savingId === item.serviceId || validationError}
            title={
              validationError ? 'Corrija os erros antes de salvar' : 'Salvar'
            }
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            className="rounded-lg p-1.5 text-feedback-light-error transition-colors hover:bg-light-bg dark:text-feedback-dark-error dark:hover:bg-dark-hover"
            onClick={handleCancel}
            title="Cancelar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      );
    }
    return (
      <button
        className="rounded-lg p-1.5 text-primary transition-colors hover:bg-light-bg dark:hover:bg-dark-hover"
        onClick={() =>
          handleEdit(item.serviceId, item.currentCommission?.toFixed(2) ?? '')
        }
        title="Editar comissão"
      >
        <Edit className="h-4 w-4" />
      </button>
    );
  };
  return (
    <div className="w-full space-y-3">
      {/* Versão Desktop - Tabela */}
      <div className="hidden overflow-x-auto rounded-lg border border-light-border shadow-sm dark:border-dark-border md:block">
        <table className="card-theme w-full text-sm">
          <thead>
            <tr className="border-b border-light-border bg-light-bg dark:border-dark-border dark:bg-dark-bg">
              <th className="px-4 py-3 text-left font-semibold text-text-light-primary dark:text-text-dark-primary">
                Serviço
              </th>
              <th className="px-4 py-3 text-center font-semibold text-text-light-primary dark:text-text-dark-primary">
                Comissão (%)
              </th>
              <th className="px-4 py-3 text-center font-semibold text-text-light-primary dark:text-text-dark-primary">
                Tempo
              </th>
              <th className="px-4 py-3 text-center font-semibold text-text-light-primary dark:text-text-dark-primary">
                Valor
              </th>
              <th className="px-4 py-3 text-center font-semibold text-text-light-primary dark:text-text-dark-primary">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-light-border dark:divide-dark-border">
            {commissions.map(item => (
              <tr
                key={item.serviceId}
                className="transition-colors hover:bg-light-bg dark:hover:bg-dark-hover"
              >
                <td className="px-4 py-3 font-medium text-text-light-primary dark:text-text-dark-primary">
                  {item.serviceName}
                </td>
                <td className="px-4 py-3 text-center">
                  {editId === item.serviceId ? (
                    <EditableInput item={item} />
                  ) : (
                    <span className="font-semibold text-text-light-primary dark:text-text-dark-primary">
                      {item.currentCommission?.toFixed(2) ?? '—'}%
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-center text-text-light-secondary dark:text-text-dark-secondary">
                  {item.serviceDuration ?? '—'} min
                </td>
                <td className="px-4 py-3 text-center font-medium text-text-light-primary dark:text-text-dark-primary">
                  {item.servicePrice ? formatCurrency(item.servicePrice) : '—'}
                </td>
                <td className="px-4 py-3 text-center">
                  <ActionButtons item={item} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Versão Mobile - Cards */}
      <div className="space-y-3 md:hidden">
        {commissions.map(item => (
          <div
            key={item.serviceId}
            className="card-theme rounded-lg border border-light-border p-4 shadow-sm dark:border-dark-border"
          >
            {/* Nome do Serviço */}
            <div className="mb-3 flex items-start justify-between">
              <h4 className="text-base font-semibold text-text-light-primary dark:text-text-dark-primary">
                {item.serviceName}
              </h4>
              <ActionButtons item={item} />
            </div>

            {/* Detalhes */}
            <div className="space-y-2">
              {/* Comissão */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                  Comissão:
                </span>
                {editId === item.serviceId ? (
                  <EditableInput item={item} />
                ) : (
                  <span className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
                    {item.currentCommission?.toFixed(2) ?? '—'}%
                  </span>
                )}
              </div>

              {/* Tempo e Valor */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-sm text-text-light-secondary dark:text-text-dark-secondary">
                  <Clock className="h-4 w-4" />
                  <span>{item.serviceDuration ?? '—'} min</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                  <DollarSign className="h-4 w-4" />
                  <span>
                    {item.servicePrice
                      ? formatCurrency(item.servicePrice)
                      : '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="mt-3 flex items-center justify-center gap-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-light-border border-t-primary dark:border-dark-border"></div>
          Salvando alterações...
        </div>
      )}
    </div>
  );
}
