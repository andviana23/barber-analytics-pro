import { createClient } from '@supabase/supabase-js';

// Configuração do cliente Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Criar cliente com persistência automática de sessão
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Armazenar sessão no localStorage para persistência entre reloads
    storage: window.localStorage,
    // Persistir sessão automaticamente
    autoRefreshToken: true,
    // Detectar mudanças de sessão automaticamente
    persistSession: true,
    // Detectar mudanças no localStorage de outras tabs
    detectSessionInUrl: true,
  },
});

// Log para debug (remover em produção)
supabase.auth.onAuthStateChange((event, session) => {
  console.log('🔐 [Supabase] Auth State Changed:', event, {
    hasSession: !!session,
    userId: session?.user?.id,
    role: session?.user?.user_metadata?.role,
  });
});
