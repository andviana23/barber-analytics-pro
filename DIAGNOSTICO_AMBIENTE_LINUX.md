# 🔍 Diagnóstico de Ambiente - Linux Pop-OS (1º de Novembro de 2025)

## 📊 Status Atual do Sistema

### ✅ O que JÁ está funcionando

| Ferramenta       | Versão       | Status       |
| ---------------- | ------------ | ------------ |
| **Node.js**      | v24.11.0     | ✅ OK        |
| **npm**          | 11.6.1       | ✅ OK        |
| **Git**          | 2.34.1       | ✅ OK        |
| **Python3**      | 3.10.12      | ✅ OK        |
| **curl / wget**  | Instalado    | ✅ OK        |
| **node_modules** | ~600 pacotes | ✅ Instalado |

---

## ❌ O que FALTA instalar / configurar

### 1. **PostgreSQL Client (CRÍTICO)** ⚠️

**Por quê?** Você está usando `@supabase/supabase-js` que precisa de `psql` para:

- Testes de integração com banco de dados
- Executar migrações SQL localmente
- Conectar-se ao banco Supabase via CLI

**Como instalar:**

```bash
sudo apt update
sudo apt install -y postgresql-client
```

**Verificar instalação:**

```bash
psql --version
```

**Versão recomendada:** 14+ (mas qualquer versão compatível com seu Supabase funciona)

---

### 2. **Supabase CLI (RECOMENDADO)** 📦

**Por quê?** Essencial para:

- Gerenciar migrações SQL
- Executar Supabase localmente (se necessário)
- Sincronizar tipos TypeScript com banco
- Gerenciar Edge Functions

**Como instalar:**

```bash
# Opção 1: Via npm (mais fácil no seu caso)
npm install -g supabase

# Opção 2: Via apt
curl https://releases.supabase.com/cli/install/linux.sh | sudo bash
```

**Verificar instalação:**

```bash
supabase --version
```

**Após instalar, inicializar projeto:**

```bash
cd /home/andrey/barber-analytics-pro
supabase init
supabase link --project-ref seu-projeto-id-supabase
```

---

### 3. **Arquivo .env (CRÍTICO)** 🔑

**Status:** ❌ NÃO EXISTE

**Como criar:**

```bash
cd /home/andrey/barber-analytics-pro
cp .env.example .env
```

**Editar `.env` com suas credenciais Supabase:**

```bash
nano .env
```

**Variáveis OBRIGATÓRIAS:**

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Como encontrar seus valores:**

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá em: **Settings → API → Project URL** (copie em `VITE_SUPABASE_URL`)
4. Vá em: **Settings → API → Project API keys → anon public** (copie em `VITE_SUPABASE_ANON_KEY`)

---

## 🚀 Passo a Passo - Setup Completo (30 minutos)

### 1️⃣ Instalar PostgreSQL Client

```bash
sudo apt update
sudo apt install -y postgresql-client
psql --version  # Confirmar instalação
```

### 2️⃣ Instalar Supabase CLI

```bash
npm install -g supabase
supabase --version  # Confirmar instalação
```

### 3️⃣ Criar arquivo .env

```bash
cd /home/andrey/barber-analytics-pro
cp .env.example .env
nano .env  # Editar com seus valores
```

### 4️⃣ Validar que npm install foi bem

```bash
cd /home/andrey/barber-analytics-pro
npm list --depth=0 | head -20  # Verificar se tudo está instalado
```

### 5️⃣ Testar build

```bash
npm run lint       # Verificar código
npm run build      # Fazer build de produção
```

### 6️⃣ Iniciar servidor de desenvolvimento

```bash
npm run dev        # Vite vai servir em http://localhost:5173
```

---

## 📋 Checklist de Dependências

### Sistema Operacional (Linux Pop-OS)

- [x] Node.js >= 20.19.0 ✅ (v24.11.0)
- [x] npm >= 10.0.0 ✅ (v11.6.1)
- [x] Git ✅ (2.34.1)
- [x] Python3 ✅ (3.10.12)
- [x] curl / wget ✅
- [ ] **PostgreSQL Client** ❌ INSTALAR AGORA
- [ ] **Supabase CLI** ❌ INSTALAR AGORA

### Node.js / npm

- [x] node_modules instalado ✅
- [x] Vite 7.1.9 ✅
- [x] React 19.2.0 ✅
- [x] Tailwind CSS 3.4.18 ✅
- [x] ESLint 9.37.0 ✅
- [x] Prettier 3.6.2 ✅
- [x] Vitest 3.2.4 ✅
- [x] Playwright 1.56.0 ✅

### Configuração

- [ ] **arquivo .env** ❌ CRIAR AGORA
- [x] .env.example ✅ Existe
- [x] Arquivos de config ✅ (vite.config.js, tailwind.config.js, etc)

---

## 🎯 Diferenças Windows → Linux Pop-OS

| Aspecto          | Windows           | Linux Pop-OS       |
| ---------------- | ----------------- | ------------------ |
| **Shell**        | PowerShell / CMD  | bash/zsh           |
| **Caminho**      | `C:\Users\...`    | `/home/andrey/...` |
| **Comandos**     | `.ps1` scripts    | `.sh` scripts      |
| **PostgreSQL**   | pg_install → msvc | apt install        |
| **Supabase CLI** | Via npm ou exe    | Via npm ou curl    |
| **Permissões**   | UAC               | sudo               |
| **Terminal**     | PowerShell ISE    | Terminal nativa    |

---

## 🔧 Troubleshooting Comum

### Problema: `psql: command not found`

```bash
# Solução:
sudo apt install -y postgresql-client
```

### Problema: `supabase: command not found`

```bash
# Solução:
npm install -g supabase
# Ou adicione ao PATH:
export PATH="$PATH:$(npm config get prefix)/bin"
```

### Problema: `.env` não está sendo lido

```bash
# Verificar se arquivo existe:
ls -la .env

# Certifique-se que está na raiz do projeto:
pwd  # Deve estar em /home/andrey/barber-analytics-pro
```

### Problema: `npm run dev` não funciona

```bash
# Limpar cache:
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Depois tentar novamente:
npm run dev
```

---

## 📚 Recursos Úteis

### Documentação do Projeto

- **Arquitetura:** `docs/ARQUITETURA.md`
- **Database:** `docs/DATABASE_SCHEMA.md`
- **Setup Completo:** `docs/guides/SETUP.md`
- **Variáveis de Env:** `.env.example`

### Supabase

- **Dashboard:** https://app.supabase.com
- **Docs:** https://supabase.com/docs
- **CLI Guide:** https://supabase.com/docs/reference/cli/introduction

### PostgreSQL

- **psql docs:** https://www.postgresql.org/docs/current/app-psql.html
- **Connection strings:** `postgresql://user:password@host:port/database`

---

## ✅ Próximos Passos Após Setup

1. **Instalar PostgreSQL Client**

   ```bash
   sudo apt install -y postgresql-client
   ```

2. **Instalar Supabase CLI**

   ```bash
   npm install -g supabase
   ```

3. **Criar arquivo .env**

   ```bash
   cp .env.example .env
   nano .env  # Preencher credenciais
   ```

4. **Testar funcionamento**

   ```bash
   npm run lint
   npm run build
   npm run dev
   ```

5. **Conectar ao Supabase (opcional)**
   ```bash
   supabase link --project-ref seu-project-id
   supabase db pull  # Atualizar tipos do banco
   ```

---

## 🎓 Comandos Úteis Linux Pop-OS

```bash
# Verificar versão do SO
lsb_release -a

# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Listar portas em uso
sudo lsof -i :5173  # Vite dev server

# Matar processo na porta
sudo lsof -ti:5173 | xargs kill -9

# Ver uso de memória
free -h

# Verificar espaço em disco
df -h

# Ver arquivos ocultos
ls -la

# Adicionar permissão executável
chmod +x script.sh
```

---

## 📞 Resumo Executivo

**Estado:** Sistema 90% funcional ✅

**Falta apenas:**

1. ✋ PostgreSQL Client (2 min de instalação)
2. ✋ Supabase CLI (2 min de instalação)
3. ✋ Arquivo .env (5 min de configuração)

**Tempo total:** ~10 minutos para total funcionalidade

**Risco:** BAIXO - Apenas dependências de desenvolvedor

---

_Última atualização: 1º de novembro de 2025_
_Ambiente: Linux Pop-OS | Node v24.11.0 | npm 11.6.1_
