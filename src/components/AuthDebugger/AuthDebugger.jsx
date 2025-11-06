import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ProfissionaisService } from '../../services/profissionaisService';

/**
 * Componente para debug de autenticação em tempo real
 */
export function AuthDebugger() {
  const { user, session, userRole, adminStatus, forceSessionRefresh } =
    useAuth();
  const [debugData, setDebugData] = useState({
    authService: null,
    rlsTest: null,
    loading: true,
  });
  const runDebugTests = async () => {
    try {
      setDebugData(prev => ({
        ...prev,
        loading: true,
      }));

      // Test 1: Auth Service Debug
      const authServiceResult = await ProfissionaisService.debugSupabaseAuth();

      // Test 2: RLS Functions Test
      const rlsTestResult = await ProfissionaisService.testRLSFunctions();
      setDebugData({
        authService: authServiceResult,
        rlsTest: rlsTestResult,
        loading: false,
      });
    } catch (error) {
      setDebugData(prev => ({
        ...prev,
        error: error.message,
        loading: false,
      }));
    }
  };
  useEffect(() => {
    if (user) {
      runDebugTests();
    }
  }, [user]);
  const isAuthValid =
    debugData.authService?.hasSession && debugData.authService?.hasAccessToken;
  const isRLSWorking =
    debugData.rlsTest?.success && debugData.rlsTest?.data?.auth_uid;
  return (
    <div className="space-y-4 rounded-lg border bg-light-bg p-4 dark:bg-dark-bg dark:bg-dark-surface">
      <div className="flex items-center justify-between">
        <h3 className="text-theme-primary text-lg font-semibold dark:text-gray-100">
          🔍 Debug de Autenticação
        </h3>
        <div className="flex gap-2">
          <button
            onClick={runDebugTests}
            className="text-dark-text-primary rounded bg-blue-500 px-3 py-1 text-sm hover:bg-blue-600"
          >
            Recarregar
          </button>
          <button
            onClick={forceSessionRefresh}
            className="text-dark-text-primary rounded bg-green-500 px-3 py-1 text-sm hover:bg-green-600"
          >
            Refresh Sessão
          </button>
        </div>
      </div>

      {/* Status Geral */}
      <div className="grid grid-cols-2 gap-4">
        <div
          className={`rounded p-3 ${isAuthValid ? 'border-green-300 bg-green-100' : 'border-red-300 bg-red-100'} border`}
        >
          <h4 className="text-sm font-medium">JWT Frontend</h4>
          <p
            className={`text-xs ${isAuthValid ? 'text-green-700' : 'text-red-700'}`}
          >
            {isAuthValid ? '✅ Válido' : '❌ Inválido'}
          </p>
        </div>

        <div
          className={`rounded p-3 ${isRLSWorking ? 'border-green-300 bg-green-100' : 'border-red-300 bg-red-100'} border`}
        >
          <h4 className="text-sm font-medium">RLS Backend</h4>
          <p
            className={`text-xs ${isRLSWorking ? 'text-green-700' : 'text-red-700'}`}
          >
            {isRLSWorking ? '✅ Funcionando' : '❌ Falha'}
          </p>
        </div>
      </div>

      {/* Detalhes do AuthContext */}
      <div className="rounded border border-blue-200 bg-blue-50 p-3">
        <h4 className="mb-2 font-medium text-blue-800">AuthContext</h4>
        <pre className="overflow-x-auto whitespace-pre-wrap text-xs text-blue-700">
          {JSON.stringify(
            {
              hasUser: !!user,
              email: user?.email,
              hasSession: !!session,
              userRole,
              isAdmin:
                typeof adminStatus === 'function' ? adminStatus() : adminStatus,
            },
            null,
            2
          )}
        </pre>
      </div>

      {/* Detalhes do Service Auth */}
      <div className="rounded border border-green-200 bg-green-50 p-3">
        <h4 className="mb-2 font-medium text-green-800">Service Auth Check</h4>
        <pre className="overflow-x-auto whitespace-pre-wrap text-xs text-green-700">
          {JSON.stringify(debugData.authService, null, 2)}
        </pre>
      </div>

      {/* Teste RLS */}
      <div className="rounded border border-purple-200 bg-purple-50 p-3">
        <h4 className="mb-2 font-medium text-purple-800">RLS Context Test</h4>
        <pre className="overflow-x-auto whitespace-pre-wrap text-xs text-purple-700">
          {JSON.stringify(debugData.rlsTest, null, 2)}
        </pre>
      </div>

      {/* Diagnóstico */}
      <div className="rounded border border-yellow-200 bg-yellow-50 p-3">
        <h4 className="mb-2 font-medium text-yellow-800">🎯 Diagnóstico</h4>
        <div className="space-y-1 text-sm text-yellow-700">
          {!isAuthValid && (
            <p>• ❌ JWT inválido - Usuário não autenticado corretamente</p>
          )}
          {!isRLSWorking && (
            <p>• ❌ RLS não reconhece usuário - auth.uid() retorna null</p>
          )}
          {isAuthValid && !isRLSWorking && (
            <p>• ⚠️ Desconexão JWT ↔ RLS - Token não propagado para backend</p>
          )}
          {isAuthValid && isRLSWorking && (
            <p>• ✅ Autenticação funcionando corretamente!</p>
          )}
        </div>
      </div>

      {debugData.loading && (
        <div className="py-4 text-center">
          <div className="mx-auto h-6 w-6 animate-spin rounded-full border-b-2 border-blue-500"></div>
          <p className="text-theme-secondary mt-2 text-sm">
            Executando testes...
          </p>
        </div>
      )}
    </div>
  );
}
