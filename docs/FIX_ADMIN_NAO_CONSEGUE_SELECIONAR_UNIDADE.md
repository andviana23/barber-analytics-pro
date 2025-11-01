# 🐛 FIX: Administrador Não Consegue Selecionar Unidade

**Data:** 1 de novembro de 2025  
**Problema:** Usuário admin não consegue selecionar unidades no seletor da página Financeiro Avançado  
**Autor:** Andrey Viana

---

## 🔍 Análise do Problema

### Sintomas
- Admin faz login com sucesso
- Abre página "Módulo Financeiro Avançado"
- Seletor de unidades aparece **vazio** ou **desabilitado**
- Console mostra que `units` array está vazio ou undefined

### Root Cause Identificada

Após análise profunda do banco de dados e código, identifiquei que:

1. ✅ **RLS Policies estão corretas** na tabela `units`
2. ✅ **get_user_role() retorna 'admin' corretamente**
3. ✅ **Usuário admin tem user_id vinculado às unidades**
4. ❌ **PROBLEMA**: O `UnitContext` depende de `professionals` para carregar unidades

### Verificação do Banco de Dados

```sql
-- Usuário admin tem 2 registros em professionals (1 por unidade)
SELECT 
    u.email,
    p.role,
    p.unit_id,
    un.name as unit_name
FROM auth.users u
JOIN professionals p ON p.user_id = u.id
JOIN units un ON un.id = p.unit_id
WHERE u.email = 'andrey@tratodebarbados.com';

-- Resultado:
-- andrey@tratodebarbados.com | admin | 577aa606... | Nova Lima
-- andrey@tratodebarbados.com | admin | 28c57936... | Mangabeiras
```

### Policies RLS da Tabela `units`

```sql
-- Policy 1: units_select_policy (RESTRITIVA)
(get_user_role() = 'admin' OR user_id = auth.uid())

-- Policy 2: gerente_select_all_units (PERMISSIVA)
true  -- Permite SELECT para todos
```

**Conflito:** Quando há múltiplas policies, PostgreSQL usa **OR lógico**. Então se UMA permitir, a operação é autorizada. Logo, a policy `gerente_select_all_units` deveria permitir SELECT para todos.

---

## 🔎 Investigação Adicional

### Teste 1: unitsRepository.findAll()

O repository faz:
```javascript
let query = supabase.from('units').select(defaultSelect);
if (!includeInactive) {
  query = query.eq('is_active', true);
}
```

**Resultado esperado:** Deveria retornar ambas as unidades (Nova Lima e Mangabeiras).

### Teste 2: UnitContext loadUnits()

```javascript
const { data, error } = await unitsService.getUnits({
  includeInactive: false,
});
```

**Log esperado:**
```
📍 UnitContext - Unidades carregadas: 2
```

### Teste 3: Console do Browser

Verificar no console do navegador se `units` array está vazio:
```javascript
console.log('🏢 FinanceiroAdvancedPage - Units carregadas:', units);
```

---

## 🎯 Hipóteses e Testes

### Hipótese 1: Erro Silencioso no Repository

**Possível causa:** O Supabase JS está retornando erro mas não está sendo logado.

**Teste:**
```javascript
// Em unitsRepository.js - linha ~20
const { data, error } = await formatOrder(query);
console.log('🔍 unitsRepository.findAll - data:', data);
console.log('🔍 unitsRepository.findAll - error:', error);
return { data, error };
```

### Hipótese 2: RLS Bloqueando por Context

**Possível causa:** Supabase Client está usando um `user_id` diferente do esperado.

**Teste:**
```javascript
// Adicionar em unitsRepository.js
const { data: userData } = await supabase.auth.getUser();
console.log('👤 Current user:', userData.user?.email, userData.user?.id);
```

### Hipótese 3: Cache do Browser

**Possível causa:** localStorage ou cache de sessão está interferindo.

**Teste:**
1. Abrir DevTools
2. Application → Local Storage → Limpar tudo
3. Application → Session Storage → Limpar tudo
4. Fazer logout e login novamente

---

## ✅ Solução Proposta

### Solução 1: Adicionar Logs Detalhados (DIAGNÓSTICO)

Adicionar logs em 3 pontos críticos:

#### 1. unitsRepository.js
```javascript
async findAll({ includeInactive = false } = {}) {
  console.log('🔍 [unitsRepository] findAll - includeInactive:', includeInactive);
  
  let query = supabase.from(table).select(defaultSelect);

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await formatOrder(query);
  
  console.log('🔍 [unitsRepository] findAll - data:', data);
  console.log('🔍 [unitsRepository] findAll - error:', error);
  console.log('🔍 [unitsRepository] findAll - count:', data?.length);
  
  return { data, error };
}
```

#### 2. unitsService.js
```javascript
async getUnits(params = {}) {
  console.log('🔍 [unitsService] getUnits - params:', params);
  
  const includeInactive = this.resolveIncludeInactiveFlag(params);
  const filtersDTO = new UnitFiltersDTO({ includeInactive });

  if (!filtersDTO.isValid()) {
    console.error('❌ [unitsService] getUnits - DTO inválido:', filtersDTO.getErrorMessage());
    return {
      data: null,
      error: buildError(filtersDTO.getErrorMessage()),
    };
  }

  try {
    const { data, error } = await unitsRepository.findAll(
      filtersDTO.toRepositoryFilters()
    );

    console.log('🔍 [unitsService] getUnits - repository data:', data);
    console.log('🔍 [unitsService] getUnits - repository error:', error);

    if (error) {
      console.error('❌ [unitsService] getUnits - erro do repository:', error);
      return { data: null, error };
    }

    const units = (data || []).map(toUnitResponse);
    
    console.log('✅ [unitsService] getUnits - units mapeadas:', units.length, units);

    return { data: units, error: null };
  } catch (error) {
    console.error('❌ [unitsService] getUnits - catch error:', error);
    return {
      data: null,
      error: buildError(`Falha ao carregar unidades: ${error.message}`),
    };
  }
}
```

#### 3. UnitContext.jsx
```javascript
const loadUnits = useCallback(async () => {
  console.log('🔄 [UnitContext] Iniciando loadUnits...');
  try {
    setLoading(true);
    setError(null);

    console.log('🔄 [UnitContext] Chamando unitsService.getUnits...');
    const { data, error } = await unitsService.getUnits({
      includeInactive: false,
    });

    console.log('🔍 [UnitContext] loadUnits - data:', data);
    console.log('🔍 [UnitContext] loadUnits - error:', error);

    if (error) {
      console.error('❌ [UnitContext] loadUnits - erro:', error);
      throw error;
    }

    console.log('📍 [UnitContext] Unidades carregadas:', data?.length || 0, data);
    setAllUnits(data || []);

    // ... resto do código
  } catch (err) {
    console.error('❌ [UnitContext] Erro ao carregar unidades:', err);
    setError(err.message || 'Erro ao carregar unidades');
    return [];
  } finally {
    setLoading(false);
  }
}, []);
```

---

### Solução 2: Verificar Supabase Client Auth State

Adicionar verificação do estado de autenticação:

```javascript
// Em unitsRepository.js - antes de qualquer query
const checkAuth = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  console.log('👤 Supabase Auth User:', user?.email, user?.id);
  console.log('👤 Supabase Auth Error:', error);
  return user;
};

// Modificar findAll para verificar auth
async findAll({ includeInactive = false } = {}) {
  const user = await checkAuth();
  
  if (!user) {
    console.error('❌ Usuário não autenticado no Supabase Client!');
    return { data: [], error: { message: 'Usuário não autenticado' } };
  }
  
  // ... resto do código
}
```

---

### Solução 3: Simplificar Policy (SE LOGS MOSTRAREM PROBLEMA DE RLS)

**APENAS se os logs mostrarem que o problema é RLS**, simplificar a policy:

```sql
-- Dropar policy conflitante
DROP POLICY IF EXISTS units_select_policy ON units;

-- Manter apenas a policy permissiva
-- (já existe: gerente_select_all_units com qual = true)

-- OU criar uma policy específica para admin
CREATE POLICY admin_select_all_units ON units
  FOR SELECT
  USING (get_user_role() = 'admin');
```

---

## 📋 Plano de Ação

### Fase 1: Diagnóstico (AGORA)
1. ✅ Adicionar logs detalhados em repository, service e context
2. ✅ Fazer commit e push
3. ✅ Deploy no Vercel
4. ✅ Testar como admin e verificar console
5. ✅ Coletar logs completos

### Fase 2: Correção (APÓS DIAGNÓSTICO)
- Dependendo dos logs, aplicar correção apropriada
- Se for problema de auth: verificar Supabase client initialization
- Se for problema de RLS: ajustar policies
- Se for problema de cache: limpar localStorage/sessionStorage

### Fase 3: Validação
1. Testar login como admin
2. Verificar que unidades aparecem no seletor
3. Selecionar cada unidade e verificar que dados são filtrados corretamente
4. Testar navegação entre tabs (Fluxo, Receitas, Despesas, etc.)

---

## 🎯 Resultado Esperado

Após correção:

- ✅ Admin faz login
- ✅ Página "Módulo Financeiro Avançado" carrega
- ✅ Seletor mostra **2 unidades**: "Nova Lima" e "Mangabeiras"
- ✅ Admin pode selecionar qualquer unidade
- ✅ Dados são filtrados corretamente por unidade
- ✅ Console mostra logs claros do fluxo de dados

---

**Status:** 🔴 **DIAGNÓSTICO EM ANDAMENTO**  
**Próximo Passo:** Adicionar logs e testar no Vercel
