# 🔍 DEBUG: Acesso Total do Gerente

## ❓ Problema Relatado

"A conta de Gerente ainda está com acesso a tudo"

---

## 🧪 Checklist de Diagnóstico

Execute os seguintes passos para identificar o problema:

### 1️⃣ Verificar Dados no Banco

```sql
-- ✅ JÁ VERIFICADO
-- Sofia Santos: role='gerente' (user_metadata E professionals)
```

### 2️⃣ Verificar Console do Navegador (CRUCIAL!)

**Faça isso AGORA:**

1. Abra o navegador (F12 ou Ctrl+Shift+I)
2. Vá em **Console**
3. Faça **LOGOUT** completo
4. Faça **LOGIN** com sofiasantos@tratodebarbados.com
5. **COPIE E COLE AQUI** as mensagens do console que começam com:
   - 🔍 Buscando role do usuário
   - ✅ Role encontrado
   - 📋 User metadata

**Exemplo do que você deve ver:**

```
🔍 Buscando role do usuário: sofiasantos@tratodebarbados.com
📋 User metadata: {role: 'gerente', name: 'Sofia Santos'}
✅ Role encontrado nos metadados: gerente
```

---

### 3️⃣ Verificar Estado do AuthContext

**No console do navegador, execute:**

```javascript
// Cole isso no Console (F12)
console.log('🔍 AuthContext State:', {
  userRole: window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.renderers
    ?.get(1)
    ?.currentDispatcherRef?.current?.readContext?.(),
});

// OU inspecione manualmente:
// 1. Instale React DevTools
// 2. Vá na aba "Components"
// 3. Encontre <AuthProvider>
// 4. Veja os valores de:
//    - userRole
//    - adminStatus
//    - gerenteStatus
```

**Você deve ver:**

- `userRole: "gerente"` ✅
- `adminStatus: false` ✅
- `gerenteStatus: true` ✅

**Se ver algo diferente (como `adminStatus: true`), avise!**

---

### 4️⃣ Verificar Redirecionamento de Rotas

**Teste acessar essas URLs diretamente:**

```
# Copie e cole no navegador (uma por vez):

# ❌ Deve BLOQUEAR (redirecionar para /unauthorized):
http://localhost:5173/cadastros/formas-pagamento
http://localhost:5173/cadastros/produtos
http://localhost:5173/financeiro/contas-bancarias
http://localhost:5173/professionals
http://localhost:5173/units
http://localhost:5173/settings

# ✅ Deve PERMITIR:
http://localhost:5173/dashboard
http://localhost:5173/financial
http://localhost:5173/cadastros/categorias
http://localhost:5173/cadastros/clientes
```

**Para cada URL bloqueada, você deve ver:**

- Redirecionamento para `/unauthorized`
- Página de "Acesso Negado"

**Se não redirecionar, copie a URL que não bloqueou!**

---

### 5️⃣ Verificar Sidebar (Menu Lateral)

**O menu lateral está mostrando itens que NÃO deveria?**

Liste TODOS os itens que aparecem no menu para o gerente:

```
Exemplo:
☑ Dashboard
☑ Financeiro
☑ Lista da Vez
☑ Cadastros
   ☐ Categorias (deve aparecer)
   ☐ Clientes (deve aparecer)
   ☑ Formas de Pagamento (NÃO deve aparecer!)
   ☑ Produtos (NÃO deve aparecer!)
```

**Marque com ☑ os que APARECEM e ☐ os que NÃO aparecem.**

---

## 🎯 Possíveis Causas

### A. Cache do Navegador

**Sintoma:** Login funciona mas ainda acessa tudo
**Causa:** Token antigo em cache com permissões de admin
**Solução:**

```bash
# 1. Logout completo
# 2. Ctrl + Shift + Delete
# 3. Limpar TUDO (inclusive cookies e autenticação)
# 4. Fechar TODAS as abas
# 5. Reabrir navegador
# 6. Login novamente
```

---

### B. Token JWT Antigo

**Sintoma:** userRole correto mas adminStatus = true
**Causa:** JWT ainda tem role='admin' de login anterior
**Solução:**

```javascript
// No console do navegador:
localStorage.clear();
sessionStorage.clear();
location.reload();
```

---

### C. Sidebar Sem Filtro de Roles

**Sintoma:** Menu mostra todos os itens
**Causa:** Sidebar não está filtrando por role
**Solução:** Precisamos atualizar o componente Sidebar

---

### D. RLS Policies Não Aplicadas

**Sintoma:** Consegue ver dados de páginas bloqueadas
**Causa:** RLS policies não estão funcionando
**Solução:** Verificar se JWT está sendo passado corretamente

---

## 📝 Checklist Rápido

Execute TODOS estes passos:

- [ ] 1. Fez logout completo
- [ ] 2. Limpou cache/cookies (Ctrl+Shift+Delete → Tudo)
- [ ] 3. Fechou TODAS as abas do navegador
- [ ] 4. Reabriu o navegador
- [ ] 5. Fez login novamente com sofiasantos@tratodebarbados.com
- [ ] 6. Verificou console do navegador (logs de role)
- [ ] 7. Testou acessar URL bloqueada diretamente
- [ ] 8. Verificou se menu lateral mostra itens corretos

---

## 🔧 DEBUG Script

Execute este script no **Console do navegador** após fazer login:

```javascript
// Cole tudo de uma vez no Console (F12):

console.log('🔍 DEBUG: Estado da Autenticação');
console.log('================================');

// 1. Verificar localStorage
const authToken = localStorage.getItem('sb-cwfrtqtienguzwsybvwm-auth-token');
if (authToken) {
  try {
    const parsed = JSON.parse(authToken);
    console.log('📦 Auth Token:', {
      user_email: parsed.user?.email,
      user_role: parsed.user?.user_metadata?.role,
      access_token_exists: !!parsed.access_token,
    });
  } catch (e) {
    console.error('❌ Erro ao parsear token:', e);
  }
} else {
  console.warn('⚠️ Nenhum token de autenticação encontrado!');
}

// 2. Verificar se há dados no sessionStorage
const sessionKeys = Object.keys(sessionStorage);
console.log('🗂️ sessionStorage keys:', sessionKeys);

// 3. Verificar URL atual
console.log('🌐 URL atual:', window.location.href);

// 4. Tentar acessar React DevTools (se disponível)
if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
  console.log('✅ React DevTools disponível');
} else {
  console.warn('⚠️ React DevTools não detectado');
}

console.log('================================');
console.log('📋 COPIE TUDO ACIMA E ENVIE!');
```

---

## 🎯 Próxima Ação

**AGUARDANDO SUAS RESPOSTAS:**

1. ✅ Fez logout/login completo com cache limpo?
2. 🔍 O que aparece no console do navegador?
3. 🔗 Quais URLs bloqueadas você consegue acessar?
4. 📋 Quais itens aparecem no menu lateral?
5. 💻 Resultado do script de debug acima?

**Com essas informações, poderei identificar exatamente onde está o problema!**
