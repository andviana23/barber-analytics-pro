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
        className={`w-20 rounded-md border bg-white px-2 py-1 text-right text-zinc-900 transition-colors focus:outline-none focus:ring-2 dark:bg-zinc-800 dark:text-zinc-100 ${validationError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50 dark:border-red-400' : 'border-zinc-300 focus:border-blue-500 focus:ring-blue-500/50 dark:border-zinc-600'}`}
        disabled={savingId === item.serviceId}
        autoFocus
        placeholder="0.00"
      />
      {validationError && (
        <div className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
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
            className="rounded-lg p-1.5 text-green-600 transition-colors hover:bg-green-50 disabled:opacity-50 dark:text-green-400 dark:hover:bg-green-900/20"
            onClick={() => handleSave(item.serviceId)}
            disabled={savingId === item.serviceId || validationError}
            title={
              validationError ? 'Corrija os erros antes de salvar' : 'Salvar'
            }
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            className="rounded-lg p-1.5 text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
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
        className="rounded-lg p-1.5 text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
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
      <div className="hidden overflow-x-auto rounded-lg border border-zinc-200 shadow-sm dark:border-zinc-700 md:block">
        <table className="card-theme w-full text-sm dark:bg-zinc-900">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
              <th className="px-4 py-3 text-left font-semibold text-zinc-900 dark:text-zinc-100">
                Serviço
              </th>
              <th className="px-4 py-3 text-center font-semibold text-zinc-900 dark:text-zinc-100">
                Comissão (%)
              </th>
              <th className="px-4 py-3 text-center font-semibold text-zinc-900 dark:text-zinc-100">
                Tempo
              </th>
              <th className="px-4 py-3 text-center font-semibold text-zinc-900 dark:text-zinc-100">
                Valor
              </th>
              <th className="px-4 py-3 text-center font-semibold text-zinc-900 dark:text-zinc-100">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
            {commissions.map(item => (
              <tr
                key={item.serviceId}
                className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/30"
              >
                <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                  {item.serviceName}
                </td>
                <td className="px-4 py-3 text-center">
                  {editId === item.serviceId ? (
                    <EditableInput item={item} />
                  ) : (
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {item.currentCommission?.toFixed(2) ?? '—'}%
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-center text-zinc-600 dark:text-zinc-400">
                  {item.serviceDuration ?? '—'} min
                </td>
                <td className="px-4 py-3 text-center font-medium text-zinc-900 dark:text-zinc-100">
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
            className="card-theme rounded-lg border border-zinc-200 p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            {/* Nome do Serviço */}
            <div className="mb-3 flex items-start justify-between">
              <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {item.serviceName}
              </h4>
              <ActionButtons item={item} />
            </div>

            {/* Detalhes */}
            <div className="space-y-2">
              {/* Comissão */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  Comissão:
                </span>
                {editId === item.serviceId ? (
                  <EditableInput item={item} />
                ) : (
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {item.currentCommission?.toFixed(2) ?? '—'}%
                  </span>
                )}
              </div>

              {/* Tempo e Valor */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
                  <Clock className="h-4 w-4" />
                  <span>{item.serviceDuration ?? '—'} min</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm font-medium text-zinc-900 dark:text-zinc-100">
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
        <div className="mt-3 flex items-center justify-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-blue-600 dark:border-zinc-600 dark:border-t-blue-400"></div>
          Salvando alterações...
        </div>
      )}
    </div>
  );
}
