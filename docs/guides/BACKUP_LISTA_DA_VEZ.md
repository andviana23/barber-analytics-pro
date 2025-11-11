# 🔄 Sistema de Backup Diário - Lista da Vez

**Data de Implementação:** 11/11/2025
**Status:** ✅ ATIVO
**Versão:** 1.0.0

---

## 📋 Visão Geral

Sistema automático de backup diário da Lista da Vez com:

- ✅ Backup automático diário às 23:30
- ✅ Backup pré-reset (antes de zerar mensal)
- ✅ Restauração de qualquer dia dos últimos 30 dias
- ✅ Limpeza automática de backups antigos
- ✅ Múltiplos tipos de backup (daily, manual, pre_reset)

---

## 🗂️ Estrutura

### Tabela de Backup

```sql
barbers_turn_list_backup
├── id (UUID)
├── unit_id (UUID)
├── professional_id (UUID)
├── points (INTEGER)
├── position (INTEGER)
├── last_updated (TIMESTAMPTZ)
├── created_at (TIMESTAMPTZ)
├── updated_at (TIMESTAMPTZ)
├── backup_date (DATE) -- Data do backup
├── backup_timestamp (TIMESTAMPTZ) -- Hora exata
└── backup_type (TEXT) -- 'daily', 'manual', 'pre_reset'
```

### Funções Disponíveis

| Função                         | Descrição             | Uso                  |
| ------------------------------ | --------------------- | -------------------- |
| `fn_backup_turn_list(tipo)`    | Cria backup           | Manual ou automático |
| `fn_restore_from_backup(data)` | Restaura backup       | Recuperação de dados |
| `fn_cleanup_old_backups(dias)` | Limpa backups antigos | Automático ou manual |

### View de Consulta

```sql
vw_backups_lista_da_vez
├── backup_date -- Data do backup
├── backup_type -- Tipo (daily/manual/pre_reset)
├── total_registros -- Quantidade de barbeiros
├── unidades -- Nomes das unidades
└── ultimo_backup_timestamp -- Horário do último backup
```

---

## 🤖 Automação (Cron Jobs)

### 1. Backup Diário Automático

**Horário:** Todo dia às **23:30**
**Tipo:** `daily`
**Job Name:** `backup-diario-lista-da-vez`

```sql
-- Cron expression: 30 23 * * *
SELECT public.fn_backup_turn_list('daily');
```

**Por que 23:30?**

- Reset mensal está configurado para 23:00 (dias 28-31)
- Backup diário roda **DEPOIS** do possível reset
- Captura estado após qualquer operação do dia

---

### 2. Limpeza Mensal Automática

**Horário:** Dia **1 de cada mês** às **02:00**
**Retenção:** Últimos **30 dias**
**Job Name:** `cleanup-backups-lista-da-vez`

```sql
-- Cron expression: 0 2 1 * *
SELECT public.fn_cleanup_old_backups(30);
```

**Resultado:**

- Remove backups > 30 dias
- Libera espaço no banco
- Mantém histórico recente

---

## 🛠️ Uso Manual

### 1. Criar Backup Manual

```sql
-- Criar backup agora
SELECT fn_backup_turn_list('manual');
```

**Retorno:**

```json
{
  "success": true,
  "backup_date": "2025-11-11",
  "backup_type": "manual",
  "records_backed_up": 9,
  "message": "Backup criado com sucesso: 9 registros"
}
```

---

### 2. Ver Backups Disponíveis

```sql
-- Listar todos os backups
SELECT * FROM vw_backups_lista_da_vez;
```

**Exemplo de resultado:**

```
backup_date | backup_type | total_registros | unidades               | ultimo_backup_timestamp
------------+-------------+-----------------+------------------------+------------------------
2025-11-11  | manual      | 9               | Mangabeiras, Nova Lima | 2025-11-11 21:09:02
2025-11-10  | daily       | 9               | Mangabeiras, Nova Lima | 2025-11-10 23:30:00
2025-11-09  | daily       | 8               | Mangabeiras, Nova Lima | 2025-11-09 23:30:00
```

---

### 3. Restaurar Backup

#### Opção A: Restaurar de Ontem (Padrão)

```sql
-- Restaurar backup de ontem (padrão)
SELECT fn_restore_from_backup();
```

#### Opção B: Restaurar Data Específica

```sql
-- Restaurar de data específica
SELECT fn_restore_from_backup('2025-11-10');
```

**Retorno de Sucesso:**

```json
{
  "success": true,
  "backup_date": "2025-11-10",
  "records_restored": 9,
  "message": "Backup restaurado com sucesso: 9 registros"
}
```

**Retorno de Erro:**

```json
{
  "success": false,
  "error": "Backup não encontrado para a data: 2025-11-01"
}
```

---

### 4. Limpar Backups Antigos Manualmente

```sql
-- Manter apenas últimos 15 dias (exemplo)
SELECT fn_cleanup_old_backups(15);
```

**Retorno:**

```json
{
  "success": true,
  "cutoff_date": "2025-10-27",
  "days_kept": 15,
  "records_deleted": 45,
  "message": "Limpeza concluída: 45 registros removidos"
}
```

---

## 🚨 Cenários de Uso

### Cenário 1: Dados Apagados Acidentalmente

**Problema:** Lista da vez foi zerada sem querer

**Solução:**

```sql
-- 1. Ver backups disponíveis
SELECT * FROM vw_backups_lista_da_vez;

-- 2. Restaurar backup mais recente
SELECT fn_restore_from_backup(CURRENT_DATE);

-- 3. Verificar dados restaurados
SELECT * FROM barbers_turn_list;
```

---

### Cenário 2: Reset Mensal Executado Errado

**Problema:** Reset foi executado fora do último dia do mês

**Solução:**

```sql
-- 1. Verificar se há backup pre_reset
SELECT * FROM vw_backups_lista_da_vez
WHERE backup_type = 'pre_reset'
ORDER BY backup_date DESC
LIMIT 1;

-- 2. Restaurar do backup pre_reset
SELECT fn_restore_from_backup('2025-11-11');
```

---

### Cenário 3: Recuperar Pontuação de Dias Atrás

**Problema:** Preciso ver como estava a lista há 5 dias

**Solução:**

```sql
-- 1. Calcular data de 5 dias atrás
SELECT CURRENT_DATE - 5; -- Ex: 2025-11-06

-- 2. Ver backup daquela data
SELECT * FROM barbers_turn_list_backup
WHERE backup_date = '2025-11-06';

-- 3. Se quiser restaurar
SELECT fn_restore_from_backup('2025-11-06');
```

---

### Cenário 4: Criar Backup Antes de Operação Crítica

**Problema:** Vou fazer alteração manual e quero backup preventivo

**Solução:**

```sql
-- 1. Criar backup manual antes
SELECT fn_backup_turn_list('manual');

-- 2. Fazer alterações...

-- 3. Se der errado, restaurar
SELECT fn_restore_from_backup(CURRENT_DATE);
```

---

## 🔍 Monitoramento

### Verificar Último Backup

```sql
SELECT
    backup_date,
    backup_type,
    ultimo_backup_timestamp,
    AGE(NOW(), ultimo_backup_timestamp) as tempo_desde_backup
FROM vw_backups_lista_da_vez
ORDER BY ultimo_backup_timestamp DESC
LIMIT 1;
```

**Resultado esperado:**

```
backup_date | backup_type | ultimo_backup_timestamp | tempo_desde_backup
------------+-------------+-------------------------+-------------------
2025-11-11  | manual      | 2025-11-11 21:09:02    | 00:15:30
```

---

### Verificar Cron Jobs Ativos

```sql
SELECT
    jobname,
    schedule,
    active,
    last_run_status
FROM cron.job
WHERE jobname LIKE '%lista-da-vez%';
```

**Resultado esperado:**

```
jobname                      | schedule      | active | last_run_status
-----------------------------+---------------+--------+----------------
backup-diario-lista-da-vez   | 30 23 * * *   | t      | succeeded
cleanup-backups-lista-da-vez | 0 2 1 * *     | t      | succeeded
monthly-reset-lista-da-vez   | 0 23 28-31 * *| t      | succeeded
```

---

### Verificar Espaço Usado por Backups

```sql
SELECT
    COUNT(*) as total_backups,
    COUNT(DISTINCT backup_date) as dias_com_backup,
    MIN(backup_date) as backup_mais_antigo,
    MAX(backup_date) as backup_mais_recente
FROM barbers_turn_list_backup;
```

---

## ⚙️ Configurações

### Alterar Horário do Backup Diário

```sql
-- Atualizar para 22:00 (exemplo)
SELECT cron.unschedule('backup-diario-lista-da-vez');

SELECT cron.schedule(
  'backup-diario-lista-da-vez',
  '0 22 * * *', -- 22:00
  $$SELECT public.fn_backup_turn_list('daily');$$
);
```

---

### Alterar Retenção de Backups

```sql
-- Manter 60 dias em vez de 30
SELECT cron.unschedule('cleanup-backups-lista-da-vez');

SELECT cron.schedule(
  'cleanup-backups-lista-da-vez',
  '0 2 1 * *',
  $$SELECT public.fn_cleanup_old_backups(60);$$
);
```

---

### Desabilitar Backup Automático

```sql
-- Desabilitar temporariamente
SELECT cron.unschedule('backup-diario-lista-da-vez');

-- Para reabilitar, executar o schedule novamente
```

---

## 🛡️ Segurança

### Políticas RLS Configuradas

**Admins:**

- ✅ Visualizar todos os backups
- ✅ Restaurar backups
- ✅ Criar backups manuais

**Gerentes:**

- ✅ Visualizar backups de suas unidades
- ❌ Restaurar backups (apenas admin)

**Barbeiros:**

- ❌ Acesso negado à tabela de backup

---

### Audit Trail

Todos os backups registram:

- Data e hora exata (`backup_timestamp`)
- Tipo de backup (`backup_type`)
- Quantidade de registros salvos

**Ver histórico completo:**

```sql
SELECT
    backup_date,
    backup_type,
    total_registros,
    ultimo_backup_timestamp
FROM vw_backups_lista_da_vez
ORDER BY ultimo_backup_timestamp DESC;
```

---

## 📊 Estatísticas

### Estado Atual do Sistema

✅ **Backup Inicial:** Criado em 11/11/2025 às 21:09
✅ **Registros Protegidos:** 9 (Mangabeiras + Nova Lima)
✅ **Cron Jobs Ativos:** 3 (backup diário, limpeza mensal, reset mensal)
✅ **Retenção:** 30 dias
✅ **Horário Backup:** 23:30 diariamente
✅ **RLS:** Habilitado e configurado

---

## 🆘 Troubleshooting

### Problema: Backup não está sendo criado automaticamente

**Diagnóstico:**

```sql
-- Verificar se cron está ativo
SELECT * FROM cron.job WHERE jobname = 'backup-diario-lista-da-vez';

-- Ver último erro
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'backup-diario-lista-da-vez')
ORDER BY start_time DESC
LIMIT 5;
```

**Solução:**

- Verificar se `pg_cron` está habilitado
- Recriar cron job se necessário

---

### Problema: Restauração falha

**Diagnóstico:**

```sql
-- Verificar se backup existe
SELECT * FROM vw_backups_lista_da_vez
WHERE backup_date = '2025-11-10';
```

**Soluções:**

- Se backup não existe: usar data mais recente disponível
- Se tabela está em uso: aguardar liberação

---

### Problema: Espaço em disco crescendo

**Diagnóstico:**

```sql
-- Ver quantos backups existem
SELECT COUNT(*), MIN(backup_date), MAX(backup_date)
FROM barbers_turn_list_backup;
```

**Solução:**

```sql
-- Reduzir retenção para 15 dias
SELECT fn_cleanup_old_backups(15);
```

---

## 📞 Suporte

**Documentação Técnica:** `supabase/migrations/20251111000001_backup_diario_lista_da_vez.sql`
**Guia de Recuperação:** `docs/BUGFIX_LISTA_DA_VEZ_RECOVERY.md`
**Responsável:** Andrey Viana

---

**Última Atualização:** 11/11/2025, 21:15 BRT
**Versão:** 1.0.0
