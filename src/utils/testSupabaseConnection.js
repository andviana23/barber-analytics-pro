/**
 * Utilitário para testar conexão com Supabase
 * Use no console do navegador: testSupabaseConnection()
 */

import { supabase } from '../services/supabase';

export async function testSupabaseConnection() {
  console.log('🔍 Testando conexão com Supabase...\n');

  // Teste 1: Verificar configuração
  console.log('📋 Teste 1: Configuração');
  console.log('  URL:', import.meta.env.VITE_SUPABASE_URL);
  console.log(
    '  Key:',
    import.meta.env.VITE_SUPABASE_ANON_KEY
      ? '✅ Configurada'
      : '❌ Não configurada'
  );

  // Teste 2: Health check básico
  console.log('\n📡 Teste 2: Health Check (query simples)');
  try {
    const { data, error } = await supabase
      .from('units')
      .select('count', { count: 'exact', head: true });

    if (error) {
      console.error('  ❌ Erro:', error.message);
      console.error('  Código:', error.code);
      console.error('  Details:', error.details);

      if (
        error.message.includes('CORS') ||
        error.message.includes('Failed to fetch')
      ) {
        console.log('\n🚨 PROBLEMA DE CORS DETECTADO!');
        console.log('📝 Solução:');
        console.log(
          '   1. Acesse: https://supabase.com/dashboard/project/cwfrtqtienguzwsybvwm/settings/auth'
        );
        console.log('   2. Configure "Site URL" para: http://localhost:5173');
        console.log(
          '   3. Adicione em "Redirect URLs": http://localhost:5173/**'
        );
        console.log('   4. Salve e aguarde 30 segundos');
      }
    } else {
      console.log('  ✅ Conexão OK!');
    }
  } catch (err) {
    console.error('  ❌ Erro de rede:', err.message);

    if (
      err.message.includes('NetworkError') ||
      err.message.includes('Failed to fetch')
    ) {
      console.log('\n🚨 PROBLEMA DE REDE/CORS!');
      console.log('Verifique:');
      console.log('  1. Internet está funcionando?');
      console.log('  2. CORS configurado no Supabase?');
      console.log('  3. URL do Supabase está correta?');
    }
  }

  // Teste 3: Auth endpoint
  console.log('\n🔐 Teste 3: Auth Endpoint');
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error('  ❌ Erro:', error.message);
    } else {
      console.log('  ✅ Auth endpoint respondeu!');
      console.log('  Sessão ativa:', data.session ? 'Sim' : 'Não');
    }
  } catch (err) {
    console.error('  ❌ Erro:', err.message);
  }

  // Teste 4: Teste de login simulado (sem credenciais reais)
  console.log(
    '\n🧪 Teste 4: Simulando login (vai dar erro de credenciais, mas isso é esperado)'
  );
  try {
    const { data, error } = await Promise.race([
      supabase.auth.signInWithPassword({
        email: 'test@test.com',
        password: 'test123',
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT')), 5000)
      ),
    ]);

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        console.log(
          '  ✅ Endpoint de login funcionando! (erro de credenciais é esperado)'
        );
      } else {
        console.error('  ⚠️  Erro inesperado:', error.message);
      }
    }
  } catch (err) {
    if (err.message === 'TIMEOUT') {
      console.error('  ❌ TIMEOUT! Login travou por 5+ segundos');
      console.log('  🚨 CORS não está configurado corretamente!');
    } else {
      console.error('  ❌ Erro:', err.message);
    }
  }

  console.log('\n✅ Diagnóstico completo!\n');
}

// Exportar para uso global no console
if (typeof window !== 'undefined') {
  window.testSupabaseConnection = testSupabaseConnection;
  console.log(
    '💡 Use testSupabaseConnection() no console para diagnosticar problemas'
  );
}
