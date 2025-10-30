-- ====================================================
-- CONFIGURAÇÃO DO CRON JOB PARA RESET MENSAL
-- ====================================================
-- Autor: Andrey Viana
-- Data: 2024
-- Descrição: Configura cron job para executar o reset da
--            Lista da Vez no último dia do mês às 23:00
-- ====================================================

-- Habilitar extensão pg_cron (se ainda não estiver habilitada)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remover job anterior se existir (para evitar duplicação)
SELECT cron.unschedule('monthly-reset-lista-da-vez');

-- Criar novo cron job para reset mensal
-- Executar no último dia de cada mês às 23:00 (11 PM)
SELECT cron.schedule(
  'monthly-reset-lista-da-vez',           -- Nome do job
  '0 23 28-31 * *',                       -- Cron expression (28-31 para pegar último dia)
  $$
    -- Verificar se hoje é o último dia do mês
    DO $$
    BEGIN
      IF EXTRACT(DAY FROM CURRENT_DATE) = EXTRACT(DAY FROM (DATE_TRUNC('MONTH', CURRENT_DATE) + INTERVAL '1 MONTH - 1 DAY')) THEN
        -- Executar reset apenas se for o último dia do mês
        PERFORM public.fn_monthly_reset_turn_list();
      END IF;
    END
    $$;
  $$
);

-- ====================================================
-- VERIFICAÇÃO E LOGS
-- ====================================================

-- Ver cron jobs configurados
SELECT 
  jobid,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active,
  jobname
FROM cron.job
WHERE jobname = 'monthly-reset-lista-da-vez';

-- Comentários de documentação
COMMENT ON EXTENSION pg_cron IS 'Agendador de tarefas periódicas para PostgreSQL';

-- ====================================================
-- HISTÓRICO DE ALTERAÇÕES
-- ====================================================
-- 2024: Criação inicial do cron job para reset mensal às 23:00
-- Alterado de 23:59 para 23:00 conforme requisito do usuário
-- ====================================================
