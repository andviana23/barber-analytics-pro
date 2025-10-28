# ⚙️ Guia Completo de Configuração do Ambiente

> **Objetivo**: Este guia cobre todos os passos necessários para configurar seu ambiente de desenvolvimento local para o Barber Analytics Pro.

---

## 📋 Índice

- [Pré-requisitos](#-pré-requisitos)
- [Instalação Passo a Passo](#-instalação-passo-a-passo)
- [Configuração do Supabase](#-configuração-do-supabase)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Migrações do Banco de Dados](#-migrações-do-banco-de-dados)
- [Verificação da Instalação](#-verificação-da-instalação)
- [Troubleshooting](#-troubleshooting)

---

## 🔧 Pré-requisitos

### Software Necessário

| Software | Versão Mínima | Verificação | Link |
|----------|--------------|-------------|------|
| **Node.js** | 20.19.0 | `node --version` | [nodejs.org](https://nodejs.org) |
| **npm** | 10.0.0 | `npm --version` | Incluído com Node.js |
| **Git** | 2.x | `git --version` | [git-scm.com](https://git-scm.com) |
| **Supabase CLI** | Latest | `supabase --version` | [docs.supabase.com](https://supabase.com/docs/guides/cli) |

### Verificação de Pré-requisitos

Execute os seguintes comandos para verificar se tudo está instalado:

```bash
# Verificar Node.js
node --version
# Saída esperada: v20.19.0 ou superior

# Verificar npm
npm --version
# Saída esperada: 10.0.0 ou superior

# Verificar Git
git --version
# Saída esperada: git version 2.x

# Verificar Supabase CLI (opcional, mas recomendado)
supabase --version
# Saída esperada: 1.x ou superior
```

### Conta Supabase

Você precisará de:
- ✅ Conta criada em [supabase.com](https://supabase.com)
- ✅ Projeto criado no Supabase Dashboard
- ✅ Credenciais de acesso (URL e Anon Key)

---

## 📥 Instalação Passo a Passo

### 1. Clone o Repositório

```bash
# Clone via HTTPS
git clone https://github.com/seu-usuario/barber-analytics-pro.git

# OU via SSH (se configurado)
git clone git@github.com:seu-usuario/barber-analytics-pro.git

# Entre no diretório
cd barber-analytics-pro
```

### 2. Instale as Dependências

```bash
# Instalação completa
npm install

# Caso encontre erros, tente com cache limpo
npm cache clean --force
npm install
```

**Tempo esperado**: 2-5 minutos dependendo da conexão.

### 3. Configure as Variáveis de Ambiente

```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Abra o arquivo .env no seu editor favorito
code .env  # VSCode
# ou
nano .env  # Terminal
```

### 4. Inicie o Servidor de Desenvolvimento

```bash
npm run dev
```

**Saída esperada**:
```
VITE v7.1.9  ready in 234 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h to show help
```

Acesse: [http://localhost:5173](http://localhost:5173)

---

## 🗄️ Configuração do Supabase

### Passo 1: Criar Projeto no Supabase

1. Acesse [app.supabase.com](https://app.supabase.com)
2. Clique em **"New Project"**
3. Preencha:
   - **Nome**: `barber-analytics-pro` (ou seu preferido)
   - **Database Password**: Crie uma senha forte (anote!)
   - **Region**: Escolha a mais próxima (ex: `South America (São Paulo)`)
4. Clique em **"Create new project"**
5. Aguarde 2-3 minutos para provisionamento

### Passo 2: Obter Credenciais

No dashboard do projeto:

1. Vá em **Settings** → **API**
2. Copie os valores:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### Passo 3: Configurar Autenticação

1. Vá em **Authentication** → **Providers**
2. Configure **Email** provider:
   - ✅ Enable Email provider
   - ✅ Confirm email: **Desabilitado** (para desenvolvimento)
   - ✅ Secure email change: **Habilitado**

### Passo 4: Configurar Storage (Opcional)

Para upload de arquivos (OFX, imagens):

1. Vá em **Storage**
2. Crie um bucket chamado `uploads`
3. Configure as políticas de acesso conforme necessário

---

## 🔐 Variáveis de Ambiente

### Arquivo `.env`

Crie o arquivo `.env` na raiz do projeto:

```env
# ==============================================
# SUPABASE CONFIGURATION
# ==============================================

# URL do seu projeto Supabase
# Encontre em: Settings → API → Project URL
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co

# Chave pública (anon key)
# Encontre em: Settings → API → Project API keys → anon public
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ==============================================
# APPLICATION SETTINGS
# ==============================================

# Ambiente (development, staging, production)
VITE_APP_ENV=development

# URL base da aplicação
VITE_APP_URL=http://localhost:5173
```

### Variáveis Explicadas

| Variável | Descrição | Obrigatório | Exemplo |
|----------|-----------|-------------|---------|
| `VITE_SUPABASE_URL` | URL do projeto Supabase | ✅ Sim | `https://abc123.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Chave pública de acesso | ✅ Sim | `eyJhbGc...` |
| `VITE_APP_ENV` | Ambiente de execução | ❌ Não | `development` |
| `VITE_APP_URL` | URL da aplicação | ❌ Não | `http://localhost:5173` |

### Segurança das Variáveis

⚠️ **IMPORTANTE**:
- ✅ Prefixo `VITE_` é necessário para exposição no frontend
- ✅ Apenas variáveis públicas devem ter `VITE_`
- ❌ **NUNCA** commite o arquivo `.env` no Git
- ❌ **NUNCA** exponha `service_role` keys no frontend

---

## 🗃️ Migrações do Banco de Dados

### Método 1: Supabase Dashboard (Recomendado para Iniciantes)

1. Vá em **SQL Editor** no dashboard
2. Abra cada arquivo de migração em `supabase/migrations/` (em ordem)
3. Execute um por vez

**Ordem de execução**:

```bash
# 1. Schema base
20240101_initial_schema.sql

# 2. Tabelas principais
20240102_create_users_tables.sql
20240103_create_financial_tables.sql
20240104_create_lista_da_vez_tables.sql

# 3. Views e funções
20240105_create_views.sql
20240106_create_functions.sql

# 4. Políticas de segurança (RLS)
20240107_create_rls_policies.sql

# 5. Dados seed (opcional)
20240108_seed_data.sql
```

### Método 2: Supabase CLI (Avançado)

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Link com seu projeto
supabase link --project-ref xxxxxxxxxxxxx

# Executar migrações
supabase db push

# Verificar status
supabase db diff
```

### Verificar Migrações

No SQL Editor, execute:

```sql
-- Verificar tabelas criadas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';

-- Verificar views
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public';

-- Verificar funções
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public';
```

### Criar Primeiro Usuário Admin

Execute no SQL Editor:

```sql
-- Inserir usuário admin na tabela profiles
-- IMPORTANTE: O UUID deve corresponder ao ID do usuário criado no Auth
INSERT INTO public.profiles (
  id,
  email,
  role,
  full_name,
  created_at
) VALUES (
  'uuid-do-auth-user',  -- Pegar do Authentication → Users
  'admin@example.com',
  'admin',
  'Administrador',
  NOW()
);
```

---

## ✅ Verificação da Instalação

### Checklist Completo

Execute cada comando e verifique se não há erros:

```bash
# 1. Servidor de desenvolvimento inicia sem erros
npm run dev
# ✅ Deve abrir em http://localhost:5173

# 2. Build de produção funciona
npm run build
# ✅ Deve criar a pasta dist/ sem erros

# 3. Linting passa
npm run lint
# ✅ Deve mostrar 0 errors

# 4. Formatação está correta
npm run format:check
# ✅ Deve passar sem alterações necessárias

# 5. Testes unitários passam
npm run test:run
# ✅ Deve executar todos os testes com sucesso
```

### Teste de Conexão com Supabase

Crie um arquivo de teste temporário:

```javascript
// test-supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  const { data, error } = await supabase
    .from('profiles')
    .select('count')
    .limit(1);

  if (error) {
    console.error('❌ Erro de conexão:', error.message);
  } else {
    console.log('✅ Conexão com Supabase OK!');
  }
}

testConnection();
```

Execute:
```bash
node test-supabase.js
```

### Teste de Login

1. Acesse [http://localhost:5173](http://localhost:5173)
2. Tente fazer login com as credenciais criadas
3. Verifique se o dashboard carrega corretamente

---

## 🔧 Troubleshooting

### Problema: `npm install` falha

**Erro comum**:
```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

**Solução**:
```bash
# Limpar cache e node_modules
rm -rf node_modules package-lock.json
npm cache clean --force
npm install --legacy-peer-deps
```

---

### Problema: Porta 5173 já está em uso

**Erro**:
```
Error: Port 5173 is already in use
```

**Soluções**:

**Opção 1**: Matar o processo na porta
```bash
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5173 | xargs kill -9
```

**Opção 2**: Usar outra porta
```bash
npm run dev -- --port 3000
```

---

### Problema: Erro de conexão com Supabase

**Erro**:
```
Failed to fetch
NetworkError when attempting to fetch resource
```

**Verificações**:

1. ✅ Variáveis de ambiente corretas no `.env`
2. ✅ Projeto Supabase está ativo (não pausado)
3. ✅ URL e chave estão corretas
4. ✅ Firewall não está bloqueando

**Teste de conexão**:
```javascript
// No console do navegador (F12)
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...');
```

---

### Problema: RLS bloqueando queries

**Erro**:
```
error: new row violates row-level security policy
```

**Solução**:

1. Verificar se as políticas RLS foram aplicadas:

```sql
-- No SQL Editor do Supabase
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

2. Temporariamente desabilitar RLS (apenas desenvolvimento):

```sql
-- CUIDADO: Usar apenas em desenvolvimento!
ALTER TABLE sua_tabela DISABLE ROW LEVEL SECURITY;
```

3. Verificar se o usuário tem permissões:

```sql
-- Verificar role do usuário logado
SELECT auth.role();

-- Verificar claims do JWT
SELECT auth.jwt();
```

---

### Problema: Migrações falhando

**Erro**:
```
relation "table_name" already exists
```

**Solução**:

```sql
-- Dropar tabela existente (CUIDADO com dados!)
DROP TABLE IF EXISTS table_name CASCADE;

-- Ou renomear se quiser manter dados
ALTER TABLE table_name RENAME TO table_name_backup;
```

---

### Problema: ESLint/Prettier conflitos

**Erro**:
```
Delete `␍` prettier/prettier
```

**Solução**:

```bash
# Configurar line endings para o projeto
git config core.autocrlf false

# Reformatar todos os arquivos
npm run format
```

---

### Problema: Vite não recarrega alterações

**Solução**:

```bash
# 1. Limpar cache do Vite
rm -rf node_modules/.vite

# 2. Reiniciar servidor
npm run dev
```

**Ou configure watch explicitamente** em `vite.config.js`:

```javascript
export default defineConfig({
  server: {
    watch: {
      usePolling: true, // Para Windows/WSL
    },
  },
});
```

---

## 📚 Próximos Passos

Após completar o setup:

1. 📖 Leia o [Guia de Desenvolvimento](./DEVELOPMENT.md)
2. 📝 Familiarize-se com [Code Conventions](./CODE_CONVENTIONS.md)
3. 🧪 Configure testes seguindo [Testing Guide](../TESTING.md)
4. 🎨 Explore o [Design System](../DESIGN_SYSTEM.md)

---

## 🆘 Precisa de Ajuda?

- 📚 **Documentação**: Consulte [docs/README.md](../README.md)
- 🐛 **Issues**: Reporte bugs no GitHub Issues
- 💬 **Discussões**: Use GitHub Discussions para dúvidas
- 📧 **Suporte**: suporte@barberanalytics.com

---

**Última atualização**: 2025-10-27
**Versão do guia**: 1.0.0
