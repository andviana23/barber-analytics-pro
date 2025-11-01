# ⚡ Quick Start - Linux Pop-OS

## 🎯 Resumo (5 minutos)

Você está migrando do Windows para Linux Pop-OS. O projeto está **90% pronto**, faltam apenas 3 coisas simples:

### ❌ O que falta:

1. **PostgreSQL Client** (2 min)
2. **Supabase CLI** (2 min)
3. **Arquivo .env** (1 min)

---

## ✅ Solução Rápida (Copie e Cole)

### Opção 1: Script Automático (RECOMENDADO)

```bash
cd /home/andrey/barber-analytics-pro
chmod +x setup-linux.sh
./setup-linux.sh
```

**Isso vai:**

- ✅ Instalar PostgreSQL Client
- ✅ Instalar Supabase CLI
- ✅ Criar arquivo .env
- ✅ Verificar tudo está funcionando

### Opção 2: Manual (linha por linha)

```bash
# 1. Instalar PostgreSQL Client
sudo apt update
sudo apt install -y postgresql-client

# 2. Instalar Supabase CLI
npm install -g supabase

# 3. Criar arquivo .env
cd /home/andrey/barber-analytics-pro
cp .env.example .env
nano .env  # Editar com suas credenciais

# 4. Testar
npm run dev
```

---

## 🔑 Configurar .env

Após criar o arquivo, abra em um editor:

```bash
nano .env
```

**Encontre seus valores no Supabase Dashboard:**

1. Vá para: https://app.supabase.com
2. Selecione seu projeto
3. **Settings → API**
4. Copie `Project URL` para `VITE_SUPABASE_URL`
5. Copie `anon public` key para `VITE_SUPABASE_ANON_KEY`

**Exemplo completo:**

```env
VITE_SUPABASE_URL=https://abcd1234.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2Fic...
```

---

## 🚀 Iniciar Desenvolvimento

```bash
cd /home/andrey/barber-analytics-pro
npm run dev
```

Acesse: **http://localhost:5173**

---

## ✨ Status Atual

| Componente            | Status      |
| --------------------- | ----------- |
| Node.js v24.11.0      | ✅ OK       |
| npm 11.6.1            | ✅ OK       |
| node_modules          | ✅ OK       |
| Vite 7.1.9            | ✅ OK       |
| React 19.2.0          | ✅ OK       |
| Git 2.34.1            | ✅ OK       |
| **PostgreSQL Client** | ❌ INSTALAR |
| **Supabase CLI**      | ❌ INSTALAR |
| **.env**              | ❌ CRIAR    |

---

## 🐛 Troubleshooting

### "psql: command not found"

```bash
sudo apt install -y postgresql-client
psql --version
```

### "supabase: command not found"

```bash
npm install -g supabase
supabase --version
```

### "npm run dev não funciona"

```bash
# Limpar e reinstalar
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Porta 5173 já está em uso

```bash
# Matar processo
sudo lsof -ti:5173 | xargs kill -9
# Depois:
npm run dev
```

---

## 📞 Resumo

**Antes:** Windows com PowerShell  
**Agora:** Linux Pop-OS com bash

**Mudou:**

- ✅ Todos os scripts Node funcionam igual
- ✅ npm install / npm run funcionam igual
- ✅ Git funciona igual
- ✅ Supabase CLI é nativa no Linux

**O que fazer agora:**

1. Execute: `./setup-linux.sh` (ou rode manualmente)
2. Configure: `.env` com suas credenciais
3. Inicie: `npm run dev`
4. Acesse: http://localhost:5173

**Pronto!** Sistema 100% funcional 🎉

---

_Para mais detalhes, leia: DIAGNOSTICO_AMBIENTE_LINUX.md_
