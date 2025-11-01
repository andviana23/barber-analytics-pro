/**
 * @file DebugAuthPage.jsx
 * @description Página de debug para verificar autenticação e permissões
 * @author Barber Analytics Pro Team
 * @date 2025-10-26
 */

import React from 'react';
import { Layout } from '../components/Layout/Layout';
import { useAuth } from '../context/AuthContext';
import useUserPermissions from '../hooks/useUserPermissions';
import { Shield, User, Database, CheckCircle, XCircle } from 'lucide-react';
export function DebugAuthPage() {
  const {
    user,
    userRole,
    adminStatus,
    gerenteStatus,
    receptionistStatus,
    isAuthenticated,
  } = useAuth();

  // ✅ Usar o hook corrigido
  const userPermissions = useUserPermissions();
  const debugInfo = {
    isAuthenticated,
    userId: user?.id,
    email: user?.email,
    metadata_name: user?.user_metadata?.name,
    metadata_role: user?.user_metadata?.role,
    userRole,
    adminStatus,
    gerenteStatus,
    receptionistStatus,
  };
  const permissions = {
    canManageCashRegister: userPermissions.canManageCashRegister,
    canOpenCashRegister: userPermissions.canOpenCashRegister,
    canCloseCashRegister: userPermissions.canCloseCashRegister,
    canCreateOrder: userPermissions.canCreateOrder,
    canViewAllOrders: userPermissions.canViewAllOrders,
    canCloseOrder: userPermissions.canCloseOrder,
    canCancelOrder: userPermissions.canCancelOrder,
    canManageServices: userPermissions.canManageServices,
    canCreateService: userPermissions.canCreateService,
  };
  return (
    <Layout activeMenuItem="settings">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
              Debug de Autenticação
            </h1>
            <p className="text-text-light-secondary dark:text-text-dark-secondary">
              Informações detalhadas sobre autenticação e permissões
            </p>
          </div>
        </div>

        {/* Auth Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User Info Card */}
          <div className="card-theme border border-light-border dark:border-dark-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <User className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
                Informações do Usuário
              </h2>
            </div>
            <div className="space-y-3">
              {Object.entries(debugInfo).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between py-2 border-b border-light-border dark:border-dark-border last:border-0"
                >
                  <span className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary">
                    {key}:
                  </span>
                  <span className="text-sm font-mono text-text-light-primary dark:text-text-dark-primary flex items-center gap-2">
                    {typeof value === 'boolean' ? (
                      value ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )
                    ) : null}
                    {String(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Permissions Card */}
          <div className="card-theme border border-light-border dark:border-dark-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Database className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
                Permissões
              </h2>
            </div>
            <div className="space-y-3">
              {Object.entries(permissions).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between py-2 border-b border-light-border dark:border-dark-border last:border-0"
                >
                  <span className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary">
                    {key}:
                  </span>
                  <span className="flex items-center gap-2">
                    {value ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm font-mono text-text-light-primary dark:text-text-dark-primary">
                      {String(value)}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Raw User Object */}
        <div className="card-theme border border-light-border dark:border-dark-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-4">
            Objeto User Completo (JSON)
          </h2>
          <pre className="bg-light-bg dark:bg-dark-bg p-4 rounded-lg overflow-auto text-xs text-text-light-primary dark:text-text-dark-primary">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>

        {/* Access Test */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-amber-800 dark:text-amber-300 mb-2">
            ⚠️ Teste de Acesso ao Caixa
          </h2>
          <div className="space-y-2 text-sm text-amber-700 dark:text-amber-400">
            <p>
              <strong>Rota /caixa</strong> requer:{' '}
              <code className="bg-amber-100 dark:bg-amber-900 px-2 py-0.5 rounded">
                roles={`['admin', 'gerente', 'recepcionista']`}
              </code>
            </p>
            <p>
              <strong>Seu metadata role:</strong>{' '}
              <code className="bg-amber-100 dark:bg-amber-900 px-2 py-0.5 rounded">
                '{debugInfo.metadata_role}'
              </code>
            </p>
            <p>
              <strong>AdminStatus:</strong>{' '}
              <code className="bg-amber-100 dark:bg-amber-900 px-2 py-0.5 rounded">
                {String(debugInfo.adminStatus)}
              </code>
            </p>
            <div className="mt-4 p-4 bg-amber-100 dark:bg-amber-900/40 rounded-lg">
              <p className="font-semibold mb-2">Resultado Esperado:</p>
              {debugInfo.adminStatus ? (
                <p className="text-green-700 dark:text-green-400 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  ACESSO PERMITIDO (adminStatus = true)
                </p>
              ) : debugInfo.userRole &&
                ['admin', 'gerente', 'recepcionista'].includes(
                  debugInfo.userRole
                ) ? (
                <p className="text-green-700 dark:text-green-400 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  ACESSO PERMITIDO (role incluído na lista)
                </p>
              ) : (
                <p className="text-red-700 dark:text-red-400 flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  ACESSO NEGADO
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-2">
            📋 Como usar esta página
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-700 dark:text-blue-400">
            <li>
              Verifique se <code>isAuthenticated</code> é <code>true</code>
            </li>
            <li>
              Verifique se <code>metadata_role</code> está correto
            </li>
            <li>
              Verifique se <code>adminStatus</code> é <code>true</code> para
              admin
            </li>
            <li>
              Compare com as permissões necessárias para acessar cada rota
            </li>
            <li>
              Se adminStatus for <code>false</code>, faça logout e login
              novamente
            </li>
          </ol>
        </div>
      </div>
    </Layout>
  );
}
export default DebugAuthPage;
