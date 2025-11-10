import React, { useRef, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Upload, FileText, X, Loader2 } from 'lucide-react';
import { Button } from '../atoms/Button/Button';

/**
 * AttachmentUploader - Componente Molecule
 *
 * Componente para upload de arquivos (comprovantes).
 * Suporta drag & drop e seleção via input.
 *
 * @module Components/Molecules/AttachmentUploader
 * @author Andrey Viana
 *
 * @component
 * @example
 * ```jsx
 * <AttachmentUploader
 *   onUpload={handleUpload}
 *   uploading={false}
 *   maxSize={5 * 1024 * 1024}
 * />
 * ```
 */
const AttachmentUploader = ({
  onUpload,
  uploading = false,
  uploadProgress = 0,
  maxSize = 5 * 1024 * 1024, // 5MB
  accept = 'image/*,application/pdf',
  className = '',
  disabled = false,
}) => {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Valida arquivo antes do upload
   */
  const validateFile = useCallback(
    (file) => {
      setError(null);

      if (!file) {
        return { valid: false, error: 'Nenhum arquivo selecionado' };
      }

      // Validar tamanho
      if (file.size > maxSize) {
        const maxSizeMB = maxSize / 1024 / 1024;
        return {
          valid: false,
          error: `Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB`,
        };
      }

      // Validar tipo
      const allowedTypes = accept.split(',').map((t) => t.trim());
      const isValidType =
        allowedTypes.some((type) => {
          if (type.endsWith('/*')) {
            const baseType = type.split('/')[0];
            return file.type.startsWith(baseType + '/');
          }
          return file.type === type;
        }) || accept === '*';

      if (!isValidType) {
        return {
          valid: false,
          error: 'Tipo de arquivo não permitido. Use PDF, JPG, PNG ou WEBP',
        };
      }

      return { valid: true };
    },
    [maxSize, accept]
  );

  /**
   * Processa arquivo selecionado
   */
  const handleFile = useCallback(
    async (file) => {
      const validation = validateFile(file);
      if (!validation.valid) {
        setError(validation.error);
        return;
      }

      if (onUpload) {
        await onUpload(file);
      }
    },
    [validateFile, onUpload]
  );

  /**
   * Handler para seleção via input
   */
  const handleFileSelect = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
      // Reset input para permitir selecionar o mesmo arquivo novamente
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [handleFile]
  );

  /**
   * Handlers para drag & drop
   */
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled || uploading) return;

      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [disabled, uploading, handleFile]
  );

  /**
   * Abre seletor de arquivo
   */
  const handleClick = useCallback(() => {
    if (disabled || uploading) return;
    fileInputRef.current?.click();
  }, [disabled, uploading]);

  return (
    <div className={className}>
      {/* Input oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || uploading}
      />

      {/* Área de upload */}
      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-6 transition-all duration-200
          ${
            isDragging
              ? 'border-primary bg-primary/5 dark:bg-primary/10'
              : 'border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface'
          }
          ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'}
        `}
      >
        <div className="flex flex-col items-center justify-center text-center">
          {uploading ? (
            <>
              <Loader2 className="w-10 h-10 text-primary animate-spin mb-3" />
              <p className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
                Fazendo upload...
              </p>
              {uploadProgress > 0 && (
                <div className="w-full max-w-xs">
                  <div className="h-2 bg-light-border dark:bg-dark-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">
                    {uploadProgress}%
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              <Upload className="w-10 h-10 text-light-text-secondary dark:text-dark-text-secondary mb-3" />
              <p className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-1">
                Clique para selecionar ou arraste o arquivo aqui
              </p>
              <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                PDF, JPG, PNG ou WEBP (máx. {maxSize / 1024 / 1024}MB)
              </p>
            </>
          )}
        </div>
      </div>

      {/* Mensagem de erro */}
      {error && (
        <div className="mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-2">
          <X className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}
    </div>
  );
};

AttachmentUploader.propTypes = {
  onUpload: PropTypes.func.isRequired,
  uploading: PropTypes.bool,
  uploadProgress: PropTypes.number,
  maxSize: PropTypes.number,
  accept: PropTypes.string,
  className: PropTypes.string,
  disabled: PropTypes.bool,
};

export default AttachmentUploader;

