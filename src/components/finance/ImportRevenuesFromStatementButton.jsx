import { useState } from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';
import ImportRevenuesFromStatementModal from './ImportRevenuesFromStatementModal';

/**
 * Botão para importar receitas a partir de extratos bancários
 * Integra com o modal de importação
 */
const ImportRevenuesFromStatementButton = ({ unitId, userId, onSuccess }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSuccess = () => {
    setIsModalOpen(false);
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
      >
        <FileSpreadsheet className="w-5 h-5" />
        Importar Extrato
      </button>

      {isModalOpen && (
        <ImportRevenuesFromStatementModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleSuccess}
          unitId={unitId}
          userId={userId}
        />
      )}
    </>
  );
};

export default ImportRevenuesFromStatementButton;
