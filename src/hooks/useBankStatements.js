import { useState, useEffect, useCallback, useRef } from 'react';
import { bankStatementsService } from '../services/bankStatementsService';
import { useToast } from '../context/ToastContext';

/**
 * Custom hook para gerenciar extratos bancários
 *
 * @param {string} accountId - ID da conta bancária
 * @param {string} startDate - Data de início (ISO string)
 * @param {string} endDate - Data de fim (ISO string)
 * @returns {Object} { statements, unreconciled, loading, error, refetch, importStatements, getStatementById }
 */
export const useBankStatements = (accountId, startDate, endDate) => {
  const [state, setState] = useState({
    statements: [],
    unreconciled: [],
    loading: true,
    error: null,
  });

  // Proteção contra ausência de ToastContext
  const toast = useToast();
  const safeAddToast = useCallback(
    toastData => {
      if (toast?.addToast) {
        toast.addToast(toastData);
      }
    },
    [toast]
  );

  const cacheRef = useRef(new Map());
  const abortControllerRef = useRef(null);

  // Função para gerar chave de cache
  const getCacheKey = useCallback((type, accountId, startDate, endDate) => {
    return `bank_statements_${type}_${accountId}_${startDate}_${endDate}`;
  }, []);

  // Função para buscar extratos
  const fetchStatements = useCallback(
    async (showLoading = true) => {
      if (!accountId) {
        setState(prev => ({
          ...prev,
          statements: [],
          unreconciled: [],
          loading: false,
        }));
        return;
      }

      // Cancelar requisição anterior se existir
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      const allStatementsKey = getCacheKey(
        'all',
        accountId,
        startDate,
        endDate
      );
      const unreconciledKey = getCacheKey('unreconciled', accountId, '', '');

      // Verificar cache (TTL: 60 segundos para statements)
      const cachedAll = cacheRef.current.get(allStatementsKey);
      const cachedUnreconciled = cacheRef.current.get(unreconciledKey);

      if (
        cachedAll &&
        cachedUnreconciled &&
        Date.now() - cachedAll.timestamp < 60000 &&
        Date.now() - cachedUnreconciled.timestamp < 60000
      ) {
        setState(prev => ({
          ...prev,
          statements: cachedAll.data,
          unreconciled: cachedUnreconciled.data,
          loading: false,
          error: null,
        }));
        return;
      }

      if (showLoading) {
        setState(prev => ({ ...prev, loading: true, error: null }));
      }

      try {
        // Buscar statements e unreconciled em paralelo
        const shouldFetchRange = Boolean(startDate && endDate);
        const statementsPromise = shouldFetchRange
          ? bankStatementsService.getStatements({
              accountId,
              startDate,
              endDate,
            })
          : Promise.resolve({ data: [], error: null });

        const [statementsResult, unreconciledResult] = await Promise.all([
          statementsPromise,
          bankStatementsService.getUnreconciledStatements(accountId),
        ]);

        if (statementsResult.error || unreconciledResult.error) {
          const error = statementsResult.error || unreconciledResult.error;
          throw error;
        }

        const statements = statementsResult.data || [];
        const unreconciled = unreconciledResult.data || [];

        // Armazenar no cache
        cacheRef.current.set(allStatementsKey, {
          data: statements,
          timestamp: Date.now(),
        });

        cacheRef.current.set(unreconciledKey, {
          data: unreconciled,
          timestamp: Date.now(),
        });

        setState(prev => ({
          ...prev,
          statements,
          unreconciled,
          loading: false,
          error: null,
        }));
      } catch (err) {
        if (err.name !== 'AbortError') {
          setState(prev => ({
            ...prev,
            loading: false,
            error: err.message || 'Erro ao carregar extratos',
          }));

          safeAddToast({
            type: 'error',
            title: 'Erro ao carregar extratos',
            message: 'Não foi possível carregar os extratos bancários',
          });
        }
      }
    },
    [accountId, startDate, endDate, getCacheKey, safeAddToast]
  );

  // Função para buscar statement por ID
  const getStatementById = useCallback(
    async statementId => {
      try {
        // Primeiro tentar buscar no cache local
        const cachedStatements = [...state.statements, ...state.unreconciled];

        const localStatement = cachedStatements.find(
          stmt => stmt.id === statementId
        );
        if (localStatement) {
          return { success: true, data: localStatement };
        }

        // Se não encontrar, buscar no servidor
        const { data, error } =
          await bankStatementsService.getStatementById(statementId);

        if (error) throw error;

        return { success: true, data };
      } catch (err) {
        safeAddToast({
          type: 'error',
          title: 'Erro ao buscar extrato',
          message: 'Não foi possível encontrar o extrato especificado',
        });

        return { success: false, error: err.message };
      }
    },
    [state.statements, state.unreconciled, safeAddToast]
  );

  // Funcao para importar extratos
  const importStatements = useCallback(
    async (payload = {}) => {
      const targetAccountId =
        payload.account_id || payload.accountId || accountId;

      if (!targetAccountId) {
        return {
          success: false,
          error: 'Account ID eh obrigatorio para importacao',
        };
      }

      const sanitizeAmount = value => {
        if (typeof value === 'number') return value;
        if (typeof value !== 'string') return null;

        const normalized = value
          .replace(/\s+/g, '')
          .replace(/\./g, '')
          .replace(',', '.');

        const parsed = parseFloat(normalized);
        return Number.isNaN(parsed) ? null : parsed;
      };

      let statements = Array.isArray(payload.statements)
        ? payload.statements
        : null;

      if (!statements && Array.isArray(payload.preview_data)) {
        statements = payload.preview_data
          .filter(row => !row.hasErrors)
          .map(row => {
            const amount = sanitizeAmount(row.amount ?? row.valor);

            return {
              transaction_date:
                row.transaction_date || row.data || row.date || null,
              description: row.description || row.descricao || '',
              amount: amount ?? 0,
              type:
                row.type ||
                (row.tipo === 'C'
                  ? 'Credit'
                  : row.tipo === 'D'
                    ? 'Debit'
                    : null),
              document: row.documento || row.document || null,
              balance_after:
                sanitizeAmount(row.balance_after ?? row.saldo) ?? null,
            };
          })
          .filter(statement => statement.transaction_date);
      }

      if (!statements || statements.length === 0) {
        return { success: false, error: 'Nenhum dado valido para importar' };
      }

      const servicePayload = {
        accountId: targetAccountId,
        statements,
        options: {
          settings: payload.settings,
          columnMapping: payload.column_mapping || payload.columnMapping,
          filename: payload.file?.name || payload.filename,
          format: payload.format,
        },
      };

      try {
        setState(prev => ({ ...prev, loading: true }));

        const { data, error } =
          await bankStatementsService.importStatements(servicePayload);

        if (error) throw error;

        cacheRef.current.clear();

        await fetchStatements(false);

        safeAddToast({
          type: 'success',
          title: 'Importacao concluida',
          message: `${data?.imported || 0} registros importados. ${data?.duplicates || 0} duplicatas ignoradas.`,
        });

        return {
          success: true,
          data: {
            imported: data?.imported || 0,
            duplicates: data?.duplicates || 0,
            total: data?.total || statements.length,
          },
        };
      } catch (err) {
        setState(prev => ({ ...prev, loading: false }));

        safeAddToast({
          type: 'error',
          title: 'Erro na importacao',
          message: err.message || 'Nao foi possivel importar o arquivo',
        });

        return { success: false, error: err.message };
      }
    },
    [accountId, safeAddToast, fetchStatements]
  );
  // Função para refetch (limpa cache)
  const refetch = useCallback(() => {
    cacheRef.current.clear();
    fetchStatements();
  }, [fetchStatements]);

  // Effect para buscar statements quando parâmetros mudarem
  useEffect(() => {
    fetchStatements();

    // Cleanup na desmontagem
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchStatements]);

  // Cleanup do cache quando componente for desmontado
  useEffect(() => {
    const cache = cacheRef.current;
    return () => {
      cache.clear();
    };
  }, []);

  return {
    statements: state.statements,
    unreconciled: state.unreconciled,
    loading: state.loading,
    error: state.error,
    refetch,
    importStatements,
    getStatementById,
  };
};

export default useBankStatements;
