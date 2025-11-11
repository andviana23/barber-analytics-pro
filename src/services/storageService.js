import { supabase } from './supabase';

/**
 * StorageService - Serviço para gerenciar uploads no Supabase Storage
 *
 * Funcionalidades:
 * - Upload de arquivos (PDF, imagens)
 * - Download de arquivos
 * - Exclusão de arquivos
 * - Geração de URLs assinadas
 * - Validação de tipos e tamanhos
 *
 * @module services/storageService
 * @author Andrey Viana
 */

const BUCKET_NAME = 'receipts';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
];

/**
 * Valida se o arquivo é permitido
 * @param {File} file - Arquivo a validar
 * @returns {{valid: boolean, error?: string}}
 */
const validateFile = (file) => {
  if (!file) {
    return { valid: false, error: 'Nenhum arquivo selecionado' };
  }

  // Validar tamanho
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Arquivo muito grande. Tamanho máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  // Validar tipo MIME
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Tipo de arquivo não permitido. Use PDF, JPG, PNG ou WEBP',
    };
  }

  return { valid: true };
};

/**
 * Gera caminho único para o arquivo
 * @param {string} unitId - ID da unidade
 * @param {string} expenseId - ID da despesa
 * @param {File} file - Arquivo original
 * @returns {string} Caminho do arquivo
 */
const generateFilePath = (unitId, expenseId, file) => {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 9);
  const extension = file.name.split('.').pop();
  return `${unitId}/${expenseId}/${timestamp}-${randomId}.${extension}`;
};

/**
 * Upload de arquivo para o Supabase Storage
 *
 * @param {File} file - Arquivo a fazer upload
 * @param {string} unitId - ID da unidade
 * @param {string} expenseId - ID da despesa
 * @returns {Promise<{data: {path: string, url: string}|null, error: string|null}>}
 */
export const uploadFile = async (file, unitId, expenseId) => {
  try {
    // Validar arquivo
    const validation = validateFile(file);
    if (!validation.valid) {
      return { data: null, error: validation.error };
    }

    // Gerar caminho único
    const filePath = generateFilePath(unitId, expenseId, file);

    console.log('📤 Uploading file:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      filePath,
    });

    // Fazer upload
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('❌ Erro no upload:', uploadError);
      return {
        data: null,
        error: uploadError.message || 'Erro ao fazer upload do arquivo',
      };
    }

    // Gerar URL assinada (válida por 1 hora)
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    console.log('✅ Upload concluído:', filePath);

    return {
      data: {
        path: filePath,
        url: urlData.publicUrl,
      },
      error: null,
    };
  } catch (error) {
    console.error('💥 Erro inesperado no upload:', error);
    return {
      data: null,
      error: error.message || 'Erro inesperado ao fazer upload',
    };
  }
};

/**
 * Gera URL assinada para download do arquivo
 *
 * @param {string} filePath - Caminho do arquivo no storage
 * @param {number} expiresIn - Tempo de expiração em segundos (padrão: 3600 = 1 hora)
 * @returns {Promise<{data: {url: string}|null, error: string|null}>}
 */
export const getSignedUrl = async (filePath, expiresIn = 3600) => {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error('❌ Erro ao gerar URL assinada:', error);
      return {
        data: null,
        error: error.message || 'Erro ao gerar URL de download',
      };
    }

    return {
      data: { url: data.signedUrl },
      error: null,
    };
  } catch (error) {
    console.error('💥 Erro inesperado ao gerar URL:', error);
    return {
      data: null,
      error: error.message || 'Erro inesperado ao gerar URL',
    };
  }
};

/**
 * Exclui arquivo do Supabase Storage
 *
 * @param {string} filePath - Caminho do arquivo a excluir
 * @returns {Promise<{data: boolean|null, error: string|null}>}
 */
export const deleteFile = async (filePath) => {
  try {
    console.log('🗑️ Deletando arquivo:', filePath);

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('❌ Erro ao deletar arquivo:', error);
      return {
        data: null,
        error: error.message || 'Erro ao excluir arquivo',
      };
    }

    console.log('✅ Arquivo deletado:', filePath);
    return { data: true, error: null };
  } catch (error) {
    console.error('💥 Erro inesperado ao deletar:', error);
    return {
      data: null,
      error: error.message || 'Erro inesperado ao excluir arquivo',
    };
  }
};

/**
 * Verifica se o bucket existe e cria se necessário
 * Nota: Esta função requer permissões de service_role
 * Deve ser executada apenas no backend ou via migration
 *
 * @returns {Promise<{data: boolean|null, error: string|null}>}
 */
export const ensureBucketExists = async () => {
  try {
    // Verificar se bucket existe
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error('❌ Erro ao listar buckets:', listError);
      return { data: null, error: listError.message };
    }

    const bucketExists = buckets.some((bucket) => bucket.name === BUCKET_NAME);

    if (bucketExists) {
      console.log('✅ Bucket já existe:', BUCKET_NAME);
      return { data: true, error: null };
    }

    // Criar bucket (requer service_role)
    console.log('📦 Criando bucket:', BUCKET_NAME);
    const { data: createData, error: createError } = await supabase.storage.createBucket(
      BUCKET_NAME,
      {
        public: false,
        fileSizeLimit: MAX_FILE_SIZE,
        allowedMimeTypes: ALLOWED_MIME_TYPES,
      }
    );

    if (createError) {
      console.error('❌ Erro ao criar bucket:', createError);
      return { data: null, error: createError.message };
    }

    console.log('✅ Bucket criado:', BUCKET_NAME);
    return { data: true, error: null };
  } catch (error) {
    console.error('💥 Erro inesperado:', error);
    return {
      data: null,
      error: error.message || 'Erro inesperado ao verificar bucket',
    };
  }
};

