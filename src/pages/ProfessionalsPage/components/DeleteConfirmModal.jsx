import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '../../../atoms/Button/Button';
import { useToast } from '../../../context/ToastContext';

/**
 * Modal de confirmação para exclusão de profissional
 */
export function DeleteConfirmModal({ professional, onClose, onConfirm }) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  /**
   * Confirma a exclusão
   */
  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm();
      showToast({
        type: 'success',
        message: 'Profissional removido',
        description: `${professional.name} foi removido da equipe.`,
      });
      onClose();
    } catch (error) {
      showToast({
        type: 'error',
        message: 'Erro ao remover profissional',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="card-theme w-full max-w-md rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-light-border p-6 dark:border-dark-border">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-feedback-light-error/10 dark:bg-feedback-dark-error/10">
              <AlertTriangle className="h-5 w-5 text-feedback-light-error dark:text-feedback-dark-error" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-light-primary dark:text-text-dark-primary">
                Remover Profissional
              </h2>
            </div>
          </div>
          <Button variant="ghost" size="sm" icon={X} onClick={onClose} />
        </div>

        {/* Conteúdo */}
        <div className="p-6">
          <p className="mb-4 text-text-light-secondary dark:text-text-dark-secondary">
            Tem certeza de que deseja remover{' '}
            <strong className="text-text-light-primary dark:text-text-dark-primary">
              {professional.name}
            </strong>{' '}
            da equipe?
          </p>

          <div className="bg-warning/10 border-warning/20 mb-6 rounded-lg border p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-warning mt-0.5 h-5 w-5 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-warning mb-2 font-medium">
                  Atenção: Esta ação irá:
                </p>
                <ul className="space-y-1 text-text-light-secondary dark:text-text-dark-secondary">
                  <li>• Desativar o profissional automaticamente</li>
                  <li>• Remover da fila de atendimento</li>
                  <li>• Manter histórico de atendimentos</li>
                  <li>• Preservar dados para relatórios</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex gap-3">
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
              type="button"
              variant="danger"
              onClick={handleConfirm}
              loading={loading}
              className="flex-1"
            >
              Confirmar Remoção
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
