import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  FileText,
  Download,
  Trash2,
  Image as ImageIcon,
  Eye,
  X,
  Loader2,
} from 'lucide-react';
import { Button } from '../../atoms/Button/Button';
import { getSignedUrl } from '../../services/storageService';

/**
 * AttachmentCard - Componente Molecule
 *
 * Exibe um card com preview e ações de um anexo/comprovante.
 * Suporta preview de imagens e PDFs inline.
 *
 * @module Components/Molecules/AttachmentCard
 * @author Andrey Viana
 *
 * @component
 * @example
 * ```jsx
 * <AttachmentCard
 *   attachment={attachment}
 *   onDelete={handleDelete}
 * />
 * ```
 */
const AttachmentCard = ({ attachment, onDelete, className = '' }) => {
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const isImage =
    attachment.mime_type?.startsWith('image/') ||
    ['JPG', 'JPEG', 'PNG', 'WEBP'].includes(
      attachment.file_type?.toUpperCase()
    );

  const isPDF = attachment.file_type?.toUpperCase() === 'PDF';

  /**
   * Handler para download do arquivo
   */
  const handleDownload = async () => {
    try {
      const { data, error } = await getSignedUrl(attachment.file_path, 3600);

      if (error || !data) {
        console.error('Erro ao gerar URL de download:', error);
        return;
      }

      // Abrir em nova aba para download
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Erro ao fazer download:', error);
    }
  };

  /**
   * Handler para visualizar preview
   */
  const handlePreview = async () => {
    if (showPreview) {
      setShowPreview(false);
      setPreviewUrl(null);
      return;
    }

    setLoadingPreview(true);
    try {
      const { data, error } = await getSignedUrl(attachment.file_path, 3600);

      if (error || !data) {
        console.error('Erro ao gerar URL de preview:', error);
        return;
      }

      setPreviewUrl(data.url);
      setShowPreview(true);
    } catch (error) {
      console.error('Erro ao visualizar preview:', error);
    } finally {
      setLoadingPreview(false);
    }
  };

  /**
   * Formata tamanho do arquivo
   */
  const formatFileSize = bytes => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      <div
        className={`card-theme rounded-lg border border-light-border p-4 transition-all duration-200 hover:shadow-md dark:border-dark-border ${className}`}
      >
        <div className="flex items-start gap-3">
          {/* Ícone do tipo de arquivo */}
          <div className="flex-shrink-0">
            {isImage ? (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <ImageIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            ) : isPDF ? (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                <FileText className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </div>
            )}
          </div>

          {/* Informações do arquivo */}
          <div className="min-w-0 flex-1">
            <h4 className="text-light-text-primary dark:text-dark-text-primary truncate text-sm font-medium">
              {attachment.original_filename || attachment.filename}
            </h4>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mt-1 text-xs">
              {formatFileSize(attachment.file_size)} •{' '}
              {attachment.file_type || 'Arquivo'}
            </p>
            {attachment.created_at && (
              <p className="text-light-text-secondary dark:text-dark-text-secondary mt-1 text-xs">
                {new Date(attachment.created_at).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>

          {/* Ações */}
          <div className="flex items-center gap-2">
            {(isImage || isPDF) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePreview}
                className="p-2"
                title={showPreview ? 'Fechar preview' : 'Visualizar'}
                disabled={loadingPreview}
              >
                {loadingPreview ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="p-2"
              title="Download"
            >
              <Download className="h-4 w-4" />
            </Button>
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(attachment.id, attachment.file_path)}
                className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                title="Remover"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Preview inline */}
        {showPreview && previewUrl && (
          <div className="mt-4 border-t border-light-border pt-4 dark:border-dark-border">
            <div className="mb-2 flex items-center justify-between">
              <h5 className="text-light-text-primary dark:text-dark-text-primary text-xs font-medium">
                Preview
              </h5>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowPreview(false);
                  setPreviewUrl(null);
                }}
                className="p-1"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="overflow-hidden rounded-lg border border-light-border bg-light-surface dark:border-dark-border dark:bg-dark-surface">
              {isImage ? (
                <img
                  src={previewUrl}
                  alt={attachment.original_filename}
                  className="h-auto max-h-64 w-full object-contain"
                />
              ) : isPDF ? (
                <iframe
                  src={`${previewUrl}#toolbar=0`}
                  className="h-96 w-full border-0"
                  title={attachment.original_filename}
                />
              ) : null}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

AttachmentCard.propTypes = {
  attachment: PropTypes.shape({
    id: PropTypes.string.isRequired,
    filename: PropTypes.string,
    original_filename: PropTypes.string,
    file_type: PropTypes.string,
    file_size: PropTypes.number,
    file_path: PropTypes.string.isRequired,
    mime_type: PropTypes.string,
    created_at: PropTypes.string,
  }).isRequired,
  onDelete: PropTypes.func,
  className: PropTypes.string,
};

export default AttachmentCard;
