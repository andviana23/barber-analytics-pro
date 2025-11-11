/**
 * @fileoverview Supabase Admin Client
 * @module lib/supabaseAdmin
 * @description Cliente Supabase com service_role key para operações server-side que bypass RLS
 *
 * IMPORTANTE:
 * - Use apenas em código server-side (APIs, cron jobs, scripts CLI)
 * - NUNCA exponha para o client-side
 * - Bypass todas as RLS policies - usar com cuidado
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabaseAdmin: SupabaseClient | null = null;

/**
 * Getter lazy para supabaseAdmin - cria apenas quando necessário
 * Isso permite que variáveis de ambiente sejam carregadas antes da criação
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (_supabaseAdmin) {
    return _supabaseAdmin;
  }

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;

  if (!supabaseUrl) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL ou VITE_SUPABASE_URL deve estar configurado'
    );
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY deve estar configurado');
  }

  _supabaseAdmin = createClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  return _supabaseAdmin;
}

/**
 * Cliente Supabase com service_role key
 * - Bypass RLS policies
 * - Acesso total ao banco
 * - Usar apenas server-side
 */
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    return getSupabaseAdmin()[prop as keyof SupabaseClient];
  },
});

/**
 * Verifica se o cliente admin está configurado corretamente
 */
export async function verifyAdminConnection(): Promise<boolean> {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from('units')
      .select('id')
      .limit(1);
    return !error;
  } catch (error) {
    console.error('Erro ao verificar conexão admin:', error);
    return false;
  }
}
