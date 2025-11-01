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
    <div className="p-4 bg-light-bg dark:bg-dark-bg dark:bg-dark-surface rounded-lg border space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-theme-primary dark:text-gray-100">
          🔍 Debug de Autenticação
        </h3>
        <div className="flex gap-2">
          <button
            onClick={runDebugTests}
            className="px-3 py-1 bg-blue-500 text-dark-text-primary rounded text-sm hover:bg-blue-600"
          >
            Recarregar
          </button>
          <button
            onClick={forceSessionRefresh}
            className="px-3 py-1 bg-green-500 text-dark-text-primary rounded text-sm hover:bg-green-600"
          >
            Refresh Sessão
          </button>
        </div>
      </div>

      {/* Status Geral */}
      <div className="grid grid-cols-2 gap-4">
        <div
          className={`p-3 rounded ${isAuthValid ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'} border`}
        >
          <h4 className="font-medium text-sm">JWT Frontend</h4>
          <p
            className={`text-xs ${isAuthValid ? 'text-green-700' : 'text-red-700'}`}
          >
            {isAuthValid ? '✅ Válido' : '❌ Inválido'}
          </p>
        </div>

        <div
          className={`p-3 rounded ${isRLSWorking ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'} border`}
        >
          <h4 className="font-medium text-sm">RLS Backend</h4>
          <p
            className={`text-xs ${isRLSWorking ? 'text-green-700' : 'text-red-700'}`}
          >
            {isRLSWorking ? '✅ Funcionando' : '❌ Falha'}
          </p>
        </div>
      </div>

      {/* Detalhes do AuthContext */}
      <div className="bg-blue-50 border border-blue-200 rounded p-3">
        <h4 className="font-medium text-blue-800 mb-2">AuthContext</h4>
        <pre className="text-xs text-blue-700 whitespace-pre-wrap overflow-x-auto">
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
      <div className="bg-green-50 border border-green-200 rounded p-3">
        <h4 className="font-medium text-green-800 mb-2">Service Auth Check</h4>
        <pre className="text-xs text-green-700 whitespace-pre-wrap overflow-x-auto">
          {JSON.stringify(debugData.authService, null, 2)}
        </pre>
      </div>

      {/* Teste RLS */}
      <div className="bg-purple-50 border border-purple-200 rounded p-3">
        <h4 className="font-medium text-purple-800 mb-2">RLS Context Test</h4>
        <pre className="text-xs text-purple-700 whitespace-pre-wrap overflow-x-auto">
          {JSON.stringify(debugData.rlsTest, null, 2)}
        </pre>
      </div>

      {/* Diagnóstico */}
      <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
        <h4 className="font-medium text-yellow-800 mb-2">🎯 Diagnóstico</h4>
        <div className="text-sm text-yellow-700 space-y-1">
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
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-sm text-theme-secondary mt-2">
            Executando testes...
          </p>
        </div>
      )}
    </div>
  );
}
