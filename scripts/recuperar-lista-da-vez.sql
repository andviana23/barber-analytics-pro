-- =====================================================
-- SCRIPT DE RECUPERAÇÃO - LISTA DA VEZ
-- =====================================================
-- Objetivo: Recuperar dados da lista da vez que foram
--           apagados acidentalmente
-- Data: 11/11/2025
-- =====================================================

-- =====================================================
-- 1. VERIFICAR SE HÁ DADOS ATUAIS
-- =====================================================
SELECT
    'DADOS ATUAIS' as tipo,
    COUNT(*) as total,
    STRING_AGG(DISTINCT u.name, ', ') as unidades
FROM barbers_turn_list btl
JOIN units u ON u.id = btl.unit_id;

-- =====================================================
-- 2. VERIFICAR HISTÓRICO DISPONÍVEL
-- =====================================================
-- Verificar último mês registrado
SELECT
    'HISTÓRICO' as tipo,
    bth.year,
    bth.month,
    COUNT(*) as total_registros,
    STRING_AGG(DISTINCT u.name, ', ') as unidades,
    MAX(bth.created_at) as ultimo_registro
FROM barbers_turn_history bth
JOIN units u ON u.id = bth.unit_id
GROUP BY bth.year, bth.month
ORDER BY bth.year DESC, bth.month DESC
LIMIT 5;

-- =====================================================
-- 3. VERIFICAR DADOS DE HOJE (SE EXISTIREM EM LOGS)
-- =====================================================
-- Tentar recuperar do histórico de auditoria (se houver)
-- Nota: Supabase não tem auditoria por padrão, mas vamos verificar

-- =====================================================
-- 4. OPÇÃO A: RESTAURAR DO ÚLTIMO HISTÓRICO (NOVEMBRO 2025)
-- =====================================================
-- Esta query restaura os dados do mês atual se houver histórico
WITH ultimo_historico AS (
    SELECT
        bth.unit_id,
        bth.professional_id,
        bth.total_points as points,
        bth.final_position as position
    FROM barbers_turn_history bth
    WHERE bth.year = EXTRACT(YEAR FROM CURRENT_DATE)
    AND bth.month = EXTRACT(MONTH FROM CURRENT_DATE)
)
SELECT
    'RECUPERAR DO HISTÓRICO (MÊS ATUAL)' as acao,
    uh.unit_id,
    u.name as unit_name,
    uh.professional_id,
    p.name as professional_name,
    uh.points,
    uh.position
FROM ultimo_historico uh
JOIN units u ON u.id = uh.unit_id
JOIN professionals p ON p.id = uh.professional_id
WHERE p.is_active = true
ORDER BY uh.unit_id, uh.position;

-- =====================================================
-- 5. OPÇÃO B: INICIALIZAR ZERADO (SE NÃO HOUVER HISTÓRICO)
-- =====================================================
-- Lista todos os barbeiros ativos para reinicialização
SELECT
    'INICIALIZAR ZERADO' as acao,
    p.unit_id,
    u.name as unit_name,
    p.id as professional_id,
    p.name as professional_name,
    ROW_NUMBER() OVER (PARTITION BY p.unit_id ORDER BY p.created_at) as position
FROM professionals p
JOIN units u ON u.id = p.unit_id
WHERE p.role = 'barbeiro'
AND p.is_active = true
AND u.is_active = true
ORDER BY p.unit_id, position;

-- =====================================================
-- 6. SCRIPT DE RECUPERAÇÃO - EXECUTAR COM CUIDADO!
-- =====================================================
-- ⚠️ CUIDADO: Este script VAI INSERIR DADOS na tabela
-- ⚠️ Execute apenas se tiver certeza!
-- ⚠️ Remova o comentário abaixo para executar

/*
-- Opção A: Restaurar do histórico do mês atual (se existir)
INSERT INTO barbers_turn_list (unit_id, professional_id, points, position)
SELECT
    bth.unit_id,
    bth.professional_id,
    bth.total_points,
    bth.final_position
FROM barbers_turn_history bth
JOIN professionals p ON p.id = bth.professional_id
WHERE bth.year = EXTRACT(YEAR FROM CURRENT_DATE)
AND bth.month = EXTRACT(MONTH FROM CURRENT_DATE)
AND p.is_active = true
ON CONFLICT (unit_id, professional_id) DO UPDATE
SET points = EXCLUDED.points,
    position = EXCLUDED.position,
    last_updated = NOW();
*/

/*
-- Opção B: Inicializar zerado (se não houver histórico)
INSERT INTO barbers_turn_list (unit_id, professional_id, points, position)
SELECT
    p.unit_id,
    p.id,
    0 as points,
    ROW_NUMBER() OVER (PARTITION BY p.unit_id ORDER BY p.created_at) as position
FROM professionals p
JOIN units u ON u.id = p.unit_id
WHERE p.role = 'barbeiro'
AND p.is_active = true
AND u.is_active = true
ON CONFLICT (unit_id, professional_id) DO UPDATE
SET points = EXCLUDED.points,
    position = EXCLUDED.position,
    last_updated = NOW();
*/

-- =====================================================
-- 7. VERIFICAÇÃO PÓS-RECUPERAÇÃO
-- =====================================================
-- Execute esta query após a recuperação para confirmar
SELECT
    'PÓS-RECUPERAÇÃO' as tipo,
    u.name as unidade,
    p.name as barbeiro,
    btl.points,
    btl.position,
    btl.last_updated
FROM barbers_turn_list btl
JOIN units u ON u.id = btl.unit_id
JOIN professionals p ON p.id = btl.professional_id
ORDER BY btl.unit_id, btl.position;

-- =====================================================
-- 8. INVESTIGAÇÃO: QUANDO OS DADOS FORAM APAGADOS?
-- =====================================================
-- Verificar último update na tabela
SELECT
    'ÚLTIMO UPDATE' as tipo,
    MAX(updated_at) as ultima_atualizacao,
    MAX(created_at) as ultima_criacao
FROM barbers_turn_list;

-- Verificar se há registros no histórico de hoje
SELECT
    'HISTÓRICO DE HOJE' as tipo,
    COUNT(*) as total,
    STRING_AGG(u.name, ', ') as unidades
FROM barbers_turn_history bth
JOIN units u ON u.id = bth.unit_id
WHERE DATE(bth.created_at) = CURRENT_DATE;

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================
--
-- 1. Se houver histórico do mês atual (novembro 2025):
--    - Use a Opção A para restaurar com os pontos do histórico
--
-- 2. Se NÃO houver histórico do mês atual:
--    - Use a Opção B para inicializar zerado
--    - Todos começarão com 0 pontos
--    - Ordem será baseada na data de cadastro
--
-- 3. Após recuperação, considere:
--    - Desabilitar o cron job temporariamente
--    - Investigar por que os dados foram apagados
--    - Adicionar auditoria na tabela
--
-- 4. Para prevenir perda de dados futura:
--    - Habilitar Point-in-Time Recovery (PITR) no Supabase
--    - Adicionar trigger de auditoria
--    - Fazer backups regulares
--
-- =====================================================

