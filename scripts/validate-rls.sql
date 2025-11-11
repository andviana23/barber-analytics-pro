-- =====================================================
-- 🔒 Script de Validação de RLS Policies
-- Barber Analytics Pro - IA Financeira
-- =====================================================

-- Verificar se RLS está ativado em todas as tabelas críticas
\echo '=== 1. Verificando RLS ativado ==='
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'ai_metrics_daily',
    'ai_analyses',
    'forecasts_cashflow',
    'alerts_events',
    'kpi_targets',
    'etl_runs'
  )
ORDER BY tablename;

-- Listar todas as policies
\echo ''
\echo '=== 2. Policies existentes ==='
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'ai_metrics_daily',
    'ai_analyses',
    'forecasts_cashflow',
    'alerts_events',
    'kpi_targets',
    'etl_runs'
  )
ORDER BY tablename, policyname;

-- Testar acesso a ai_metrics_daily
\echo ''
\echo '=== 3. Testando acesso a ai_metrics_daily ==='
SELECT
  COUNT(*) as total_records,
  COUNT(DISTINCT unit_id) as unique_units,
  MIN(date) as oldest_date,
  MAX(date) as newest_date
FROM ai_metrics_daily;

-- Testar acesso a alerts_events
\echo ''
\echo '=== 4. Testando acesso a alerts_events ==='
SELECT
  COUNT(*) as total_alerts,
  COUNT(DISTINCT unit_id) as unique_units,
  COUNT(CASE WHEN status = 'OPEN' THEN 1 END) as open_alerts,
  COUNT(CASE WHEN status = 'ACKNOWLEDGED' THEN 1 END) as acknowledged_alerts,
  COUNT(CASE WHEN severity = 'CRITICAL' THEN 1 END) as critical_alerts
FROM alerts_events;

-- Testar acesso a forecasts_cashflow
\echo ''
\echo '=== 5. Testando acesso a forecasts_cashflow ==='
SELECT
  COUNT(*) as total_forecasts,
  COUNT(DISTINCT unit_id) as unique_units,
  MIN(date) as oldest_forecast,
  MAX(date) as newest_forecast
FROM forecasts_cashflow;

-- Testar acesso a ai_analyses
\echo ''
\echo '=== 6. Testando acesso a ai_analyses ==='
SELECT
  COUNT(*) as total_analyses,
  COUNT(DISTINCT unit_id) as unique_units,
  COUNT(CASE WHEN analysis_type = 'HEALTH_CHECK' THEN 1 END) as health_checks,
  COUNT(CASE WHEN analysis_type = 'ANOMALY_DETECTION' THEN 1 END) as anomaly_detections
FROM ai_analyses;

-- Testar acesso a kpi_targets
\echo ''
\echo '=== 7. Testando acesso a kpi_targets ==='
SELECT
  COUNT(*) as total_targets,
  COUNT(DISTINCT unit_id) as unique_units,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_targets
FROM kpi_targets;

-- Testar acesso a etl_runs
\echo ''
\echo '=== 8. Testando acesso a etl_runs ==='
SELECT
  COUNT(*) as total_runs,
  COUNT(DISTINCT unit_id) as unique_units,
  COUNT(CASE WHEN status = 'SUCCESS' THEN 1 END) as successful_runs,
  COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed_runs,
  MAX(started_at) as last_run
FROM etl_runs;

-- Verificar units do usuário atual
\echo ''
\echo '=== 9. Units do usuário atual ==='
SELECT
  p.id as professional_id,
  p.user_id,
  p.name as professional_name,
  p.unit_id,
  u.name as unit_name,
  p.is_active
FROM professionals p
JOIN units u ON u.id = p.unit_id
WHERE p.user_id = auth.uid();

\echo ''
\echo '=== ✅ Validação concluída ==='
