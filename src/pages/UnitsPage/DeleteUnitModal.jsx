/**
 * DELETE UNIT MODAL
 *
 * Modal de confirmação para exclusão de unidade
 */

import React, { useState, useEffect } from 'react';
import { Button } from '../../atoms';
import { useUnits } from '../../hooks';

// Icons
import { X, AlertTriangle, Trash2, Shield } from 'lucide-react';
const DeleteUnitModal = ({
  isOpen,
  onClose,
  onSuccess,
  unit
}) => {
  const {
    deleteUnit,
    deleting,
    checkDependencies
  } = useUnits(false);
  const [dependencies, setDependencies] = useState(null);
  const [loadingDependencies, setLoadingDependencies] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [canDelete, setCanDelete] = useState(false);

  // Verificar dependências ao abrir modal
  useEffect(() => {
    if (isOpen && unit) {
      loadDependencies();
      setConfirmText('');
      setCanDelete(false);
    }
  }, [isOpen, unit]);
  const loadDependencies = async () => {
    if (!unit) return;
    try {
      setLoadingDependencies(true);
      const deps = await checkDependencies(unit.id);
      setDependencies(deps);
    } catch (error) {
      setDependencies({
        hasDependencies: false,
        dependencies: [],
        unitName: unit.name
      });
    } finally {
      setLoadingDependencies(false);
    }
  };

  // Verificar se pode excluir baseado na confirmação
  useEffect(() => {
    if (unit && confirmText.toLowerCase() === unit.name.toLowerCase()) {
      setCanDelete(true);
    } else {
      setCanDelete(false);
    }
  }, [confirmText, unit]);
  const handleConfirmChange = e => {
    setConfirmText(e.target.value);
  };
  const handleDelete = async () => {
    if (!canDelete || !unit) return;
    try {
      await deleteUnit(unit.id);
      onSuccess();
    } catch (error) {
      // Error já tratado no hook
    }
  };
  const handleClose = () => {
    if (deleting) return; // Não fechar durante exclusão

    setConfirmText('');
    setCanDelete(false);
    onClose();
  };
  if (!isOpen || !unit) return null;
  return <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        {/* Overlay */}
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleClose} />

        {/* Modal */}
        <div className="card-theme relative w-full max-w-lg transform overflow-hidden rounded-lg px-6 pb-6 pt-5 text-left shadow-xl transition-all dark:bg-dark-surface">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center">
              <div className="mr-3 rounded-lg bg-red-100 p-2 dark:bg-red-900/30">
                <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-theme-primary dark:text-dark-text-primary text-lg font-semibold">
                  Excluir Unidade
                </h3>
                <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm">
                  Esta ação não pode ser desfeita
                </p>
              </div>
            </div>
            <button onClick={handleClose} disabled={deleting} className="text-light-text-muted dark:text-dark-text-muted hover:text-theme-secondary hover:card-theme rounded-lg p-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-gray-700 dark:hover:text-gray-200">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Conteúdo */}
          <div className="space-y-6">
            {/* Alerta principal */}
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
              <div className="flex">
                <AlertTriangle className="mr-3 mt-0.5 h-5 w-5 text-red-600 dark:text-red-400" />
                <div className="text-sm">
                  <p className="mb-2 font-medium text-red-800 dark:text-red-300">
                    Atenção! Você está prestes a excluir a unidade:
                  </p>
                  <p className="text-lg font-semibold text-red-700 dark:text-red-400">
                    {unit.name}
                  </p>
                </div>
              </div>
            </div>

            {/* Verificação de dependências */}
            {loadingDependencies ? <div className="flex items-center justify-center py-4">
                <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600"></div>
                <span className="text-theme-secondary ml-2 text-sm">
                  Verificando dependências...
                </span>
              </div> : dependencies ? <div>
                {dependencies.hasDependencies ? <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
                    <div className="flex">
                      <Shield className="mr-3 mt-0.5 h-5 w-5 text-amber-600 dark:text-amber-400" />
                      <div className="text-sm">
                        <p className="mb-2 font-medium text-amber-800 dark:text-amber-300">
                          Esta unidade possui dados vinculados:
                        </p>
                        <ul className="space-y-1 text-amber-700 dark:text-amber-400">
                          {dependencies.dependencies.map((dep, index) => <li key={index}>• {dep}</li>)}
                        </ul>
                        <p className="mt-3 font-medium text-amber-800 dark:text-amber-300">
                          A unidade será marcada como inativa, preservando o
                          histórico.
                        </p>
                      </div>
                    </div>
                  </div> : <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
                    <div className="flex">
                      <AlertTriangle className="mr-3 mt-0.5 h-5 w-5 text-green-600 dark:text-green-400" />
                      <div className="text-sm">
                        <p className="text-green-800 dark:text-green-300">
                          Esta unidade não possui dados vinculados e pode ser
                          excluída com segurança.
                        </p>
                      </div>
                    </div>
                  </div>}
              </div> : null}

            {/* Informações da unidade */}
            <div className="space-y-2 rounded-lg bg-light-bg p-4 dark:bg-dark-bg dark:bg-gray-700">
              <h4 className="text-theme-primary dark:text-dark-text-primary text-sm font-medium">
                Informações da Unidade
              </h4>
              <div className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted space-y-1 text-sm">
                <div>
                  <span className="font-medium">Nome:</span> {unit.name}
                </div>
                <div>
                  <span className="font-medium">Status:</span>{' '}
                  <span className={unit.status ? 'text-green-600' : 'text-red-600'}>
                    {unit.status ? 'Ativa' : 'Inativa'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Criada em:</span>{' '}
                  {new Date(unit.created_at).toLocaleDateString('pt-BR')}
                </div>
              </div>
            </div>

            {/* Confirmação */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 dark:text-theme-secondary">
                Para confirmar, digite o nome da unidade:{' '}
                <span className="font-bold">{unit.name}</span>
              </label>
              <input type="text" value={confirmText} onChange={handleConfirmChange} disabled={deleting} placeholder={`Digite "${unit.name}" para confirmar`} className="card-theme text-theme-primary dark:text-dark-text-primary w-full rounded-lg border border-light-border px-3 py-2 placeholder-gray-500 focus:border-transparent focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-border dark:bg-gray-700 dark:placeholder-gray-400" />
              {confirmText && !canDelete && <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  O nome não confere. Digite exatamente: {unit.name}
                </p>}
            </div>

            {/* Consequências */}
            <div className="rounded-lg bg-light-bg p-4 dark:bg-dark-bg dark:bg-gray-700">
              <h4 className="text-theme-primary dark:text-dark-text-primary mb-2 text-sm font-medium">
                Consequências da exclusão:
              </h4>
              <ul className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted space-y-1 text-sm">
                <li>• A unidade será removida permanentemente do sistema</li>
                <li>• Profissionais vinculados precisarão ser reatribuídos</li>
                <li>• Dados históricos serão preservados para relatórios</li>
                <li>• Esta ação não pode ser desfeita</li>
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex items-center justify-end space-x-3 border-t border-light-border pt-6 dark:border-dark-border">
            <Button type="button" variant="secondary" onClick={handleClose} disabled={deleting}>
              Cancelar
            </Button>

            <Button type="button" variant="danger" onClick={handleDelete} disabled={deleting || !canDelete} loading={deleting} loadingText="Excluindo...">
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir Unidade
            </Button>
          </div>
        </div>
      </div>
    </div>;
};
export default DeleteUnitModal;