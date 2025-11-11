/**
 * @fileoverview API Endpoint: Alerts Query
 * @module app/api/alerts/query
 * @description Endpoint para buscar e filtrar alertas
 *
 * GET /api/alerts/query?unitId={id}&status={status}&severity={severity}&startDate={date}&endDate={date}&page={page}&limit={limit}
 *
 * Autenticação: Bearer JWT (Supabase Auth)
 *
 * @see CHECKLIST_IA_FINANCEIRA.md - Seção 4.3
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, hasUnitAccess } from '@/lib/auth/apiAuth';
import { alertsRepository, AlertStatus, AlertSeverity } from '@/lib/repositories/alertsRepository';
import { logger } from '@/lib/logger';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/alerts/query
 *
 * Busca alertas com filtros e paginação
 *
 * Query Parameters:
 * - unitId (obrigatório) - ID da unidade
 * - status (opcional) - Status do alerta: OPEN, RESOLVED, IGNORED
 * - severity (opcional) - Severidade: LOW, MEDIUM, HIGH, CRITICAL
 * - startDate (opcional) - Data inicial (YYYY-MM-DD)
 * - endDate (opcional) - Data final (YYYY-MM-DD)
 * - page (opcional) - Número da página (padrão: 1)
 * - limit (opcional) - Itens por página (padrão: 20, máximo: 100)
 *
 * @param request - Next.js request object
 * @returns JSON com alertas filtrados e informações de paginação
 */
export async function GET(request: NextRequest) {
  const correlationId = `alerts-query-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();

  logger.info('Consulta de alertas solicitada', {
    correlationId,
    timestamp: new Date().toISOString(),
  });

  try {
    // 1. Autenticar requisição
    const authResult = await authenticateRequest(request);

    if (!authResult.authenticated) {
      logger.warn('Tentativa de acesso não autenticada', {
        correlationId,
        error: authResult.error,
      });
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: authResult.error || 'Authentication required',
          correlationId,
        },
        { status: 401 }
      );
    }

    // 2. Extrair query parameters
    const { searchParams } = new URL(request.url);
    const unitId = searchParams.get('unitId');
    const statusParam = searchParams.get('status');
    const severityParam = searchParams.get('severity');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');

    if (!unitId) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'unitId is required',
          correlationId,
        },
        { status: 400 }
      );
    }

    // 3. Validar acesso à unidade
    if (!hasUnitAccess(authResult, unitId)) {
      logger.warn('Tentativa de acesso a unidade não autorizada', {
        correlationId,
        userId: authResult.userId,
        unitId,
        userUnits: authResult.unitIds,
      });
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'You do not have access to this unit',
          correlationId,
        },
        { status: 403 }
      );
    }

    // 4. Validar e parsear parâmetros
    const page = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1;
    const limit = limitParam
      ? Math.min(100, Math.max(1, parseInt(limitParam, 10)))
      : 20;
    const offset = (page - 1) * limit;

    // Validar status
    let status: AlertStatus | undefined;
    if (statusParam) {
      if (!['OPEN', 'RESOLVED', 'IGNORED'].includes(statusParam)) {
        return NextResponse.json(
          {
            error: 'Bad Request',
            message: 'status must be OPEN, RESOLVED, or IGNORED',
            correlationId,
          },
          { status: 400 }
        );
      }
      status = statusParam as AlertStatus;
    }

    // Validar severity
    let severity: AlertSeverity | undefined;
    if (severityParam) {
      if (!['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(severityParam)) {
        return NextResponse.json(
          {
            error: 'Bad Request',
            message: 'severity must be LOW, MEDIUM, HIGH, or CRITICAL',
            correlationId,
          },
          { status: 400 }
        );
      }
      severity = severityParam as AlertSeverity;
    }

    // Validar datas
    const startDate = startDateParam ? new Date(startDateParam) : undefined;
    const endDate = endDateParam ? new Date(endDateParam) : undefined;

    if (startDate && isNaN(startDate.getTime())) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'startDate must be a valid date (YYYY-MM-DD)',
          correlationId,
        },
        { status: 400 }
      );
    }

    if (endDate && isNaN(endDate.getTime())) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'endDate must be a valid date (YYYY-MM-DD)',
          correlationId,
        },
        { status: 400 }
      );
    }

    if (startDate && endDate && startDate > endDate) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'startDate must be before endDate',
          correlationId,
        },
        { status: 400 }
      );
    }

    logger.info('Parâmetros validados', {
      correlationId,
      userId: authResult.userId,
      unitId,
      status: status || 'all',
      severity: severity || 'all',
      startDate: startDate?.toISOString().split('T')[0],
      endDate: endDate?.toISOString().split('T')[0],
      page,
      limit,
    });

    // 5. Construir query com filtros
    let query = supabase
      .from('alerts_events')
      .select('*', { count: 'exact' })
      .eq('unit_id', unitId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (severity) {
      query = query.eq('severity', severity);
    }

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }

    if (endDate) {
      // Adicionar 1 dia para incluir o dia final completo
      const endDatePlusOne = new Date(endDate);
      endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
      query = query.lt('created_at', endDatePlusOne.toISOString());
    }

    // 6. Aplicar paginação
    query = query.range(offset, offset + limit - 1);

    // 7. Executar query
    const { data: alerts, error, count } = await query;

    if (error) {
      logger.error('Erro ao buscar alertas', {
        correlationId,
        unitId,
        error: error.message,
      });
      return NextResponse.json(
        {
          error: 'Internal Server Error',
          message: 'Failed to fetch alerts',
          correlationId,
        },
        { status: 500 }
      );
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    logger.info('Alertas buscados com sucesso', {
      correlationId,
      unitId,
      alertsCount: alerts?.length || 0,
      totalCount,
      page,
      totalPages,
      durationMs: Date.now() - startTime,
    });

    // 8. Preparar resposta
    return NextResponse.json({
      success: true,
      data: alerts || [],
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      filters: {
        unitId,
        status: status || null,
        severity: severity || null,
        startDate: startDate?.toISOString().split('T')[0] || null,
        endDate: endDate?.toISOString().split('T')[0] || null,
      },
      correlationId,
      durationMs: Date.now() - startTime,
    });
  } catch (error: any) {
    const durationMs = Date.now() - startTime;

    logger.error('Erro ao buscar alertas', {
      correlationId,
      error: error.message,
      stack: error.stack,
      durationMs,
    });

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error.message || 'Failed to fetch alerts',
        correlationId,
        durationMs,
      },
      { status: 500 }
    );
  }
}

