---
title: 'Barber Analytics Pro - Deployment Guide'
author: 'Andrey Viana'
version: '2.0.0'
last_updated: '12/11/2025'
license: 'Proprietary - All Rights Reserved © 2025 Andrey Viana'
---

# 09 - Deployment Guide

Guia completo de deployment do Barber Analytics Pro no **VPS** com **Supabase** backend.

**IMPORTANTE:** O sistema migrou do Vercel para VPS próprio hospedado em **app.tratodebarbados.com**

---

## 📋 Índice

- [Pré-requisitos](#pré-requisitos)
- [VPS Deployment](#vps-deployment)
- [Environment Variables](#environment-variables)
- [Database Migrations](#database-migrations)
- [Monitoring & Alerts](#monitoring--alerts)
- [Rollback Strategy](#rollback-strategy)
- [Performance Optimization](#performance-optimization)

---

## 🔧 Pré-requisitos

### Software Necessário

| Ferramenta   | Versão Mínima | Propósito          |
| ------------ | ------------- | ------------------ |
| Node.js      | 20.x          | Runtime JavaScript |
| pnpm         | 8.x           | Package manager    |
| Git          | 2.x           | Controle de versão |
| PM2          | Latest        | Process manager    |
| Nginx        | Latest        | Reverse proxy      |
| Supabase CLI | Latest        | Migrations         |

### Requisitos do VPS

- ✅ **VPS Linux** (Ubuntu 20.04+ recomendado)
- ✅ **Acesso SSH** (root ou sudo)
- ✅ **Domínio configurado** (app.tratodebarbados.com)
- ✅ **Certificado SSL** (Let's Encrypt)
- ✅ **Supabase Account** (Pro Plan para produção)

---

## 🚀 VPS Deployment

**Referência Completa:** Ver [VPS_DEPLOYMENT.md](./VPS_DEPLOYMENT.md) para guia detalhado

### 1. Configuração Inicial do VPS

```bash
# SSH no VPS
ssh seu-usuario@app.tratodebarbados.com

# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependências
sudo apt install -y nodejs npm nginx git certbot python3-certbot-nginx

# Instalar Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar pnpm
npm install -g pnpm

# Instalar PM2
npm install -g pm2
```

### 2. Clonar Repositório

```bash
# Criar diretório do projeto
sudo mkdir -p /var/www/barber-analytics-pro
sudo chown $USER:$USER /var/www/barber-analytics-pro

# Clonar repositório
cd /var/www/barber-analytics-pro
git clone https://github.com/andviana23/barber-analytics-pro.git .

# Instalar dependências
pnpm install
```

### 3. Build do Frontend

```bash
# Build para produção
pnpm build

# Verificar dist/
ls -la dist/
```

### 4. Configurar Nginx

Ver configuração completa em [VPS_DEPLOYMENT.md](./VPS_DEPLOYMENT.md#3-configurar-nginx)

```nginx
# /etc/nginx/sites-available/tratodebarbados
server {
    listen 443 ssl http2;
    server_name app.tratodebarbados.com;

    ssl_certificate /etc/letsencrypt/live/app.tratodebarbados.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.tratodebarbados.com/privkey.pem;

    root /var/www/barber-analytics-pro/dist;
    index index.html;

    # API (Express)
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Frontend (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 5. Configurar PM2

```bash
# Criar ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'barber-api',
    script: './server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      API_PORT: 3001,
    }
  }]
};
EOF

# Iniciar aplicação
pm2 start ecosystem.config.js

# Salvar configuração
pm2 save

# Configurar auto-start
pm2 startup
```

### 6. SSL com Let's Encrypt

```bash
# Obter certificado SSL
sudo certbot --nginx -d app.tratodebarbados.com

# Testar renovação automática
sudo certbot renew --dry-run
```

---

## 🔐 Environment Variables

### Variáveis de Ambiente

#### 1. Supabase Configuration

```bash
# URL do projeto Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co

# Chave pública (anon key) - segura para expor no frontend
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Chave de serviço (service role) - NUNCA expor no frontend
# Usar APENAS em Edge Functions ou processos backend
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# URL da API (geralmente igual à SUPABASE_URL)
VITE_SUPABASE_API_URL=https://seu-projeto.supabase.co
```

#### 2. Sentry (Error Tracking)

```bash
# DSN do projeto Sentry
VITE_SENTRY_DSN=https://abc123@o123456.ingest.sentry.io/789012

# Environment identifier
VITE_SENTRY_ENVIRONMENT=production

# Release version (auto-preenchido pelo CI/CD)
VITE_SENTRY_RELEASE=barber-analytics-pro@1.0.0
```

#### 3. Cron Jobs & API

```bash
# Cron secret para autenticação
CRON_SECRET=sua_chave_secreta_aqui

# OpenAI para análises
OPENAI_API_KEY=sk-...

# Telegram para notificações
TELEGRAM_BOT_TOKEN=123456:ABC-...
TELEGRAM_CHAT_ID=123456789
```

#### 4. Feature Flags

```bash
# Habilitar/desabilitar features em produção
VITE_FEATURE_ASAAS_PAYMENTS=false
VITE_FEATURE_WHATSAPP_NOTIFICATIONS=true
VITE_FEATURE_CLIENT_SUBSCRIPTIONS=false
```

### Configurar no VPS

**Criar arquivo .env:**

```bash
# No VPS, criar arquivo .env
cd /var/www/barber-analytics-pro
nano .env
```

**Adicionar todas as variáveis:**

```bash
# Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_publica
SUPABASE_SERVICE_ROLE_KEY=sua_chave_servico

# Cron Jobs
CRON_SECRET=sua_chave_secreta

# OpenAI
OPENAI_API_KEY=sk-...

# Telegram
TELEGRAM_BOT_TOKEN=123456:ABC-...
TELEGRAM_CHAT_ID=123456789

# Node
NODE_ENV=production
API_PORT=3001
```

**Proteger arquivo .env:**

```bash
# Alterar permissões (somente leitura para owner)
chmod 600 .env

# Verificar
ls -la .env
```

### Arquivo .env.example

**Arquivo:** `.env.example`

```bash
# Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_publica_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_chave_servico_aqui

# Sentry
VITE_SENTRY_DSN=https://sua_dsn_aqui
VITE_SENTRY_ENVIRONMENT=development

# Feature Flags
VITE_FEATURE_ASAAS_PAYMENTS=false
VITE_FEATURE_WHATSAPP_NOTIFICATIONS=false
VITE_FEATURE_CLIENT_SUBSCRIPTIONS=false

# Analytics (opcional)
VITE_GA_MEASUREMENT_ID=
```

---

## 🗄️ Database Migrations

### 1. Estrutura de Migrations

```
supabase/
├── migrations/
│   ├── 20250101000000_initial_schema.sql
│   ├── 20250115000000_add_categories_table.sql
│   ├── 20250201000000_add_dre_functions.sql
│   ├── 20250215000000_add_lista_da_vez.sql
│   └── 20250301000000_add_rls_policies.sql
├── seed.sql
└── config.toml
```

### 2. Criar Nova Migration

```bash
# Conectar ao projeto Supabase
supabase login

# Link ao projeto remoto
supabase link --project-ref seu-projeto-id

# Criar nova migration
supabase migration new add_payment_methods_table

# Editar arquivo criado em supabase/migrations/
```

**Exemplo de Migration:**

```sql
-- Migration: 20250307000000_add_payment_methods_table.sql

BEGIN;

-- Criar tabela payment_methods
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  fee DECIMAL(5,2) DEFAULT 0 CHECK (fee >= 0 AND fee <= 100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Adicionar RLS
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Policy: Todos podem visualizar
CREATE POLICY "payment_methods_select"
  ON payment_methods FOR SELECT
  USING (true);

-- Policy: Apenas admin/gerente podem inserir
CREATE POLICY "payment_methods_insert"
  ON payment_methods FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM professionals
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'gerente')
    )
  );

-- Criar índice
CREATE INDEX idx_payment_methods_active
  ON payment_methods(is_active)
  WHERE is_active = true;

-- Trigger updated_at
CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_updated_at();

COMMIT;
```

### 3. Aplicar Migrations

```bash
# Testar localmente
supabase db reset

# Aplicar em produção
supabase db push

# Verificar status
supabase migration list

# Reverter última migration (usar com cuidado!)
supabase migration down
```

### 4. Backup antes de Migration

```bash
# Backup manual via Supabase Dashboard
# Settings > Database > Create backup

# Via CLI
supabase db dump -f backup-$(date +%Y%m%d-%H%M%S).sql

# Restaurar backup
supabase db reset --db-url "postgresql://..."
```

---

## 🔄 Deploy Contínuo

### Script de Deploy Automático

**Criar script deploy.sh no VPS:**

```bash
#!/bin/bash
# deploy.sh - Script de deploy automático

set -e

echo "🚀 Iniciando deploy..."

# 1. Git pull
echo "📥 Baixando código..."
git pull origin main

# 2. Instalar dependências
echo "📦 Instalando dependências..."
pnpm install --frozen-lockfile

# 3. Build frontend
echo "🏗️ Buildando frontend..."
pnpm build

# 4. Reload API
echo "🔄 Recarregando API..."
pm2 reload barber-api

echo "✅ Deploy concluído!"
```

**Tornar executável:**

```bash
chmod +x deploy.sh
```

### Deploy Manual

```bash
# SSH no VPS
ssh seu-usuario@app.tratodebarbados.com

# Ir para pasta do projeto
cd /var/www/barber-analytics-pro

# Executar deploy
./deploy.sh
```

---

## 📊 Monitoring & Alerts

### 1. PM2 Monitoring

**Monitorar processos:**

```bash
# Status dos processos
pm2 status

# Monit em tempo real
pm2 monit

# Logs
pm2 logs barber-api

# Últimas 100 linhas
pm2 logs barber-api --lines 100
```

**Métricas Disponíveis:**

- ✅ CPU Usage
- ✅ Memory Usage
- ✅ Restarts
- ✅ Uptime
- ✅ Logs em tempo real

### 2. Nginx Logs

**Visualizar logs:**

```bash
# Access logs
tail -f /var/log/nginx/barber-analytics-access.log

# Error logs
tail -f /var/log/nginx/barber-analytics-error.log

# Filtrar por status 500
grep "500" /var/log/nginx/barber-analytics-access.log
```

### 3. Sentry Error Tracking

**Configuração:**

```javascript
// src/lib/sentry.js
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_SENTRY_ENVIRONMENT,
  release: import.meta.env.VITE_SENTRY_RELEASE,
  integrations: [
    new BrowserTracing({
      tracingOrigins: ['localhost', /^\//],
    }),
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  tracesSampleRate: 1.0, // 100% em desenvolvimento
  replaysSessionSampleRate: 0.1, // 10% das sessões
  replaysOnErrorSampleRate: 1.0, // 100% quando há erro
  beforeSend(event, hint) {
    // Filtrar erros conhecidos
    if (event.exception) {
      const error = hint.originalException;
      if (error?.message?.includes('ResizeObserver')) {
        return null; // Ignorar erro conhecido do navegador
      }
    }
    return event;
  },
});
```

### 4. Supabase Monitoring

**Via Dashboard:**

- Database Health: https://app.supabase.com/project/seu-projeto/settings/database
- API Logs: https://app.supabase.com/project/seu-projeto/logs/edge-logs
- Auth Logs: https://app.supabase.com/project/seu-projeto/logs/auth-logs

**Alertas via SQL:**

```sql
-- Query para identificar slow queries
SELECT
  query,
  calls,
  total_time / calls as avg_time_ms,
  total_time,
  rows
FROM pg_stat_statements
WHERE total_time / calls > 1000 -- > 1 segundo
ORDER BY total_time DESC
LIMIT 10;
```

### 5. Uptime Monitoring

**UptimeRobot (Recomendado):**

1. Criar monitor HTTP(s)
2. URL: `https://app.tratodebarbados.com/health`
3. Intervalo: 5 minutos
4. Alertas via: Email, SMS, Telegram

**Testar Health Check:**

```bash
curl https://app.tratodebarbados.com/health
```

---

## ⚠️ Rollback Strategy

### 1. Rollback via Git

**Voltar para commit anterior:**

```bash
# SSH no VPS
ssh seu-usuario@app.tratodebarbados.com
cd /var/www/barber-analytics-pro

# Ver histórico de commits
git log --oneline -10

# Voltar para commit específico
git reset --hard <commit-hash>

# Rebuild
pnpm install
pnpm build

# Reload API
pm2 reload barber-api

# Reload Nginx
sudo systemctl reload nginx
```

### 2. Rollback com Backup

**Criar backup antes de deploy:**

```bash
# Criar backup do dist/
tar -czf backup-$(date +%Y%m%d-%H%M%S).tar.gz dist/

# Listar backups
ls -lh backup-*.tar.gz
```

**Restaurar backup:**

```bash
# Extrair backup
tar -xzf backup-20251112-120000.tar.gz

# Reload Nginx
sudo systemctl reload nginx
```

### 3. Rollback de Database

**⚠️ CUIDADO: Operação destrutiva**

```bash
# 1. Backup atual
supabase db dump -f backup-before-rollback.sql

# 2. Reverter migration
supabase migration down

# 3. Se necessário, restaurar backup
psql $DATABASE_URL < backup-snapshot.sql
```

### 4. Plano de Contingência

**Checklist de Rollback:**

- [ ] Notificar equipe
- [ ] Verificar se há dados críticos em risco
- [ ] Executar backup do banco antes de qualquer ação
- [ ] Fazer rollback via git ou backup
- [ ] Se necessário, reverter migrations
- [ ] Testar aplicação após rollback
- [ ] Comunicar stakeholders
- [ ] Post-mortem: documentar causa e solução

---

## ⚡ Performance Optimization

### 1. Build Optimization

```javascript
// vite.config.js
export default defineConfig({
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs em produção
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'query-vendor': ['@tanstack/react-query'],
          'chart-vendor': ['recharts'],
        },
      },
    },
  },
});
```

### 2. Image Optimization

```javascript
// Usar Next Image ou otimizar manualmente
import { useState, useEffect } from 'react';

function OptimizedImage({ src, alt, ...props }) {
  const [imageSrc, setImageSrc] = useState('/placeholder.png');

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => setImageSrc(src);
  }, [src]);

  return <img src={imageSrc} alt={alt} {...props} loading="lazy" />;
}
```

### 3. Code Splitting

```javascript
// Lazy load de páginas
import { lazy, Suspense } from 'react';

const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const RelatoriosPage = lazy(() => import('@/pages/RelatoriosPage'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/relatorios" element={<RelatoriosPage />} />
      </Routes>
    </Suspense>
  );
}
```

### 4. Cache Strategy

```javascript
// TanStack Query configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
```

### 5. Nginx Cache Headers

**Configuração já incluída no nginx.conf:**

```nginx
# Cache de assets estáticos
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

---

## 📝 Deployment Checklist

### Pre-Deployment

- [ ] Todos os testes passando (`pnpm test`)
- [ ] Linter sem erros (`pnpm lint`)
- [ ] Build local funcionando (`pnpm build && pnpm preview`)
- [ ] Variáveis de ambiente configuradas
- [ ] Migrations testadas localmente
- [ ] Changelog atualizado
- [ ] Code review aprovado

### During Deployment

- [ ] Git pull executado
- [ ] Dependências instaladas
- [ ] Build concluído sem erros
- [ ] Migrations aplicadas com sucesso
- [ ] PM2 reload bem-sucedido
- [ ] Nginx reload bem-sucedido

### Post-Deployment

- [ ] Validar URL de produção (app.tratodebarbados.com)
- [ ] Testar fluxos críticos manualmente
- [ ] Verificar Sentry (sem erros novos)
- [ ] Verificar PM2 status
- [ ] Monitorar logs por 30 minutos
- [ ] Verificar cron jobs funcionando
- [ ] Notificar stakeholders

---

## 🔗 Navegação

- [← 08 - Testing Strategy](./08_TESTING_STRATEGY.md)
- [→ 10 - Project Management](./10_PROJECT_MANAGEMENT.md)
- [📚 Documentação](./DOCUMENTACAO_INDEX.md)

---

## 📖 Referências

1. **PM2 Documentation**. https://pm2.keymetrics.io/
2. **Nginx Documentation**. https://nginx.org/en/docs/
3. **Supabase CLI Reference**. https://supabase.com/docs/reference/cli
4. **Node.js Best Practices**. https://github.com/goldbergyoni/nodebestpractices
5. **VPS_DEPLOYMENT.md**. Guia detalhado de deploy no VPS

---

**Última atualização:** 12 de novembro de 2025
**Versão:** 2.0.0 (Migrado para VPS)
**Autor:** Andrey Viana
