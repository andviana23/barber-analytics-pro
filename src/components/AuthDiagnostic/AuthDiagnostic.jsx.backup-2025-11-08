import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';

/**
 * Componente para diagnosticar problemas de autenticação e RLS
 */
export function AuthDiagnostic() {
  const { user } = useAuth();
  const [diagnostics, setDiagnostics] = useState({
    authContext: null,
    supabaseSession: null,
    rlsTest: null,
    professionalQuery: null,
  });
  useEffect(() => {
    async function runDiagnostics() {
      console.log('🔍 Iniciando diagnósticos de autenticação...');

      // 1. Estado do AuthContext
      const authContextData = {
        hasUser: !!user,
        userId: user?.id,
        email: user?.email,
        role: user?.user_metadata?.role,
      };

      // 2. Sessão do Supabase
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      const supabaseSessionData = {
        hasSession: !!session,
        userId: session?.user?.id,
        email: session?.user?.email,
        role: session?.user?.user_metadata?.role,
        tokenExpiry: session?.expires_at
          ? new Date(session.expires_at * 1000)
          : null,
        error: sessionError,
      };

      // 3. Teste de RLS com função auth.uid()
      const { data: rlsData, error: rlsError } = await supabase
        .rpc('get_current_user_info')
        .single();
      const rlsTestData = {
        data: rlsData,
        error: rlsError,
      };

      // 4. Teste direto da tabela professionals
      const { data: profData, error: profError } = await supabase
        .from('professionals')
        .select('id, name, role, unit_id')
        .limit(3);
      const professionalQueryData = {
        data: profData,
        error: profError,
        count: profData?.length || 0,
      };
      setDiagnostics({
        authContext: authContextData,
        supabaseSession: supabaseSessionData,
        rlsTest: rlsTestData,
        professionalQuery: professionalQueryData,
      });
      console.log('📊 Diagnósticos completos:', {
        authContextData,
        supabaseSessionData,
        rlsTestData,
        professionalQueryData,
      });
    }
    if (user) {
      runDiagnostics();
    }
  }, [user]);
  if (!user) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <h3 className="font-semibold text-yellow-800">
          ⚠️ Usuário não autenticado
        </h3>
        <p className="text-yellow-700">
          Faça login para executar os diagnósticos.
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <h2 className="mb-4 text-2xl font-bold">
        🔍 Diagnóstico de Autenticação
      </h2>

      {/* AuthContext */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h3 className="mb-2 font-semibold text-blue-800">1. AuthContext</h3>
        <pre className="whitespace-pre-wrap text-sm text-blue-700">
          {JSON.stringify(diagnostics.authContext, null, 2)}
        </pre>
      </div>

      {/* Supabase Session */}
      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
        <h3 className="mb-2 font-semibold text-green-800">
          2. Sessão Supabase
        </h3>
        <pre className="whitespace-pre-wrap text-sm text-green-700">
          {JSON.stringify(diagnostics.supabaseSession, null, 2)}
        </pre>
      </div>

      {/* RLS Test */}
      <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
        <h3 className="mb-2 font-semibold text-purple-800">3. Teste RLS</h3>
        <pre className="whitespace-pre-wrap text-sm text-purple-700">
          {JSON.stringify(diagnostics.rlsTest, null, 2)}
        </pre>
      </div>

      {/* Professional Query */}
      <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
        <h3 className="mb-2 font-semibold text-orange-800">
          4. Query de Profissionais
        </h3>
        <pre className="whitespace-pre-wrap text-sm text-orange-700">
          {JSON.stringify(diagnostics.professionalQuery, null, 2)}
        </pre>
        {diagnostics.professionalQuery?.error && (
          <div className="mt-2 rounded border border-red-300 bg-red-100 p-2">
            <p className="font-semibold text-red-800">❌ Erro identificado:</p>
            <p className="text-red-700">
              {diagnostics.professionalQuery.error.message}
            </p>
          </div>
        )}
      </div>

      {/* Recomendações */}
      <div className="rounded-lg border border-light-border bg-light-bg p-4 dark:border-dark-border dark:bg-dark-bg">
        <h3 className="text-theme-primary mb-2 font-semibold">
          🎯 Recomendações
        </h3>
        <ul className="list-inside list-disc space-y-1 text-gray-700 dark:text-gray-300 dark:text-gray-600">
          <li>
            Se RLS Test falhar: Problema nas políticas RLS ou usuário sem perfil
          </li>
          <li>
            Se Professional Query falhar: Verificar se usuário tem permissão na
            tabela
          </li>
          <li>
            Se AuthContext e Supabase Session divergirem: Problema de
            sincronização
          </li>
          <li>Se token estiver expirado: Necessário refresh da sessão</li>
        </ul>
      </div>
    </div>
  );
}
