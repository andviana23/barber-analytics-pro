# 🔍 Diagnóstico: Lista da Vez - Problemas RLS e Visibilidade

**Data:** 6 de novembro de 2025
**Análise:** Permissões Multi-tenant e Lista da Vez
**Status:** ⚠️ Problemas Identificados

---

## 📋 Problemas Identificados

### 1. **Profissional Inativo na Lista da Vez**

**Problema:** O profissional "Barbeiro Teste E2E" está **inativo** (`is_active = false`) mas ainda permanece na **posição 1** da fila de Nova Lima.

**Dados:**

```
Nova Lima - Posição 1: Barbeiro Teste E2E (INATIVO)
Nova Lima - Posição 2: João Victor (ativo)
Nova Lima - Posição 3: Vinicius Eduardo (ativo)
...
```

**Impacto:**

- View `vw_turn_list_complete` filtra profissionais inativos, causando inconsistência
- Frontend pode não mostrar a posição 1 corretamente
- Ordem da fila fica quebrada

### 2. **RLS Policy Complexa Demais**

**Policy Atual:**

```sql
CREATE POLICY "gerente_select_turn_list" ON barbers_turn_list FOR SELECT
USING (
  (get_user_role() = 'admin'::text)
  OR (
    (get_user_role() = 'gerente'::text)
    AND (unit_id IN (
      SELECT p.unit_id FROM professionals p
      WHERE p.user_id = auth.uid() AND p.is_active = true
    ))
  )
  OR (unit_id IN (
    SELECT p.unit_id FROM professionals p
    WHERE p.user_id = auth.uid() AND p.is_active = true
  ))
);
```

**Problemas:**

- Lógica redundante (última condição é repetida)
- Manager deve ver **todas as unidades**, não apenas a sua
- Complexidade desnecessária

### 3. **Profissionais de Mangabeiras Fora da Lista**

**Situação Atual:**

```
Mangabeiras:
✅ Renato do Reis (barbeiro) - Na lista (pos 1)
✅ Thiago Nepomuceno (barbeiro) - Na lista (pos 2)
❌ Andrey Viana (barbeiro, ativo) - NÃO está na lista
❌ Andrey Administrador (admin, ativo) - NÃO está na lista
```

**Causa:** Profissionais ativos não foram adicionados à lista da vez.

---

## 🛠️ Soluções Propostas

### **Solução 1: Limpeza de Profissionais Inativos**

```sql
-- Remover profissionais inativos da lista da vez
DELETE FROM barbers_turn_list
WHERE professional_id IN (
  SELECT p.id
  FROM professionals p
  WHERE p.is_active = false
);

-- Reordenar posições após limpeza
UPDATE barbers_turn_list
SET position = new_pos.row_num
FROM (
  SELECT
    id,
    ROW_NUMBER() OVER (PARTITION BY unit_id ORDER BY points ASC, last_updated ASC) as row_num
  FROM barbers_turn_list
) new_pos
WHERE barbers_turn_list.id = new_pos.id;
```

### **Solução 2: Simplificar RLS Policy para Managers**

```sql
-- Dropar policy atual
DROP POLICY IF EXISTS "gerente_select_turn_list" ON barbers_turn_list;

-- Criar policy simplificada
CREATE POLICY "manager_can_see_all_units_turn_list"
ON barbers_turn_list FOR SELECT
USING (
  get_user_role() = 'admin'
  OR get_user_role() = 'gerente'  -- Manager vê todas as unidades
  OR unit_id IN (
    SELECT p.unit_id
    FROM professionals p
    WHERE p.user_id = auth.uid() AND p.is_active = true
  )
);
```

### **Solução 3: Restringir Lista da Vez Apenas para Barbeiros**

```sql
-- Remover profissionais que não são barbeiros da lista da vez
DELETE FROM barbers_turn_list
WHERE professional_id IN (
  SELECT p.id
  FROM professionals p
  WHERE p.role != 'barbeiro'
);

-- Adicionar apenas barbeiros ativos que não estão na lista
INSERT INTO barbers_turn_list (unit_id, professional_id, points, position)
SELECT
  p.unit_id,
  p.id as professional_id,
  0 as points,
  COALESCE(
    (SELECT MAX(position) FROM barbers_turn_list WHERE unit_id = p.unit_id),
    0
  ) + ROW_NUMBER() OVER (ORDER BY p.name) as position
FROM professionals p
WHERE p.is_active = true
AND p.role = 'barbeiro'  -- APENAS BARBEIROS
AND p.id NOT IN (
  SELECT professional_id
  FROM barbers_turn_list
  WHERE unit_id = p.unit_id
);
```

### **Solução 4: Trigger para Manter Integridade (Apenas Barbeiros)**

```sql
-- Trigger para remover automaticamente profissionais que não são barbeiros
CREATE OR REPLACE FUNCTION fn_remove_inactive_from_turn_list()
RETURNS TRIGGER AS $$
BEGIN
  -- Se profissional foi desativado ou mudou para role diferente de barbeiro, remove da lista da vez
  IF (OLD.is_active = true AND NEW.is_active = false) OR
     (OLD.role = 'barbeiro' AND NEW.role != 'barbeiro') THEN
    DELETE FROM barbers_turn_list WHERE professional_id = NEW.id;

    -- Reordena posições
    UPDATE barbers_turn_list
    SET position = new_pos.row_num
    FROM (
      SELECT
        id,
        ROW_NUMBER() OVER (PARTITION BY unit_id ORDER BY points ASC, last_updated ASC) as row_num
      FROM barbers_turn_list
      WHERE unit_id = NEW.unit_id
    ) new_pos
    WHERE barbers_turn_list.id = new_pos.id
    AND barbers_turn_list.unit_id = NEW.unit_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger de validação para INSERT (apenas barbeiros ativos)
CREATE OR REPLACE FUNCTION fn_validate_barber_role_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM professionals p
    WHERE p.id = NEW.professional_id
    AND p.role = 'barbeiro'
    AND p.is_active = true
  ) THEN
    RAISE EXCEPTION 'Apenas profissionais com role "barbeiro" e ativos podem ser adicionados à lista da vez';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_remove_inactive_from_turn_list
  AFTER UPDATE ON professionals
  FOR EACH ROW
  EXECUTE FUNCTION fn_remove_inactive_from_turn_list();

CREATE TRIGGER trg_validate_barber_role_insert
  BEFORE INSERT ON barbers_turn_list
  FOR EACH ROW
  EXECUTE FUNCTION fn_validate_barber_role_insert();
```

---

## 🎯 Implementação Recomendada

### **Ordem de Execução:**

1. **Executar limpeza** (Solução 1)
2. **Simplificar RLS** (Solução 2)
3. **Adicionar profissionais faltantes** (Solução 3)
4. **Implementar trigger** (Solução 4)

### **Validação Pós-Implementação:**

```sql
-- Verificar estado final
SELECT
  u.name as unit_name,
  p.name as professional_name,
  p.role,
  p.is_active,
  btl.position,
  btl.points
FROM barbers_turn_list btl
JOIN units u ON u.id = btl.unit_id
JOIN professionals p ON p.id = btl.professional_id
ORDER BY u.name, btl.position;
```

---

## 📊 Resultado Esperado

**Mangabeiras:**

- Posição 1: Andrey Viana (barbeiro)
- Posição 2: Renato do Reis (barbeiro)
- Posição 3: Thiago Nepomuceno (barbeiro)

**Nova Lima:**

- Posição 1: João Victor (barbeiro)
- Posição 2: Vinicius Eduardo (barbeiro)
- Posição 3: Lucas Procopio (barbeiro)
- Posição 4: Renato (barbeiro)
- Posição 5: Oton Rodrigues (barbeiro)

**Restrições:**

- ✅ Apenas profissionais com role "barbeiro" aparecem na lista
- ✅ Admin, gerente, recepcionista NÃO aparecem na lista
- ✅ Validação automática na inserção

---

## ⚠️ Considerações Importantes

1. **Backup:** Fazer backup da `barbers_turn_list` antes das alterações
2. **Teste:** Validar em ambiente de desenvolvimento primeiro
3. **Monitoramento:** Acompanhar logs após implementação
4. **Documentação:** Atualizar docs das RLS policies

---

**Próximos Passos:** Aguardar aprovação para executar as soluções propostas.
