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
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
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
      <h2 className="text-2xl font-bold mb-4">
        🔍 Diagnóstico de Autenticação
      </h2>

      {/* AuthContext */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">1. AuthContext</h3>
        <pre className="text-sm text-blue-700 whitespace-pre-wrap">
          {JSON.stringify(diagnostics.authContext, null, 2)}
        </pre>
      </div>

      {/* Supabase Session */}
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <h3 className="font-semibold text-green-800 mb-2">
          2. Sessão Supabase
        </h3>
        <pre className="text-sm text-green-700 whitespace-pre-wrap">
          {JSON.stringify(diagnostics.supabaseSession, null, 2)}
        </pre>
      </div>

      {/* RLS Test */}
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <h3 className="font-semibold text-purple-800 mb-2">3. Teste RLS</h3>
        <pre className="text-sm text-purple-700 whitespace-pre-wrap">
          {JSON.stringify(diagnostics.rlsTest, null, 2)}
        </pre>
      </div>

      {/* Professional Query */}
      <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
        <h3 className="font-semibold text-orange-800 mb-2">
          4. Query de Profissionais
        </h3>
        <pre className="text-sm text-orange-700 whitespace-pre-wrap">
          {JSON.stringify(diagnostics.professionalQuery, null, 2)}
        </pre>
        {diagnostics.professionalQuery?.error && (
          <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded">
            <p className="text-red-800 font-semibold">❌ Erro identificado:</p>
            <p className="text-red-700">
              {diagnostics.professionalQuery.error.message}
            </p>
          </div>
        )}
      </div>

      {/* Recomendações */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-2">🎯 Recomendações</h3>
        <ul className="list-disc list-inside space-y-1 text-gray-700">
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
