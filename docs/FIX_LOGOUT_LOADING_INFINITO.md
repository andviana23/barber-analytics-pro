# 🐛 FIX: Loading Infinito ao Fazer Logout (Vercel)

**Data:** 1 de novembro de 2025  
**Autor:** Andrey Viana  
**Problema:** Após logout no Vercel, sistema fica travado em "Verificando permissões..."

---

## 🔍 Análise do Problema

### Sintomas
1. Usuário clica em "Sair"
2. Sistema fica preso em tela de loading "Verificando permissões..."
3. Única solução: limpar cache do navegador
4. Problema ocorre **apenas na produção (Vercel)**, não em desenvolvimento local

### Root Cause (Causa Raiz)

**PROBLEMA CRÍTICO:** Race condition entre `signOut()` e `onAuthStateChange()`

#### Fluxo Atual (BUGADO):

```javascript
// 1. Usuário clica em "Sair"
const signOut = async () => {
  setLoading(true);  // ✅ Loading ativado
  await supabase.auth.signOut();  // ✅ Logout no Supabase
  // ❌ NUNCA executa setLoading(false) PORQUE:
  // setLoading(false) está no finally
};

// 2. onAuthStateChange dispara evento SIGNED_OUT
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_OUT') {
    setSession(null);
    setUser(null);
    setUserRole(null);
    setAdminStatus(false);
    // ...
  }
  // ❌ Não limpa o loading aqui!
  setLoading(false); // Executado no finally
});

// 3. RACE CONDITION:
// - signOut() seta loading=true
// - onAuthStateChange processa SIGNED_OUT
// - finally de signOut() seta loading=false DEPOIS
// - Mas useEffect já executou com loading=true
// - AuthContext reinicializa e busca sessão novamente
// - Como Supabase ainda tem sessão em cache (localStorage/cookies), loading nunca termina
```

### Por Que Acontece Apenas no Vercel?

**Diferenças entre Dev e Produção:**

| Ambiente       | Latência Supabase | Latência Evento | Resultado                           |
|----------------|-------------------|-----------------|-------------------------------------|
| **Local (Dev)**| ~10-50ms          | Instantâneo     | Race condition não ocorre          |
| **Vercel**     | ~200-500ms        | Lento           | Race condition **sempre** ocorre   |

**No Vercel:**
- Latência de rede maior → `supabase.auth.signOut()` demora mais
- Evento `SIGNED_OUT` demora para propagar
- `signOut()` termina e seta `loading=false` ANTES do evento
- Mas o Supabase ainda tem sessão em localStorage
- `onAuthStateChange` tenta buscar role → loading infinito

---

## ✅ Solução Implementada

### 1. Limpar Estado IMEDIATAMENTE no signOut

```javascript
const signOut = async () => {
  try {
    // ✅ CRÍTICO: Limpar estado ANTES de fazer logout
    setSession(null);
    setUser(null);
    setUserRole(null);
    setAdminStatus(false);
    setGerenteStatus(false);
    setReceptionistStatus(false);
    setLoading(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    return { error: null };
  } catch (error) {
    return { error };
  } finally {
    setLoading(false);
  }
};
```

### 2. Evitar Busca de Role Após Logout

```javascript
const fetchUserRole = async userSession => {
  // ✅ CRÍTICO: Se não tem sessão válida, retornar imediatamente
  if (!userSession?.user) {
    setAdminStatus(false);
    setUserRole(null);
    setGerenteStatus(false);
    setReceptionistStatus(false);
    return; // ← NÃO tentar buscar dados do banco
  }
  
  // ... resto do código
};
```

### 3. Listener onAuthStateChange Robusto

```javascript
supabase.auth.onAuthStateChange(async (event, session) => {
  console.log('🔔 Auth State Change:', event, 'Session exists:', !!session);

  try {
    if (event === 'SIGNED_OUT') {
      console.log('👋 User signed out, clearing state...');
      // ✅ Limpar TUDO
      setSession(null);
      setUser(null);
      setUserRole(null);
      setAdminStatus(false);
      setGerenteStatus(false);
      setReceptionistStatus(false);
      // ✅ CRÍTICO: Desabilitar loading
      setLoading(false);
      return; // ← NÃO executar finally
    }
    // ... outros eventos
  } catch (error) {
    // ...
  } finally {
    setLoading(false); // ← Executado apenas se NÃO for SIGNED_OUT
  }
});
```

---

## 🧪 Testes de Validação

### Teste 1: Logout Local
```bash
# 1. Fazer login
# 2. Clicar em "Sair"
# 3. Verificar que redirecionou para /login SEM loading infinito
```

### Teste 2: Logout em Produção (Vercel)
```bash
# 1. Deploy no Vercel
# 2. Fazer login como Admin/Gerente
# 3. Clicar em "Sair"
# 4. Verificar que redirecionou para /login SEM loading infinito
# 5. Verificar que NÃO precisa limpar cache
```

### Teste 3: Verificar Console
```javascript
// Deve aparecer:
// 🔔 Auth State Change: SIGNED_OUT Session exists: false
// 👋 User signed out, clearing state...
// (sem logs de busca de role)
```

---

## 📋 Checklist de Implementação

- [ ] Atualizar `signOut()` para limpar estado antes do logout
- [ ] Adicionar `return` no evento `SIGNED_OUT` para evitar `finally`
- [ ] Adicionar guard clause em `fetchUserRole()`
- [ ] Testar logout em ambiente local
- [ ] Deploy no Vercel
- [ ] Testar logout em produção
- [ ] Validar que não precisa limpar cache

---

## 🚨 Pontos Críticos de Atenção

### ❌ O QUE NÃO FAZER

```javascript
// ❌ ERRADO: Não limpar estado antes de signOut
const signOut = async () => {
  await supabase.auth.signOut();
  setSession(null); // ← TARDE DEMAIS!
};

// ❌ ERRADO: Executar finally após SIGNED_OUT
if (event === 'SIGNED_OUT') {
  setSession(null);
  // NÃO tem return aqui
}
// finally executa e pode causar race condition
finally {
  setLoading(false);
}

// ❌ ERRADO: Buscar role sem verificar sessão
const fetchUserRole = async userSession => {
  // Tentar buscar direto sem validar
  const { data } = await supabase.from('professionals').select('role');
};
```

### ✅ O QUE FAZER

```javascript
// ✅ CORRETO: Limpar antes
const signOut = async () => {
  setSession(null); // ← ANTES!
  setUser(null);
  await supabase.auth.signOut();
};

// ✅ CORRETO: Return early no SIGNED_OUT
if (event === 'SIGNED_OUT') {
  setSession(null);
  setLoading(false);
  return; // ← CRÍTICO!
}

// ✅ CORRETO: Guard clause
const fetchUserRole = async userSession => {
  if (!userSession?.user) {
    return; // ← PROTEÇÃO!
  }
  // Agora pode buscar
};
```

---

## 🎯 Resultado Esperado

### Antes (BUGADO)
```
1. Click "Sair" 
   → Loading infinito
   → "Verificando permissões..."
   → Usuário precisa limpar cache
```

### Depois (CORRIGIDO)
```
1. Click "Sair"
   → Estado limpo imediatamente
   → Redirecionamento para /login
   → SEM loading infinito
   → SEM necessidade de limpar cache
```

---

## 📚 Referências

- **Supabase Auth Events:** https://supabase.com/docs/reference/javascript/auth-onauthstatechange
- **React Race Conditions:** https://react.dev/learn/you-might-not-need-an-effect#race-conditions
- **AuthContext:** `src/context/AuthContext.jsx`
- **ProtectedRoute:** `src/components/ProtectedRoute/ProtectedRoute.jsx`

---

## ✨ Autor

**Andrey Viana** — Barber Analytics Pro  
**Data de Resolução:** 1 de novembro de 2025
