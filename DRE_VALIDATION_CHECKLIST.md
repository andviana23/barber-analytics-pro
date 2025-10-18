# ✅ DRE - Checklist de Validação

> **Guia para validar se o módulo DRE está funcionando corretamente**

---

## 🔍 Validação Passo a Passo

### ✅ 1. Verificar Função SQL

Execute no Supabase SQL Editor:

```sql
-- Verificar se a função existe
SELECT
  proname as nome_funcao,
  pg_get_functiondef(oid) as definicao
FROM pg_proc
WHERE proname = 'fn_calculate_dre';
```

**Resultado esperado:** 1 linha com a definição da função

---

### ✅ 2. Verificar Categorias

```sql
-- Listar todas as categorias ativas
SELECT
  c.name,
  c.category_type,
  parent.name as categoria_pai,
  COUNT(CASE WHEN c.category_type = 'Revenue' THEN r.id END) as total_receitas,
  COUNT(CASE WHEN c.category_type = 'Expense' THEN e.id END) as total_despesas
FROM categories c
LEFT JOIN categories parent ON c.parent_id = parent.id
LEFT JOIN revenues r ON r.category_id = c.id AND r.is_active = true
LEFT JOIN expenses e ON e.category_id = c.id AND e.is_active = true
WHERE c.is_active = true
GROUP BY c.id, c.name, c.category_type, parent.name
ORDER BY c.category_type, c.parent_id NULLS FIRST, c.name;
```

**Validar:**

- ✅ Categoria "Assinatura" existe
- ✅ Categoria "Avulso" existe
- ✅ Categoria "Cosmeticos" existe
- ✅ Categoria "Comissões" existe
- ✅ Categoria "Aluguel e condomínio" existe
- ✅ Categoria "Simpes Nascional" existe
- ✅ Todas as 5 categorias de custos operacionais existem
- ✅ Todas as 8 categorias de despesas administrativas existem

---

### ✅ 3. Verificar Receitas e Despesas

```sql
-- Contar movimentações do mês atual
SELECT
  'Receitas' as tipo,
  COUNT(*) as total,
  SUM(value) as valor_total,
  COUNT(CASE WHEN category_id IS NULL THEN 1 END) as sem_categoria
FROM revenues
WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
  AND date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
  AND is_active = true

UNION ALL

SELECT
  'Despesas' as tipo,
  COUNT(*) as total,
  SUM(value) as valor_total,
  COUNT(CASE WHEN category_id IS NULL THEN 1 END) as sem_categoria
FROM expenses
WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
  AND date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
  AND is_active = true;
```

**Validar:**

- ✅ Existem movimentações
- ✅ `sem_categoria` = 0 (todas têm categoria)

---

### ✅ 4. Testar Cálculo do DRE

```sql
-- Calcular DRE do mês atual
SELECT fn_calculate_dre(
  (SELECT id FROM units WHERE is_active = true LIMIT 1),
  DATE_TRUNC('month', CURRENT_DATE)::date,
  (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::date
) as dre;
```

**Validar:**

- ✅ Retorna JSON válido
- ✅ Contém todas as seções esperadas:
  - `periodo`
  - `receita_bruta`
  - `custos_operacionais`
  - `margem_contribuicao`
  - `despesas_administrativas`
  - `ebit`
  - `impostos`
  - `lucro_liquido`
  - `indicadores`

---

### ✅ 5. Verificar Arquivos do Projeto

**Arquivos que devem existir:**

```bash
# Backend
✅ supabase/migrations/create_dre_function.sql

# Frontend - Services
✅ src/services/dreService.js

# Frontend - Hooks
✅ src/hooks/useDRE.js
✅ src/hooks/index.js (exporta useDRE)

# Frontend - Pages
✅ src/pages/DREPage.jsx

# Frontend - Routes
✅ src/App.jsx (rota /dre configurada)

# Documentação
✅ docs/DRE_MODULE.md
✅ DRE_QUICKSTART.md
✅ RESUMO_DRE_IMPLEMENTACAO.md
✅ DRE_VALIDATION_CHECKLIST.md
✅ test-dre-sample-data.sql
```

---

### ✅ 6. Testar Interface

#### Passo 1: Acessar a página

```
1. Login como admin ou gerente
2. Navegar para: /dre
3. Página deve carregar sem erros
```

#### Passo 2: Testar filtros

```
1. Clicar em "Mês Atual" - deve calcular DRE
2. Clicar em "Ano Atual" - deve calcular DRE anual
3. Clicar em "Período Customizado"
   - Selecionar datas
   - Clicar em "Calcular DRE"
   - Deve exibir resultado
```

#### Passo 3: Verificar visualização

```
1. Verificar se valores aparecem formatados (R$ XX.XXX,XX)
2. Verificar se percentuais aparecem (XX,XX%)
3. Verificar se indicadores (cards no topo) aparecem
4. Verificar se hierarquia está correta
```

#### Passo 4: Testar exportação

```
1. Clicar em "Exportar TXT"
2. Arquivo deve baixar automaticamente
3. Abrir arquivo e verificar formatação
```

---

## 🐛 Troubleshooting

### ❌ Problema: "Função fn_calculate_dre não encontrada"

**Solução:**

```sql
-- Verificar se migration foi aplicada
SELECT * FROM supabase_migrations.schema_migrations
WHERE name LIKE '%dre%';

-- Se não existir, aplicar migration manualmente
-- Executar o conteúdo de: supabase/migrations/create_dre_function.sql
```

---

### ❌ Problema: "Valores zerados em todas as seções"

**Causas possíveis:**

1. **Não há movimentações no período**

   ```sql
   -- Verificar
   SELECT COUNT(*) FROM revenues
   WHERE date BETWEEN 'YYYY-MM-DD' AND 'YYYY-MM-DD';
   ```

2. **Movimentações sem categoria**

   ```sql
   -- Verificar
   SELECT COUNT(*) FROM revenues WHERE category_id IS NULL;
   SELECT COUNT(*) FROM expenses WHERE category_id IS NULL;

   -- Solução: Vincular categorias corretas
   UPDATE revenues SET category_id = 'uuid-categoria' WHERE id = 'uuid-receita';
   ```

3. **Unidade incorreta**
   ```sql
   -- Verificar unidade do usuário
   SELECT * FROM units WHERE user_id = auth.uid();
   ```

---

### ❌ Problema: "Erro ao exportar DRE"

**Solução:**

1. Abrir Console (F12)
2. Verificar erros JavaScript
3. Verificar se `dre` está populado:
   ```javascript
   console.log(dre);
   ```

---

### ❌ Problema: "Página /dre retorna 404"

**Solução:**

1. Verificar se rota foi adicionada em `App.jsx`
2. Verificar se importação está correta:
   ```javascript
   import { DREPage } from './pages/DREPage';
   ```
3. Verificar permissões (apenas admin/gerente)

---

## 🧪 Teste de Integração Completo

### Script de Teste Automatizado

```sql
-- Executar test-dre-sample-data.sql
\i test-dre-sample-data.sql

-- Ou copiar e colar o conteúdo do arquivo no SQL Editor
```

**Resultado esperado:**

- ✅ Insere dados de teste
- ✅ Calcula DRE automaticamente
- ✅ Exibe resultado no log

---

## 📊 Validação de Resultados

### Fórmulas de Verificação

```sql
WITH dados AS (
  SELECT fn_calculate_dre(
    'unit-id',
    '2024-01-01',
    '2024-01-31'
  ) as dre_json
)
SELECT
  (dre_json->>'receita_bruta')::jsonb->>'total' as receita_bruta,
  (dre_json->>'custos_operacionais')::jsonb->>'total' as custos_op,
  (dre_json->>'margem_contribuicao')::numeric as margem_contrib,
  (dre_json->>'despesas_administrativas')::jsonb->>'total' as desp_adm,
  (dre_json->>'ebit')::numeric as ebit,
  (dre_json->>'impostos')::jsonb->>'total' as impostos,
  (dre_json->>'lucro_liquido')::numeric as lucro_liquido,

  -- Validações matemáticas
  CASE
    WHEN ABS(
      ((dre_json->>'receita_bruta')::jsonb->>'total')::numeric -
      ((dre_json->>'custos_operacionais')::jsonb->>'total')::numeric -
      (dre_json->>'margem_contribuicao')::numeric
    ) < 0.01 THEN '✅ OK'
    ELSE '❌ ERRO: Margem Contribuição'
  END as validacao_margem,

  CASE
    WHEN ABS(
      (dre_json->>'margem_contribuicao')::numeric -
      ((dre_json->>'despesas_administrativas')::jsonb->>'total')::numeric -
      (dre_json->>'ebit')::numeric
    ) < 0.01 THEN '✅ OK'
    ELSE '❌ ERRO: EBIT'
  END as validacao_ebit,

  CASE
    WHEN ABS(
      (dre_json->>'ebit')::numeric -
      ((dre_json->>'impostos')::jsonb->>'total')::numeric -
      (dre_json->>'lucro_liquido')::numeric
    ) < 0.01 THEN '✅ OK'
    ELSE '❌ ERRO: Lucro Líquido'
  END as validacao_lucro
FROM dados;
```

**Todas as validações devem retornar:** ✅ OK

---

## 📈 Métricas de Qualidade

### Indicadores Esperados (Barbearia Padrão)

| Indicador              | Valor Esperado | Ação se Fora                     |
| ---------------------- | -------------- | -------------------------------- |
| Margem de Contribuição | 60% - 80%      | Revisar custos operacionais      |
| Margem EBIT            | 15% - 30%      | Revisar despesas administrativas |
| Margem Líquida         | 10% - 25%      | Revisar estrutura tributária     |

---

## 🔄 Checklist de Manutenção Mensal

### No início do mês:

- [ ] Verificar se todas as receitas do mês anterior têm categoria
- [ ] Verificar se todas as despesas do mês anterior têm categoria
- [ ] Gerar DRE do mês fechado
- [ ] Exportar DRE em TXT para arquivo
- [ ] Comparar com mês anterior
- [ ] Analisar desvios > 10%

### Ações corretivas:

```sql
-- Listar movimentações sem categoria
SELECT 'Receita' as tipo, id, date, value, source
FROM revenues
WHERE category_id IS NULL AND is_active = true
UNION ALL
SELECT 'Despesa' as tipo, id, date, value, description
FROM expenses
WHERE category_id IS NULL AND is_active = true
ORDER BY date DESC;

-- Corrigir vinculando categoria
UPDATE revenues
SET category_id = 'uuid-categoria-correta'
WHERE id = 'uuid-receita';

UPDATE expenses
SET category_id = 'uuid-categoria-correta'
WHERE id = 'uuid-despesa';
```

---

## 🎯 Critérios de Sucesso

### O DRE está funcionando corretamente quando:

✅ **Técnico:**

- Função SQL executa sem erros
- Service retorna dados consistentes
- Hook gerencia estado corretamente
- Página renderiza sem erros
- Exportação funciona

✅ **Funcional:**

- Todos os valores são calculados corretamente
- Fórmulas matemáticas batem
- Categorias são respeitadas
- Períodos são filtrados corretamente

✅ **Negócio:**

- Gerente consegue visualizar resultado
- Margens fazem sentido
- Dados refletem realidade da empresa
- Relatório auxilia tomada de decisão

---

## 📞 Suporte

### Em caso de dúvidas:

1. ✅ Consultar: `docs/DRE_MODULE.md` (documentação completa)
2. ✅ Consultar: `DRE_QUICKSTART.md` (guia rápido)
3. ✅ Executar: `test-dre-sample-data.sql` (dados de teste)
4. ✅ Verificar: Este checklist

### Comandos úteis:

```sql
-- Ver versão da função
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'fn_calculate_dre';

-- Ver logs de erro
SELECT * FROM pg_stat_activity
WHERE state = 'idle in transaction (aborted)';

-- Resetar conexões
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = current_database()
AND pid <> pg_backend_pid();
```

---

**✅ USE ESTE CHECKLIST SEMPRE QUE:**

- Fizer deploy em novo ambiente
- Modificar a função SQL
- Adicionar/alterar categorias
- Encontrar valores inconsistentes
- Treinar novo usuário

---

**📅 Última atualização:** 2024-10-18  
**✍️ Autor:** AI Agent - BARBER-ANALYTICS-PRO  
**📖 Versão:** 1.0.0
