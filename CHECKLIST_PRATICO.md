# ✅ CHECKLIST PRÁTICO - Setup Linux Pop-OS

## 🎯 Objetivo Final

Ter **Barber Analytics Pro** 100% funcional e pronto para desenvolvimento no Linux Pop-OS

---

## 📋 PRÉ-REQUISITOS (Antes de Começar)

- [ ] Você está conectado à internet
- [ ] Você tem acesso `sudo` (suas credenciais de admin)
- [ ] Você tem acesso às credenciais Supabase (usuário/senha do Dashboard)
- [ ] Terminal aberto e em `/home/andrey/barber-analytics-pro`
- [ ] VSCode ou editor aberto para .env

---

## ⚡ ETAPA 1: Preparação (2 minutos)

- [ ] Abra um terminal
- [ ] Navegue para a pasta do projeto:
  ```bash
  cd /home/andrey/barber-analytics-pro
  pwd  # Confirmar que está no local certo
  ```
- [ ] Verifique o espaço em disco:
  ```bash
  df -h  # Deve ter pelo menos 2GB livres
  ```
- [ ] Verifique conexão com internet:
  ```bash
  ping 8.8.8.8 -c 2
  ```

**Status:** ⏳ Aguardando... → ✅ Preparado

---

## 🔧 ETAPA 2: Instalar PostgreSQL Client (2 minutos)

### 2.1 Atualizar pacotes

- [ ] Execute:
  ```bash
  sudo apt update
  ```
- [ ] Deixe completar (pode levar 1-2 min)

### 2.2 Instalar PostgreSQL Client

- [ ] Execute:
  ```bash
  sudo apt install -y postgresql-client
  ```
- [ ] Confirme senha de root se solicitado

### 2.3 Validar instalação

- [ ] Execute:
  ```bash
  psql --version
  ```
- [ ] Deve exibir: `psql (PostgreSQL) 14.x` ou similar
- [ ] ✅ Se aparecer, instalação bem-sucedida!

**Troubleshooting:**

```bash
# Se der erro, tente:
sudo apt install -y postgresql-client postgresql-14
psql --version
```

**Status:** ✅ PostgreSQL Client Instalado

---

## 📦 ETAPA 3: Instalar Supabase CLI (2 minutos)

### 3.1 Instalar via npm global

- [ ] Execute:
  ```bash
  npm install -g supabase
  ```
- [ ] Aguarde completar (1-2 min)

### 3.2 Validar instalação

- [ ] Execute:
  ```bash
  supabase --version
  ```
- [ ] Deve exibir: `supabase-cli 1.x.x.x`
- [ ] ✅ Se aparecer, instalação bem-sucedida!

### 3.3 (Opcional) Configurar Supabase

- [ ] Execute:
  ```bash
  supabase --help  # Ver comandos disponíveis
  ```
- [ ] Se quiser conectar seu projeto:
  ```bash
  supabase link --project-ref seu-project-id
  supabase db pull  # Sincronizar tipos
  ```

**Troubleshooting:**

```bash
# Se der erro "command not found":
npm install -g supabase
# Ou adicionar ao PATH:
export PATH="$PATH:$(npm config get prefix)/bin"
source ~/.bashrc
```

**Status:** ✅ Supabase CLI Instalado

---

## 🔑 ETAPA 4: Criar e Configurar .env (5 minutos)

### 4.1 Criar arquivo .env

- [ ] No terminal, execute:
  ```bash
  cp .env.example .env
  ```
- [ ] Confirme:
  ```bash
  ls -la .env
  ```
- [ ] Deve exibir: `-rw-r--r-- ... .env`

### 4.2 Obter Credenciais Supabase

**NO NAVEGADOR:**

- [ ] Acesse: https://app.supabase.com
- [ ] Faça login com sua conta
- [ ] Selecione seu projeto "Barber Analytics Pro"
- [ ] Vá em **Settings** → **API** (menu esquerdo)
- [ ] Você verá:

```
Project URL:
  https://xyzabc123.supabase.co

Project API Keys:
  anon public:
    eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9....
```

- [ ] **Copie** `Project URL`
- [ ] **Copie** `anon public key`

### 4.3 Editar arquivo .env

**NO TERMINAL:**

- [ ] Execute:
  ```bash
  nano .env
  ```
- [ ] Localize estas linhas:

  ```
  VITE_SUPABASE_URL=https://seu-projeto.supabase.co
  VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  ```

- [ ] Altere para:
  ```
  VITE_SUPABASE_URL=https://xyzabc123.supabase.co
  VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9....
  ```
  (Cole seus valores do passo anterior)

### 4.4 Salvar arquivo

- [ ] Pressione: `Ctrl + X`
- [ ] Digite: `Y` (para confirmar)
- [ ] Pressione: `Enter` (para confirmar nome)
- [ ] Arquivo salvo! ✅

### 4.5 Validar

- [ ] Execute:
  ```bash
  cat .env | grep VITE_SUPABASE
  ```
- [ ] Deve exibir suas credenciais (linhas 3-4 apenas)

**Status:** ✅ .env Configurado

---

## 🧪 ETAPA 5: Validações (3 minutos)

### 5.1 Verificar Lint

- [ ] Execute:
  ```bash
  npm run lint
  ```
- [ ] Possíveis resultados:
  - ✅ Se disser "No files violated", perfeito!
  - ⚠️ Se disser "X warnings", ainda funciona
  - ❌ Se disser "X errors", verifique `.env`

### 5.2 Verificar Build

- [ ] Execute:
  ```bash
  npm run build
  ```
- [ ] Deve criar pasta `dist/` e exibir:
  ```
  ✓ built in XXms
  ```
- [ ] ✅ Se aparecer, build funciona!

### 5.3 Testar Dev Server

- [ ] Execute:
  ```bash
  npm run dev
  ```
- [ ] Deve exibir:
  ```
  VITE v7.1.9
  ➜  Local:   http://localhost:5173/
  ```

### 5.4 Acessar no Navegador

- [ ] Abra navegador
- [ ] Acesse: **http://localhost:5173**
- [ ] [ ] Deve carregar a aplicação Barber Analytics Pro
- [ ] [ ] Se vê tela de login → ✅ SUCESSO!

**Se der erro:**

```bash
# Apertar Ctrl+C no terminal para sair
# Depois tentar de novo:
npm cache clean --force
npm install
npm run dev
```

**Status:** ✅ Aplicação Funcionando

---

## 📊 ETAPA 6: Verificação Final (2 minutos)

Execute todos os comandos abaixo e anote os resultados:

```bash
# Verificar Node
node --version
# Deve exibir: v24.11.0 ✅

# Verificar npm
npm --version
# Deve exibir: 11.6.1 ✅

# Verificar PostgreSQL
psql --version
# Deve exibir: psql (PostgreSQL) 14.x ✅

# Verificar Supabase
supabase --version
# Deve exibir: supabase-cli 1.x.x ✅

# Verificar .env
cat .env | head -20
# Deve exibir suas credenciais ✅

# Verificar projeto
ls -la node_modules | wc -l
# Deve exibir: ~600+ (muitas pastas) ✅
```

**Checklist Final:**

- [ ] Node.js v24.11.0 ✅
- [ ] npm 11.6.1 ✅
- [ ] PostgreSQL Client ✅
- [ ] Supabase CLI ✅
- [ ] arquivo .env ✅
- [ ] npm run dev funciona ✅
- [ ] Browser acessa http://localhost:5173 ✅

**Status:** ✅ SISTEMA 100% FUNCIONAL

---

## 🎉 CONCLUSÃO

Se todos os itens acima foram marcados ✅, parabéns!

```
╔════════════════════════════════════════════════╗
║                                                ║
║   🎉 BARBER ANALYTICS PRO 100% OPERACIONAL   ║
║                                                ║
║   Seu ambiente Linux Pop-OS está              ║
║   completamente configurado e pronto          ║
║   para desenvolvimento!                       ║
║                                                ║
║   Próximo passo: npm run dev                  ║
║                                                ║
╚════════════════════════════════════════════════╝
```

---

## 📚 Próximas Leituras (em ordem)

1. **QUICK_START_LINUX.md** - Guia rápido de referência
2. **DIAGNOSTICO_AMBIENTE_LINUX.md** - Análise detalhada
3. **GUIA_TRANSICAO_WINDOWS_LINUX.md** - Referência de comandos
4. **docs/ARQUITETURA.md** - Arquitetura do projeto
5. **docs/DESIGN_SYSTEM.md** - Sistema de design

---

## 🆘 Problemas Comuns

| Problema                         | Solução                                                       |
| -------------------------------- | ------------------------------------------------------------- |
| `postgres: command not found`    | `sudo apt install -y postgresql-client`                       |
| `supabase: command not found`    | `npm install -g supabase`                                     |
| `.env não é lido`                | Verifique arquivo em `/home/andrey/barber-analytics-pro/.env` |
| `npm run dev` diz "porta em uso" | `sudo lsof -ti:5173 \| xargs kill -9`                         |
| `build fails`                    | `npm cache clean --force && npm install`                      |
| `lint errors`                    | Verificar credenciais .env                                    |
| `browser não carrega`            | Aguarde 5 segundos, depois recarregue                         |

---

## ⏱️ Timeline Total

```
T+00:00 - Abrir terminal
T+01:00 - PostgreSQL instalado
T+03:00 - Supabase CLI instalado
T+05:00 - .env configurado
T+06:00 - npm run build testado
T+07:00 - npm run dev rodando
T+08:00 - Browser acessando app
T+10:00 - ✅ SISTEMA COMPLETO!
```

**Total: ~10 minutos**

---

## 📞 Dúvidas?

Consulte:

- Este arquivo (você está aqui!)
- DIAGNOSTICO_AMBIENTE_LINUX.md
- VISUAL_SETUP_GUIDE.md
- docs/guides/SETUP.md

---

```
✅ Checklist criado: 1º de Novembro de 2025
🐧 Ambiente: Linux Pop-OS
📊 Status: PRONTO PARA USO
```
