/**
 * @fileoverview Helper para autenticação JWT em rotas API
 * @module lib/auth/apiAuth
 * @description Valida tokens JWT do Supabase em rotas Next.js API
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';
import { logger } from '../logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Resultado da autenticação
 */
export interface AuthResult {
  authenticated: boolean;
  userId?: string;
  userEmail?: string;
  unitIds?: string[];
  error?: string;
}

/**
 * Autentica requisição usando Bearer JWT token
 *
 * @param request - Next.js request object
 * @returns Resultado da autenticação com informações do usuário
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        authenticated: false,
        error: 'Missing or invalid Authorization header',
      };
    }

    const token = authHeader.substring(7); // Remove "Bearer "

    // Criar cliente Supabase para validar token
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // Verificar token e obter usuário
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      logger.warn('Falha na autenticação', {
        error: authError?.message,
      });
      return {
        authenticated: false,
        error: authError?.message || 'Invalid token',
      };
    }

    // Buscar unidades do usuário (via professionals)
    const { data: professionals, error: profError } = await supabase
      .from('professionals')
      .select('unit_id')
      .eq('user_id', user.id)
      .eq('is_active', true);

    const unitIds = professionals?.map(p => p.unit_id) || [];

    return {
      authenticated: true,
      userId: user.id,
      userEmail: user.email,
      unitIds,
    };
  } catch (error) {
    logger.error('Erro ao autenticar requisição', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      authenticated: false,
      error: 'Authentication failed',
    };
  }
}

/**
 * Valida se o usuário tem acesso à unidade especificada
 *
 * @param authResult - Resultado da autenticação
 * @param unitId - ID da unidade a validar
 * @returns true se usuário tem acesso à unidade
 */
export function hasUnitAccess(authResult: AuthResult, unitId: string): boolean {
  if (!authResult.authenticated || !authResult.unitIds) {
    return false;
  }

  return authResult.unitIds.includes(unitId);
}

