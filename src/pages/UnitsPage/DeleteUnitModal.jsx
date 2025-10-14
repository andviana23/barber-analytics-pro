/**
 * DELETE UNIT MODAL
 * 
 * Modal de confirmação para exclusão de unidade
 */

import React, { useState, useEffect } from 'react';
import { Button } from '../../atoms';
import { useUnits } from '../../hooks';

// Icons
import {
  X,
  AlertTriangle,
  Trash2,
  Shield
} from 'lucide-react';

const DeleteUnitModal = ({ isOpen, onClose, onSuccess, unit }) => {
  const { deleteUnit, deleting, checkDependencies } = useUnits(false);

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
      setDependencies({ hasDependencies: false, dependencies: [], unitName: unit.name });
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

  const handleConfirmChange = (e) => {
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-6 pb-6 pt-5 text-left shadow-xl transition-all w-full max-w-lg">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg mr-3">
                <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Excluir Unidade
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Esta ação não pode ser desfeita
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={deleting}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Conteúdo */}
          <div className="space-y-6">
            {/* Alerta principal */}
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 mr-3" />
                <div className="text-sm">
                  <p className="text-red-800 dark:text-red-300 font-medium mb-2">
                    Atenção! Você está prestes a excluir a unidade:
                  </p>
                  <p className="text-red-700 dark:text-red-400 font-semibold text-lg">
                    {unit.name}
                  </p>
                </div>
              </div>
            </div>

            {/* Verificação de dependências */}
            {loadingDependencies ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-sm text-gray-500">
                  Verificando dependências...
                </span>
              </div>
            ) : dependencies ? (
              <div>
                {dependencies.hasDependencies ? (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <div className="flex">
                      <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 mr-3" />
                      <div className="text-sm">
                        <p className="text-amber-800 dark:text-amber-300 font-medium mb-2">
                          Esta unidade possui dados vinculados:
                        </p>
                        <ul className="text-amber-700 dark:text-amber-400 space-y-1">
                          {dependencies.dependencies.map((dep, index) => (
                            <li key={index}>• {dep}</li>
                          ))}
                        </ul>
                        <p className="text-amber-800 dark:text-amber-300 font-medium mt-3">
                          A unidade será marcada como inativa, preservando o histórico.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex">
                      <AlertTriangle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 mr-3" />
                      <div className="text-sm">
                        <p className="text-green-800 dark:text-green-300">
                          Esta unidade não possui dados vinculados e pode ser excluída com segurança.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {/* Informações da unidade */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                Informações da Unidade
              </h4>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Para confirmar, digite o nome da unidade: <span className="font-bold">{unit.name}</span>
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={handleConfirmChange}
                disabled={deleting}
                placeholder={`Digite "${unit.name}" para confirmar`}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {confirmText && !canDelete && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  O nome não confere. Digite exatamente: {unit.name}
                </p>
              )}
            </div>

            {/* Consequências */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Consequências da exclusão:
              </h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• A unidade será removida permanentemente do sistema</li>
                <li>• Profissionais vinculados precisarão ser reatribuídos</li>
                <li>• Dados históricos serão preservados para relatórios</li>
                <li>• Esta ação não pode ser desfeita</li>
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={deleting}
            >
              Cancelar
            </Button>
            
            <Button
              type="button"
              variant="danger"
              onClick={handleDelete}
              disabled={deleting || !canDelete}
              loading={deleting}
              loadingText="Excluindo..."
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir Unidade
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteUnitModal;
