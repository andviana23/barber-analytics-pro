import { useCallback } from 'react';
import auditService from '../services/auditService';
import { useAuth } from '../context/AuthContext';

/**
 * Hook personalizado para sistema de auditoria
 * Facilita o uso do auditService com contexto de autenticação
 */
export const useAudit = () => {
  const { user } = useAuth();

  // Log de visualização de página
  const logPageView = useCallback((page, metadata = {}) => {
    if (!user) return;
    
    return auditService.logPageView(page, {
      ...metadata,
      user_id: user.id,
      timestamp: new Date().toISOString()
    });
  }, [user]);

  // Log de ações CRUD
  const logCreate = useCallback((table, recordId, data = {}) => {
    if (!user) return;
    
    return auditService.logCreate(table, recordId, {
      ...data,
      created_by: user.id,
      timestamp: new Date().toISOString()
    });
  }, [user]);

  const logUpdate = useCallback((table, recordId, oldData = {}, newData = {}) => {
    if (!user) return;
    
    return auditService.logUpdate(table, recordId, oldData, {
      ...newData,
      updated_by: user.id,
      timestamp: new Date().toISOString()
    });
  }, [user]);

  const logDelete = useCallback((table, recordId, data = {}) => {
    if (!user) return;
    
    return auditService.logDelete(table, recordId, {
      ...data,
      deleted_by: user.id,
      timestamp: new Date().toISOString()
    });
  }, [user]);

  // Log de erro
  const logError = useCallback((operation, error) => {
    return auditService.logError(operation, {
      ...error,
      user_id: user?.id,
      timestamp: new Date().toISOString()
    });
  }, [user]);

  // Log de ação personalizada
  const logAction = useCallback((action, resource = null, details = {}) => {
    if (!user) return;
    
    return auditService.logAction(action, resource, {
      ...details,
      user_id: user.id,
      timestamp: new Date().toISOString()
    });
  }, [user]);

  // Buscar logs (apenas para admins/gerentes)
  const getLogs = useCallback((filters = {}, page = 1, limit = 50) => {
    return auditService.getLogs(filters, page, limit);
  }, []);

  // Estatísticas de logs
  const getLogStats = useCallback((filters = {}) => {
    return auditService.getLogStats(filters);
  }, []);

  return {
    // Métodos principais
    logPageView,
    logCreate,
    logUpdate,
    logDelete,
    logError,
    logAction,
    
    // Consultas (para admins)
    getLogs,
    getLogStats,
    
    // Estado
    isAuthenticated: !!user
  };
};

export default useAudit;