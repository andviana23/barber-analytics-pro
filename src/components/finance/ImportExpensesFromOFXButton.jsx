import React, { useState } from 'react';
import { Upload, FileText } from 'lucide-react';
import ImportExpensesFromOFXModal from './ImportExpensesFromOFXModal';

/**
 * Botão de Importação de Despesas via OFX
 *
 * Componente que renderiza o botão para abrir o modal de importação de despesas.
 * Integra com o sistema de despesas existente e segue o padrão de design do sistema.
 */
const ImportExpensesFromOFXButton = ({ onImportSuccess, className = '' }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleImportSuccess = result => {
    setIsModalOpen(false);
    onImportSuccess?.(result);
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-blue-700 ${className}`}
      >
        <Upload className="mr-2 h-4 w-4" />
        Importar OFX
      </button>

      <ImportExpensesFromOFXModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleImportSuccess}
      />
    </>
  );
};

export default ImportExpensesFromOFXButton;
