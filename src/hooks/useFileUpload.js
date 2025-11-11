import { useState, useCallback } from 'react';
import { uploadFile, deleteFile } from '../services/storageService';
import { expenseAttachmentRepository } from '../repositories/expenseAttachmentRepository';
import { revenueAttachmentRepository } from '../repositories/revenueAttachmentRepository';
import toast from 'react-hot-toast';

/**
 * Hook customizado para gerenciar upload de arquivos
 *
 * Features:
 * - Upload de arquivos para Supabase Storage
 * - Criação de registro no banco de dados
 * - Gerenciamento de estado de upload
 * - Tratamento de erros
 * - Suporte para despesas e receitas
 *
 * @module hooks/useFileUpload
 * @author Andrey Viana
 *
 * @param {string} unitId - ID da unidade
 * @param {string} entityId - ID da despesa ou receita
 * @param {'expense'|'revenue'} entityType - Tipo da entidade ('expense' ou 'revenue')
 * @returns {Object} Funções e estado do hook
 */
export const useFileUpload = (unitId, entityId, entityType = 'expense') => {
  const [uploading, setUploading] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Selecionar repository baseado no tipo
  const repository =
    entityType === 'revenue'
      ? revenueAttachmentRepository
      : expenseAttachmentRepository;

  /**
   * Carrega anexos existentes
   */
  const loadAttachments = useCallback(async () => {
    if (!entityId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: repoError } =
        entityType === 'revenue'
          ? await repository.findByRevenueId(entityId)
          : await repository.findByExpenseId(entityId);

      if (repoError) {
        throw new Error(repoError);
      }

      setAttachments(data || []);
    } catch (err) {
      console.error('❌ Erro ao carregar anexos:', err);
      setError(err.message);
      toast.error('Erro ao carregar anexos');
    } finally {
      setLoading(false);
    }
  }, [entityId, entityType, repository]);

  /**
   * Faz upload de um arquivo
   *
   * @param {File} file - Arquivo a fazer upload
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  const uploadAttachment = useCallback(
    async (file) => {
      if (!file || !unitId || !entityId) {
        const errorMsg = 'Dados incompletos para upload';
        toast.error(errorMsg);
        return { success: false, error: errorMsg };
      }

      setUploading(true);
      setError(null);
      setUploadProgress(0);

      try {
        // Simular progresso (em produção, usar eventos do Supabase)
        setUploadProgress(30);

        // 1. Upload para Storage
        const { data: uploadData, error: uploadError } = await uploadFile(
          file,
          unitId,
          entityId
        );

        if (uploadError || !uploadData) {
          throw new Error(uploadError || 'Erro no upload');
        }

        setUploadProgress(70);

        // 2. Criar registro no banco
        const attachmentData = {
          [entityType === 'revenue' ? 'revenue_id' : 'expense_id']: entityId,
          unit_id: unitId,
          filename: uploadData.path.split('/').pop(),
          original_filename: file.name,
          file_type: file.type.split('/')[1].toUpperCase(),
          file_size: file.size,
          file_path: uploadData.path,
          mime_type: file.type,
          uploaded_by: null, // Será preenchido pelo RLS
        };

        const { data: attachmentRecord, error: repoError } =
          await repository.create(attachmentData);

        if (repoError || !attachmentRecord) {
          // Se falhar ao criar registro, deletar arquivo do storage
          await deleteFile(uploadData.path);
          throw new Error(repoError || 'Erro ao salvar registro');
        }

        setUploadProgress(100);

        // 3. Atualizar lista local
        setAttachments((prev) => [attachmentRecord, ...prev]);

        toast.success('Comprovante anexado com sucesso!');
        return { success: true, data: attachmentRecord };
      } catch (err) {
        console.error('❌ Erro no upload:', err);
        const errorMsg = err.message || 'Erro ao fazer upload do arquivo';
        setError(errorMsg);
        toast.error(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setUploading(false);
        setTimeout(() => setUploadProgress(0), 500);
      }
    },
    [unitId, entityId, entityType, repository]
  );

  /**
   * Remove um anexo
   *
   * @param {string} attachmentId - ID do anexo
   * @param {string} filePath - Caminho do arquivo no storage
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const removeAttachment = useCallback(
    async (attachmentId, filePath) => {
      setLoading(true);
      setError(null);

      try {
        // 1. Deletar arquivo do storage
        const { error: deleteError } = await deleteFile(filePath);
        if (deleteError) {
          console.warn('⚠️ Erro ao deletar arquivo do storage:', deleteError);
          // Continua mesmo se falhar, pois pode ser que o arquivo já não exista
        }

        // 2. Soft delete no banco
        const { error: repoError } = await repository.delete(attachmentId);

        if (repoError) {
          throw new Error(repoError);
        }

        // 3. Atualizar lista local
        setAttachments((prev) => prev.filter((att) => att.id !== attachmentId));

        toast.success('Comprovante removido');
        return { success: true };
      } catch (err) {
        console.error('❌ Erro ao remover anexo:', err);
        const errorMsg = err.message || 'Erro ao remover anexo';
        setError(errorMsg);
        toast.error(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setLoading(false);
      }
    },
    [repository]
  );

  return {
    uploading,
    attachments,
    loading,
    error,
    uploadProgress,
    uploadAttachment,
    removeAttachment,
    loadAttachments,
  };
};

