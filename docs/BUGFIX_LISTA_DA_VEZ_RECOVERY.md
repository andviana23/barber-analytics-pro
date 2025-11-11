# 🚨 Bugfix: Recuperação de Dados - Lista da Vez

**Data do Incidente:** 11/11/2025
**Status:** 🔴 Dados Apagados - Recuperação em Andamento
**Severidade:** ALTA
**Impacto:** Todas as unidades perderam dados da lista da vez

---

## 📋 Resumo do Problema

Os dados da tabela `barbers_turn_list` foram **completamente apagados**, resultando na perda da ordem de atendimento e pontuação dos barbeiros.

**Sintomas:**

- ❌ Lista da vez vazia em todas as unidades
- ❌ Nenhum barbeiro aparece na ordem de atendimento
- ❌ Pontuação zerada ou inexistente

---

## 🔍 Análise de Causa Raiz

### Possíveis Causas Identificadas:

#### 1. **Cron Job de Reset Mensal (IMPROVÁVEL)**

**Arquivo:** `supabase/migrations/20240000000007_setup_monthly_reset_cron.sql`

```sql
SELECT cron.schedule(
  'monthly-reset-lista-da-vez',
  '0 23 28-31 * *',  -- Executar apenas dias 28-31 às 23h
  ...
);
```

**Análise:**

- ✅ Cron configurado para rodar apenas dias **28-31**
- ✅ Hoje é dia **11/11** → cron **NÃO deveria ter rodado**
- ❌ **Improvável** que esta seja a causa

---

#### 2. **Execução Manual da Função de Reset (PROVÁVEL)**

**Função:** `public.fn_monthly_reset_turn_list()`

Alguém pode ter executado manualmente:

```sql
SELECT public.fn_monthly_reset_turn_list();
```

**Evidências:**

- Esta função salva histórico antes de resetar
- Verificar se há registro no `barbers_turn_history` para novembro/2025

---

#### 3. **Inicialização da Lista (PROVÁVEL)**

**Função:** `public.fn_initialize_turn_list(p_unit_id UUID)`

Esta função **FAZ DELETE** antes de inserir:

```sql
DELETE FROM public.barbers_turn_list WHERE unit_id = p_unit_id;
```

Se foi chamada sem reinserção, os dados foram perdidos.

---

#### 4. **DELETE Acidental Direto no Banco**

Alguém pode ter executado:

```sql
DELETE FROM barbers_turn_list;
```

Ou via interface da aplicação que chama repository de delete.

---

## 💾 Estratégia de Recuperação

### Passo 1: Diagnóstico (Executar Primeiro)

Execute o script de diagnóstico:

```bash
# Via @pgsql tools
@pgsql_connect
@pgsql_query com o conteúdo de scripts/recuperar-lista-da-vez.sql
```

Ou via SQL direto:

```sql
-- 1. Verificar se há dados atuais
SELECT COUNT(*) as total FROM barbers_turn_list;

-- 2. Verificar histórico disponível
SELECT year, month, COUNT(*) as total
FROM barbers_turn_history
GROUP BY year, month
ORDER BY year DESC, month DESC
LIMIT 5;

-- 3. Verificar se há histórico de NOVEMBRO 2025
SELECT
    u.name as unidade,
    p.name as barbeiro,
    bth.total_points,
    bth.final_position
FROM barbers_turn_history bth
JOIN units u ON u.id = bth.unit_id
JOIN professionals p ON p.id = bth.professional_id
WHERE bth.year = 2025
AND bth.month = 11
ORDER BY bth.unit_id, bth.final_position;
```

---

### Passo 2: Escolher Método de Recuperação

#### **OPÇÃO A: Restaurar do Histórico (SE DISPONÍVEL)** ✅ Recomendado

Se houver dados de novembro/2025 no histórico:

```sql
-- Restaurar pontos e posições do histórico
INSERT INTO barbers_turn_list (unit_id, professional_id, points, position)
SELECT
    bth.unit_id,
    bth.professional_id,
    bth.total_points,
    bth.final_position
FROM barbers_turn_history bth
JOIN professionals p ON p.id = bth.professional_id
WHERE bth.year = 2025
AND bth.month = 11
AND p.is_active = true
ON CONFLICT (unit_id, professional_id) DO UPDATE
SET points = EXCLUDED.points,
    position = EXCLUDED.position,
    last_updated = NOW();
```

**Vantagens:**

- ✅ Recupera pontos exatos
- ✅ Mantém ordem de atendimento
- ✅ Melhor experiência para usuário

**Desvantagens:**

- ⚠️ Só funciona se o histórico existir

---

#### **OPÇÃO B: Inicializar Zerado** ⚠️ Último Recurso

Se **NÃO houver histórico** disponível:

```sql
-- Inicializar lista com todos zerados
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
```

**Vantagens:**

- ✅ Sempre funciona
- ✅ Todos começam do zero (justo)

**Desvantagens:**

- ❌ Perde histórico de pontos de hoje
- ❌ Pode gerar reclamações de barbeiros

---

### Passo 3: Verificação Pós-Recuperação

Após executar a recuperação:

```sql
-- Verificar dados restaurados
SELECT
    u.name as unidade,
    p.name as barbeiro,
    btl.points,
    btl.position,
    btl.last_updated
FROM barbers_turn_list btl
JOIN units u ON u.id = btl.unit_id
JOIN professionals p ON p.id = btl.professional_id
ORDER BY btl.unit_id, btl.position;

-- Contar total por unidade
SELECT
    u.name as unidade,
    COUNT(*) as total_barbeiros
FROM barbers_turn_list btl
JOIN units u ON u.id = btl.unit_id
GROUP BY u.name;
```

---

## 🛡️ Prevenção - Ações Futuras

### 1. **Desabilitar Cron Job Temporariamente**

```sql
-- Desabilitar cron de reset mensal até investigar
SELECT cron.unschedule('monthly-reset-lista-da-vez');
```

**Nota:** Lembrar de reabilitar no final do mês!

---

### 2. **Adicionar Trigger de Auditoria**

Criar tabela de auditoria para rastrear DELETEs:

```sql
-- Tabela de auditoria
CREATE TABLE IF NOT EXISTS audit_barbers_turn_list (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    operation TEXT NOT NULL, -- INSERT, UPDATE, DELETE
    unit_id UUID,
    professional_id UUID,
    old_points INTEGER,
    old_position INTEGER,
    new_points INTEGER,
    new_position INTEGER,
    changed_by UUID, -- user_id do auth.uid()
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    change_reason TEXT
);

-- Trigger function
CREATE OR REPLACE FUNCTION audit_turn_list_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_barbers_turn_list (
            operation, unit_id, professional_id,
            old_points, old_position, changed_by
        ) VALUES (
            'DELETE', OLD.unit_id, OLD.professional_id,
            OLD.points, OLD.position, auth.uid()
        );
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_barbers_turn_list (
            operation, unit_id, professional_id,
            old_points, old_position, new_points, new_position, changed_by
        ) VALUES (
            'UPDATE', NEW.unit_id, NEW.professional_id,
            OLD.points, OLD.position, NEW.points, NEW.position, auth.uid()
        );
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
CREATE TRIGGER tr_audit_turn_list
AFTER UPDATE OR DELETE ON barbers_turn_list
FOR EACH ROW EXECUTE FUNCTION audit_turn_list_changes();
```

---

### 3. **Habilitar Point-in-Time Recovery (PITR)**

No Supabase Dashboard:

1. Ir em **Database** → **Backups**
2. Habilitar **Point-in-Time Recovery**
3. Permite restaurar qualquer momento das últimas 24h

**Custo:** ~$100/mês (plano Pro)

---

### 4. **Adicionar Confirmação na UI**

Antes de executar reset ou delete:

```javascript
// Em listaDaVezService.js
export async function resetTurnList(unitId) {
  // Adicionar confirmação dupla
  const confirmed = await Swal.fire({
    title: '⚠️ Atenção!',
    text: 'Isso vai APAGAR TODOS os dados da lista da vez. Continuar?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sim, resetar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#d33',
  });

  if (!confirmed.isConfirmed) return { data: null, error: 'Cancelado' };

  // Pedir senha de confirmação para ação crítica
  const { value: password } = await Swal.fire({
    title: 'Digite "RESETAR" para confirmar',
    input: 'text',
    inputPlaceholder: 'Digite RESETAR',
    showCancelButton: true,
  });

  if (password !== 'RESETAR') {
    return { data: null, error: 'Confirmação incorreta' };
  }

  // Executar reset
  const { data, error } = await supabase.rpc('fn_initialize_turn_list', {
    p_unit_id: unitId,
  });

  return { data, error };
}
```

---

### 5. **Backup Automático Diário**

Criar cron job para backup:

```sql
-- Backup diário da lista da vez
SELECT cron.schedule(
  'backup-lista-da-vez',
  '0 1 * * *', -- Todo dia às 01:00
  $$
    CREATE TABLE IF NOT EXISTS barbers_turn_list_backup (LIKE barbers_turn_list INCLUDING ALL);

    INSERT INTO barbers_turn_list_backup
    SELECT * FROM barbers_turn_list
    ON CONFLICT DO NOTHING;
  $$
);
```

---

## 📊 Métricas de Impacto

| Métrica                  | Valor                       |
| ------------------------ | --------------------------- |
| **Unidades Afetadas**    | 2 (Mangabeiras + Nova Lima) |
| **Barbeiros Impactados** | ~10-15                      |
| **Tempo de Inatividade** | Até recuperação             |
| **Perda de Dados**       | Pontos de hoje (11/11)      |
| **Severidade**           | 🔴 ALTA                     |

---

## ✅ Checklist de Recuperação

### Imediato (Agora)

- [ ] Executar diagnóstico (`scripts/recuperar-lista-da-vez.sql`)
- [ ] Verificar se há histórico de novembro/2025
- [ ] Escolher método: Opção A (histórico) ou B (zerado)
- [ ] Executar script de recuperação
- [ ] Verificar dados restaurados
- [ ] Testar na UI da aplicação

### Curto Prazo (Hoje)

- [ ] Desabilitar cron job temporariamente
- [ ] Investigar causa raiz (verificar logs)
- [ ] Adicionar trigger de auditoria
- [ ] Comunicar equipe sobre incidente

### Médio Prazo (Esta Semana)

- [ ] Habilitar PITR no Supabase (se possível)
- [ ] Implementar confirmação dupla na UI
- [ ] Adicionar backup automático
- [ ] Documentar procedimento de recuperação

### Longo Prazo (Próximo Mês)

- [ ] Revisar todas as funções que fazem DELETE
- [ ] Adicionar soft delete (is_active) em vez de DELETE
- [ ] Criar dashboard de auditoria
- [ ] Treinar equipe sobre backups

---

## 🔗 Arquivos Relacionados

- **Script de Recuperação:** `scripts/recuperar-lista-da-vez.sql`
- **Migration Cron Job:** `supabase/migrations/20240000000007_setup_monthly_reset_cron.sql`
- **Tabela Principal:** `create_lista_da_vez_tables.sql`
- **Service:** `src/services/listaDaVezService.js`
- **Repository:** `src/repositories/listaDaVezRepository.js`

---

## 📞 Contato

**Responsável:** Andrey Viana
**Data do Documento:** 11/11/2025
**Status:** 🔄 Em Resolução

---

**Última Atualização:** 11/11/2025, 21:15 BRT
