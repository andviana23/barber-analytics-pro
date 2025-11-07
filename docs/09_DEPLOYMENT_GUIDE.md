---
title: 'Barber Analytics Pro - Deployment Guide'
author: 'Andrey Viana'
version: '1.0.0'
last_updated: '07/11/2025'
license: 'Proprietary - All Rights Reserved © 2025 Andrey Viana'
---

# 09 - Deployment Guide

Guia completo de deployment do Barber Analytics Pro na **Vercel** com **Supabase** backend.

---

## 📋 Índice

- [Pré-requisitos](#pré-requisitos)
- [Vercel Deployment](#vercel-deployment)
- [Environment Variables](#environment-variables)
- [Database Migrations](#database-migrations)
- [CI/CD Pipeline](#cicd-pipeline)
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
| Vercel CLI   | Latest        | Deploy local       |
| Supabase CLI | Latest        | Migrations         |

### Contas Necessárias

- ✅ **GitHub Account** (repositório privado)
- ✅ **Vercel Account** (Pro Plan recomendado)
- ✅ **Supabase Account** (Pro Plan para produção)
- ✅ **Sentry Account** (para error tracking)

---

## 🚀 Vercel Deployment

### 1. Preparação do Repositório

```bash
# Garantir que o código está no GitHub
git remote -v
# origin  git@github.com:andviana23/barber-analytics-pro.git (fetch)
# origin  git@github.com:andviana23/barber-analytics-pro.git (push)

# Criar branch de produção
git checkout -b production
git push origin production
```

### 2. Conectar Vercel ao GitHub

**Via Vercel Dashboard:**

1. Acesse https://vercel.com/new
2. Clique em **"Import Git Repository"**
3. Selecione `andviana23/barber-analytics-pro`
4. Configure o projeto:

```yaml
Framework Preset: Vite
Build Command: pnpm build
Output Directory: dist
Install Command: pnpm install --frozen-lockfile
Node.js Version: 20.x
```

### 3. Configuração do vercel.json

**Arquivo:** `vercel.json`

```json
{
  "version": 2,
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install --frozen-lockfile",
  "framework": "vite",
  "outputDirectory": "dist",
  "regions": ["gru1"],
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        }
      ]
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### 4. Build Configuration

**Arquivo:** `vite.config.js`

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor splitting para cache otimizado
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'query-vendor': ['@tanstack/react-query'],
          'supabase-vendor': ['@supabase/supabase-js'],
          'chart-vendor': ['recharts'],
          'form-vendor': ['react-hook-form', 'zod'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 5173,
    host: true,
  },
});
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

#### 3. Analytics & Monitoring

```bash
# Vercel Analytics (incluído automaticamente)
VITE_VERCEL_ANALYTICS_ID=auto

# Google Analytics (opcional)
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

#### 4. Feature Flags

```bash
# Habilitar/desabilitar features em produção
VITE_FEATURE_ASAAS_PAYMENTS=false
VITE_FEATURE_WHATSAPP_NOTIFICATIONS=true
VITE_FEATURE_CLIENT_SUBSCRIPTIONS=false
```

### Configurar no Vercel

**Via Dashboard:**

1. Acesse: `https://vercel.com/andviana23/barber-analytics-pro/settings/environment-variables`
2. Adicione cada variável:
   - **Key:** Nome da variável
   - **Value:** Valor secreto
   - **Environments:** Production, Preview, Development

**Via CLI:**

```bash
# Instalar Vercel CLI
pnpm add -g vercel

# Login
vercel login

# Adicionar variável
vercel env add VITE_SUPABASE_URL production
# Cole o valor quando solicitado

# Listar variáveis
vercel env ls

# Remover variável
vercel env rm VITE_SUPABASE_URL production
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

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

**Arquivo:** `.github/workflows/deploy.yml`

```yaml
name: Deploy to Production

on:
  push:
    branches:
      - production
  pull_request:
    branches:
      - production

env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

jobs:
  test:
    name: Run Tests
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run linter
        run: pnpm lint

      - name: Run unit tests
        run: pnpm test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          fail_ci_if_error: true

  deploy-preview:
    name: Deploy Preview
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    needs: test
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Install Vercel CLI
        run: npm install --global vercel@latest

      - name: Pull Vercel Environment
        run: vercel pull --yes --environment=preview --token=${{ secrets.VERCEL_TOKEN }}

      - name: Build Project
        run: vercel build --token=${{ secrets.VERCEL_TOKEN }}

      - name: Deploy to Vercel
        id: deploy
        run: |
          url=$(vercel deploy --prebuilt --token=${{ secrets.VERCEL_TOKEN }})
          echo "url=$url" >> $GITHUB_OUTPUT

      - name: Comment PR with Preview URL
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `✅ Preview deployed to: ${{ steps.deploy.outputs.url }}`
            })

  deploy-production:
    name: Deploy Production
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/production'
    needs: test
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Install Vercel CLI
        run: npm install --global vercel@latest

      - name: Pull Vercel Environment
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}

      - name: Build Project
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}

      - name: Deploy to Vercel
        id: deploy
        run: |
          url=$(vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }})
          echo "url=$url" >> $GITHUB_OUTPUT

      - name: Create Sentry Release
        uses: getsentry/action-release@v1
        env:
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
          SENTRY_ORG: ${{ secrets.SENTRY_ORG }}
          SENTRY_PROJECT: barber-analytics-pro
        with:
          environment: production
          version: ${{ github.sha }}

      - name: Notify Success
        run: |
          echo "✅ Deployed to: ${{ steps.deploy.outputs.url }}"

  database-migrations:
    name: Run Database Migrations
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/production'
    needs: deploy-production
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Link to Supabase Project
        run: supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

      - name: Run Migrations
        run: supabase db push
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

### Secrets Necessários

Adicionar no GitHub: `Settings > Secrets and variables > Actions`

```bash
VERCEL_TOKEN              # Token da Vercel
VERCEL_ORG_ID             # ID da organização Vercel
VERCEL_PROJECT_ID         # ID do projeto Vercel
SUPABASE_ACCESS_TOKEN     # Token de acesso Supabase
SUPABASE_PROJECT_REF      # Referência do projeto Supabase
SENTRY_AUTH_TOKEN         # Token Sentry
SENTRY_ORG                # Organização Sentry
```

---

## 📊 Monitoring & Alerts

### 1. Vercel Analytics

**Ativação:**

```javascript
// src/main.jsx
import { inject } from '@vercel/analytics';

inject(); // Adicionar antes do ReactDOM.render
```

**Métricas Disponíveis:**

- ✅ Page Views
- ✅ Unique Visitors
- ✅ Top Pages
- ✅ Traffic Sources
- ✅ Device Types

### 2. Sentry Error Tracking

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

### 3. Supabase Monitoring

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

### 4. Uptime Monitoring

**UptimeRobot (Recomendado):**

1. Criar monitor HTTP(s)
2. URL: `https://barber-analytics-pro.vercel.app/api/health`
3. Intervalo: 5 minutos
4. Alertas via: Email, SMS, Slack

**Endpoint de Health Check:**

```javascript
// src/pages/api/health.js
export default function handler(req, res) {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.VITE_SENTRY_RELEASE || '1.0.0',
    uptime: process.uptime(),
  });
}
```

---

## ⚠️ Rollback Strategy

### 1. Rollback via Vercel Dashboard

**Passos:**

1. Acesse: `https://vercel.com/andviana23/barber-analytics-pro/deployments`
2. Encontre deployment anterior estável
3. Clique em **"..."** → **"Promote to Production"**
4. Confirme o rollback

**Tempo estimado:** ~30 segundos

### 2. Rollback via CLI

```bash
# Listar deployments
vercel ls barber-analytics-pro

# Promover deployment específico
vercel promote <deployment-url> --scope=andviana23

# Exemplo:
vercel promote barber-analytics-pro-abc123.vercel.app --scope=andviana23
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

- [ ] Notificar equipe no Slack/Discord
- [ ] Verificar se há dados críticos em risco
- [ ] Executar backup do banco antes de qualquer ação
- [ ] Fazer rollback do frontend via Vercel
- [ ] Se necessário, reverter migrations
- [ ] Validar rollback em ambiente de preview
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

### 5. CDN Headers

```json
// vercel.json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
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

- [ ] CI/CD pipeline executando
- [ ] Testes automatizados passando
- [ ] Deploy preview validado
- [ ] Migrations aplicadas com sucesso
- [ ] Health check retornando 200

### Post-Deployment

- [ ] Validar URL de produção
- [ ] Testar fluxos críticos manualmente
- [ ] Verificar Sentry (sem erros novos)
- [ ] Verificar Vercel Analytics
- [ ] Monitorar logs por 30 minutos
- [ ] Notificar stakeholders

---

## 🔗 Navegação

- [← 08 - Testing Strategy](./08_TESTING_STRATEGY.md)
- [→ 10 - Project Management](./10_PROJECT_MANAGEMENT.md)
- [📚 Summary](./SUMMARY.md)

---

## 📖 Referências

1. **Vercel Documentation**. https://vercel.com/docs
2. **Supabase CLI Reference**. https://supabase.com/docs/reference/cli
3. **GitHub Actions**. https://docs.github.com/actions

---

**Última atualização:** 7 de novembro de 2025
**Versão:** 1.0.0
**Autor:** Andrey Viana
