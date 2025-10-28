# 🔧 Guia de Solução de Problemas

> **Objetivo**: Resolver problemas comuns de instalação, desenvolvimento e produção do Barber Analytics Pro.

---

## 📋 Índice

- [Problemas de Instalação](#-problemas-de-instalação)
- [Erros de Build](#-erros-de-build)
- [Problemas com Supabase](#-problemas-com-supabase)
- [Erros de Autenticação](#-erros-de-autenticação)
- [Performance Issues](#-performance-issues)
- [Erros de Desenvolvimento](#-erros-de-desenvolvimento)
- [Problemas de Deploy](#-problemas-de-deploy)
- [Como Obter Ajuda](#-como-obter-ajuda)

---

## 📦 Problemas de Instalação

### ❌ Erro: `npm install` falha com ERESOLVE

**Sintoma**:
```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

**Causa**: Conflitos de dependências entre pacotes.

**Soluções**:

```bash
# Solução 1: Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

# Solução 2: Usar legacy peer deps
npm install --legacy-peer-deps

# Solução 3: Forçar resolução
npm install --force
```

---

### ❌ Erro: `node-gyp` build falha

**Sintoma**:
```
gyp ERR! stack Error: Could not find any Visual Studio installation to use
```

**Causa**: Dependências nativas não conseguem compilar (Windows).

**Solução**:

```bash
# Instalar build tools
npm install --global windows-build-tools

# Ou instalar Visual Studio Build Tools manualmente
# https://visualstudio.microsoft.com/downloads/

# Depois reinstalar
npm install
```

---

### ❌ Erro: Versão do Node incompatível

**Sintoma**:
```
error: The engine "node" is incompatible with this module
```

**Causa**: Versão do Node.js é inferior a 20.19.0.

**Solução**:

```bash
# Verificar versão atual
node --version

# Instalar Node 20.19.0 ou superior
# Usando nvm (recomendado)
nvm install 20.19.0
nvm use 20.19.0

# Ou baixar de https://nodejs.org
```

---

### ❌ Erro: Permissões no npm (Linux/Mac)

**Sintoma**:
```
Error: EACCES: permission denied
```

**Causa**: npm tentando instalar globalmente sem permissões.

**Solução**:

```bash
# NÃO use sudo npm install

# Solução 1: Configurar npm para user directory
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# Solução 2: Usar nvm (recomendado)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
```

---

## 🏗️ Erros de Build

### ❌ Erro: Build falha com "out of memory"

**Sintoma**:
```
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

**Causa**: Node não tem memória suficiente para build.

**Solução**:

```bash
# Aumentar limite de memória
NODE_OPTIONS="--max-old-space-size=4096" npm run build

# Ou adicionar no package.json
{
  "scripts": {
    "build": "NODE_OPTIONS='--max-old-space-size=4096' vite build"
  }
}
```

---

### ❌ Erro: Import path não encontrado

**Sintoma**:
```
Error: Cannot find module './MyComponent'
```

**Causa**: Caminho de import incorreto ou case-sensitivity.

**Soluções**:

```javascript
// ❌ Ruim
import Button from './button'; // arquivo é Button.jsx

// ✅ Bom
import Button from './Button';

// Verificar estrutura de pastas
ls -la src/atoms/Button/
```

---

### ❌ Erro: CSS não carrega em produção

**Sintoma**: Build funciona mas CSS não aparece em produção.

**Causa**: Import de CSS incorreto ou Tailwind não configurado.

**Soluções**:

```javascript
// 1. Verificar se index.css está importado no main.jsx
import './index.css';

// 2. Verificar tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  // ...
}

// 3. Verificar postcss.config.js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

---

### ❌ Erro: Variáveis de ambiente não definidas

**Sintoma**:
```
import.meta.env.VITE_SUPABASE_URL is undefined
```

**Causa**: Arquivo `.env` não existe ou variáveis sem prefixo `VITE_`.

**Solução**:

```bash
# 1. Criar arquivo .env
cp .env.example .env

# 2. Adicionar variáveis com prefixo VITE_
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...

# 3. Reiniciar servidor dev
npm run dev

# 4. Verificar no código
console.log(import.meta.env.VITE_SUPABASE_URL);
```

---

## 🗄️ Problemas com Supabase

### ❌ Erro: Failed to fetch / Network error

**Sintoma**:
```
TypeError: Failed to fetch
NetworkError when attempting to fetch resource
```

**Causa**: Não consegue conectar ao Supabase.

**Diagnóstico**:

```javascript
// Abra o console do navegador (F12) e execute:
console.log('URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Key:', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20));

// Teste conexão direta
fetch(import.meta.env.VITE_SUPABASE_URL + '/rest/v1/')
  .then(r => r.text())
  .then(console.log)
  .catch(console.error);
```

**Soluções**:

1. **Verificar variáveis de ambiente**:
```bash
# .env deve ter:
VITE_SUPABASE_URL=https://xxxxx.supabase.co  # Sem barra no final
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

2. **Verificar status do projeto Supabase**:
   - Acesse [app.supabase.com](https://app.supabase.com)
   - Verifique se o projeto está ativo (não pausado)

3. **Verificar firewall/proxy**:
```bash
# Testar conectividade
curl https://seu-projeto.supabase.co/rest/v1/
```

4. **Verificar CORS**:
   - No dashboard Supabase: Settings → API → CORS
   - Adicione `http://localhost:5173` para desenvolvimento

---

### ❌ Erro: Invalid API key

**Sintoma**:
```
{
  "message": "Invalid API key",
  "code": "PGRST301"
}
```

**Causa**: Chave de API incorreta ou expirada.

**Solução**:

```bash
# 1. Obter nova chave do dashboard
# Settings → API → Project API keys → anon public

# 2. Atualizar .env
VITE_SUPABASE_ANON_KEY=nova-chave-aqui

# 3. Reiniciar servidor
npm run dev
```

---

### ❌ Erro: RLS policy violation

**Sintoma**:
```
{
  "message": "new row violates row-level security policy",
  "code": "42501"
}
```

**Causa**: Row-Level Security bloqueando a operação.

**Diagnóstico**:

```sql
-- No SQL Editor do Supabase
-- 1. Verificar políticas existentes
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- 2. Verificar role do usuário
SELECT auth.role();

-- 3. Verificar JWT
SELECT auth.jwt();
```

**Soluções**:

1. **Para desenvolvimento** (temporário):
```sql
-- ATENÇÃO: Apenas para desenvolvimento!
ALTER TABLE sua_tabela DISABLE ROW LEVEL SECURITY;
```

2. **Criar política correta**:
```sql
-- Exemplo: Permitir leitura para usuários autenticados
CREATE POLICY "Users can view own unit data"
ON revenues
FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM profiles WHERE unit_id = revenues.unit_id
  )
);
```

3. **Verificar JWT claims**:
```javascript
// No código, verificar claims
const { data: { user } } = await supabase.auth.getUser();
console.log('User:', user);
console.log('JWT:', user?.aud);
```

---

### ❌ Erro: Query timeout

**Sintoma**:
```
Error: Query timeout after 30000ms
```

**Causa**: Query muito lenta ou banco sobrecarregado.

**Soluções**:

1. **Adicionar índices**:
```sql
-- Identificar queries lentas no Dashboard → Logs
-- Adicionar índices nas colunas filtradas

CREATE INDEX idx_revenues_transaction_date
ON revenues(transaction_date);

CREATE INDEX idx_revenues_unit_id
ON revenues(unit_id);
```

2. **Otimizar query**:
```javascript
// ❌ Ruim - fetch tudo
const { data } = await supabase
  .from('revenues')
  .select('*, parties(*), payment_methods(*), categories(*)');

// ✅ Bom - select específico
const { data } = await supabase
  .from('revenues')
  .select('id, amount, description, parties(name)')
  .limit(100);
```

3. **Usar paginação**:
```javascript
const { data, count } = await supabase
  .from('revenues')
  .select('*', { count: 'exact' })
  .range(0, 49) // Primeira página (50 itens)
  .order('created_at', { ascending: false });
```

---

## 🔐 Erros de Autenticação

### ❌ Erro: User not authenticated

**Sintoma**:
```
Error: User not authenticated
```

**Causa**: Sessão expirada ou não existe.

**Diagnóstico**:

```javascript
// Verificar sessão atual
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);

// Verificar user
const { data: { user } } = await supabase.auth.getUser();
console.log('User:', user);
```

**Soluções**:

```javascript
// 1. Verificar se Auth está configurado
// src/services/supabase.js
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);

// 2. Verificar ProtectedRoute
// Deve redirecionar para login se não autenticado

// 3. Limpar localStorage e tentar novamente
localStorage.clear();
window.location.reload();
```

---

### ❌ Erro: Email already registered

**Sintoma**:
```
{
  "message": "User already registered",
  "status": 400
}
```

**Causa**: Email já existe no sistema.

**Solução**:

```javascript
// Tentar login em vez de signup
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'senha',
});

// Ou resetar senha
const { error } = await supabase.auth.resetPasswordForEmail(
  'user@example.com',
  {
    redirectTo: 'http://localhost:5173/reset-password',
  }
);
```

---

### ❌ Erro: Invalid login credentials

**Sintoma**:
```
{
  "message": "Invalid login credentials",
  "status": 400
}
```

**Causa**: Email ou senha incorretos.

**Soluções**:

1. **Verificar credenciais**:
```javascript
// Adicionar logging para debug
console.log('Attempting login with:', email);

const { data, error } = await supabase.auth.signInWithPassword({
  email: email.trim().toLowerCase(), // Normalizar
  password: password,
});

if (error) {
  console.error('Login error:', error);
}
```

2. **Resetar senha**:
```javascript
await supabase.auth.resetPasswordForEmail(email);
```

3. **Verificar no Dashboard**:
   - Authentication → Users
   - Confirmar que usuário existe
   - Verificar se email foi confirmado

---

## ⚡ Performance Issues

### ❌ Problema: Aplicação lenta

**Sintomas**:
- Navegação lenta entre páginas
- Componentes demoram a renderizar
- Alto uso de CPU/memória

**Diagnóstico**:

```javascript
// 1. React DevTools Profiler
// - Abra React DevTools
// - Tab "Profiler"
// - Clique em "Record" e interaja
// - Identifique componentes lentos

// 2. Chrome Performance
// - F12 → Performance
// - Record → Interact → Stop
// - Analise flame chart

// 3. Lighthouse
// - F12 → Lighthouse
// - Generate report
```

**Soluções**:

1. **Memoização**:
```javascript
import { memo, useMemo, useCallback } from 'react';

// Memoizar componente pesado
const ExpensiveList = memo(function ExpensiveList({ items }) {
  return items.map(item => <Item key={item.id} {...item} />);
});

// Memoizar computações
function Dashboard({ data }) {
  const processedData = useMemo(
    () => expensiveCalculation(data),
    [data]
  );

  const handleClick = useCallback(() => {
    console.log('Clicked');
  }, []);

  return <div>{/* ... */}</div>;
}
```

2. **Code Splitting**:
```javascript
import { lazy, Suspense } from 'react';

const HeavyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <HeavyComponent />
    </Suspense>
  );
}
```

3. **Otimizar Queries**:
```javascript
// TanStack Query com staleTime
const { data } = useQuery({
  queryKey: ['revenues'],
  queryFn: fetchRevenues,
  staleTime: 30000, // 30 segundos
  cacheTime: 300000, // 5 minutos
});
```

---

### ❌ Problema: Re-renders excessivos

**Sintoma**: Componente renderiza muitas vezes desnecessariamente.

**Diagnóstico**:

```javascript
// Adicionar logging
function MyComponent(props) {
  console.log('Rendering MyComponent', props);

  // Ou usar hook de debug
  useWhyDidYouUpdate('MyComponent', props);

  return <div>{/* ... */}</div>;
}

// Hook personalizado
function useWhyDidYouUpdate(name, props) {
  const previousProps = useRef();

  useEffect(() => {
    if (previousProps.current) {
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      const changedProps = {};

      allKeys.forEach(key => {
        if (previousProps.current[key] !== props[key]) {
          changedProps[key] = {
            from: previousProps.current[key],
            to: props[key],
          };
        }
      });

      if (Object.keys(changedProps).length > 0) {
        console.log('[why-did-you-update]', name, changedProps);
      }
    }

    previousProps.current = props;
  });
}
```

**Soluções**:

```javascript
// 1. Memoizar callbacks
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]); // Só recria se id mudar

// 2. Memoizar componentes filhos
const MemoizedChild = memo(ChildComponent);

// 3. Evitar criar objetos/arrays inline
// ❌ Ruim
<MyComponent style={{ margin: 10 }} items={[]} />

// ✅ Bom
const style = { margin: 10 };
const items = [];
<MyComponent style={style} items={items} />
```

---

## 🐛 Erros de Desenvolvimento

### ❌ Erro: HMR (Hot Reload) não funciona

**Sintoma**: Alterações no código não refletem no navegador.

**Soluções**:

```javascript
// 1. Reiniciar servidor
Ctrl + C
npm run dev

// 2. Limpar cache do Vite
rm -rf node_modules/.vite
npm run dev

// 3. Configurar watch (Windows/WSL)
// vite.config.js
export default defineConfig({
  server: {
    watch: {
      usePolling: true,
      interval: 100,
    },
  },
});
```

---

### ❌ Erro: ESLint mostra muitos warnings

**Sintoma**: Centenas de warnings no terminal.

**Soluções**:

```bash
# 1. Corrigir automaticamente
npm run lint:fix

# 2. Desabilitar regra específica
// eslint.config.js
export default [
  {
    rules: {
      'no-console': 'off', // Desabilitar warning de console.log
      'no-unused-vars': 'warn', // Apenas warning, não error
    },
  },
];

# 3. Ignorar arquivo específico
// No arquivo .js
/* eslint-disable no-console */
console.log('Debug info');
/* eslint-enable no-console */
```

---

### ❌ Erro: Port 5173 já está em uso

**Sintoma**:
```
Error: Port 5173 is already in use
```

**Soluções**:

```bash
# Solução 1: Matar processo na porta
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5173 | xargs kill -9

# Solução 2: Usar outra porta
npm run dev -- --port 3000

# Solução 3: Configurar porta padrão
// vite.config.js
export default defineConfig({
  server: {
    port: 3000,
  },
});
```

---

## 🚀 Problemas de Deploy

### ❌ Erro: Build falha no Vercel

**Sintoma**: Deploy falha com erro de build.

**Soluções**:

```bash
# 1. Testar build localmente
npm run build
npm run preview

# 2. Verificar variáveis de ambiente no Vercel
# Dashboard → Settings → Environment Variables
# Adicionar:
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...

# 3. Verificar vercel.json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}

# 4. Verificar Node version
# vercel.json
{
  "builds": [{
    "src": "package.json",
    "use": "@vercel/node",
    "config": { "nodeVersion": "20.x" }
  }]
}
```

---

### ❌ Erro: 404 ao recarregar página em produção

**Sintoma**: Rota funciona ao navegar, mas 404 ao recarregar.

**Causa**: SPA precisa de rewrite rules.

**Solução**:

```json
// vercel.json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

---

## 🆘 Como Obter Ajuda

### 1. Verificar Documentação

- 📚 [README.md](../../README.md)
- ⚙️ [Setup Guide](./SETUP.md)
- 💻 [Development Guide](./DEVELOPMENT.md)
- 📝 [Code Conventions](./CODE_CONVENTIONS.md)

### 2. Buscar Issues Existentes

```bash
# GitHub Issues
https://github.com/seu-repo/barber-analytics-pro/issues

# Buscar por palavras-chave
# Ex: "authentication error", "build fails"
```

### 3. Criar Nova Issue

Use template de bug report:
- Descrição clara do problema
- Passos para reproduzir
- Comportamento esperado vs atual
- Screenshots/logs
- Ambiente (OS, Node, browser)

### 4. GitHub Discussions

Para dúvidas gerais que não são bugs:
```
https://github.com/seu-repo/barber-analytics-pro/discussions
```

### 5. Contato Direto

- 📧 **Email**: suporte@barberanalytics.com
- 💬 **Discord**: [Link do servidor]
- 🐦 **Twitter**: [@barberanalytics]

### Template de Pedido de Ajuda

```markdown
## 🔍 Problema

[Descrição clara do problema]

## 📋 O que já tentei

- [ ] Verificar documentação
- [ ] Limpar node_modules e reinstalar
- [ ] Verificar variáveis de ambiente
- [ ] Testar em navegador diferente
- [ ] Verificar console de erros

## 💻 Ambiente

- OS: [Windows 11 / macOS 13 / Ubuntu 22.04]
- Node: [20.19.0]
- npm: [10.0.0]
- Browser: [Chrome 120]

## 📝 Logs/Screenshots

```
[Cole logs de erro aqui]
```

## 🔗 Contexto Adicional

[Qualquer informação relevante]
```

---

## 🔍 Ferramentas de Debug

### Browser DevTools

```javascript
// Console (F12)
console.log('Debug:', data);
console.table(array);
console.time('operation');
// ... código ...
console.timeEnd('operation');

// Breakpoints
debugger; // Pausa execução

// Network tab
// - Ver requests/responses
// - Verificar headers
// - Analisar payloads
```

### React DevTools

```bash
# Instalar extensão
# Chrome: https://chrome.google.com/webstore/detail/react-developer-tools/
# Firefox: https://addons.mozilla.org/en-US/firefox/addon/react-devtools/

# Usar:
# - Inspecionar componentes
# - Ver props/state
# - Profiler para performance
```

### Supabase Logs

```javascript
// Habilitar logs
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key, {
  auth: {
    debug: true, // Logs detalhados
  },
});

// Dashboard
// Logs → Query Logs
// Ver queries executadas, tempo, erros
```

---

**Última atualização**: 2025-10-27
**Versão do guia**: 1.0.0
