# 🧪 Script de Execução de Testes - Barber Analytics Pro
# Autor: Andrey Viana
# Data: 28/10/2025

Write-Host "=" -NoNewline; for ($i=1; $i -le 70; $i++) { Write-Host "=" -NoNewline }; Write-Host ""
Write-Host "🧪 BARBER ANALYTICS PRO - SUITE DE TESTES" -ForegroundColor Cyan
Write-Host "=" -NoNewline; for ($i=1; $i -le 70; $i++) { Write-Host "=" -NoNewline }; Write-Host ""
Write-Host ""

# Verificar se node_modules existe
if (-Not (Test-Path "node_modules")) {
    Write-Host "⚠️  node_modules não encontrado. Instalando dependências..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

# Menu de opções
Write-Host "Selecione o tipo de teste a executar:" -ForegroundColor Green
Write-Host ""
Write-Host "  [1] 🔬 Testes Unitários (Vitest)"
Write-Host "  [2] 🔗 Testes de Integração (Vitest)"
Write-Host "  [3] 🎭 Testes E2E (Playwright)"
Write-Host "  [4] 🌐 Testes de Acessibilidade (Playwright + axe-core)"
Write-Host "  [5] 🚀 Testes de Performance (k6)"
Write-Host "  [6] 📊 Todos os Testes (Completo)"
Write-Host "  [7] 📈 Relatório de Cobertura"
Write-Host "  [0] ❌ Sair"
Write-Host ""

$choice = Read-Host "Digite o número da opção"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "🔬 Executando Testes Unitários..." -ForegroundColor Cyan
        Write-Host ""
        npm run test:unit
    }
    "2" {
        Write-Host ""
        Write-Host "🔗 Executando Testes de Integração..." -ForegroundColor Cyan
        Write-Host ""
        Write-Host "⚠️  IMPORTANTE: Certifique-se de que o .env está configurado com banco de TESTE" -ForegroundColor Yellow
        $confirm = Read-Host "Deseja continuar? (s/n)"
        if ($confirm -eq "s" -or $confirm -eq "S") {
            npm run test:integration
        } else {
            Write-Host "❌ Testes cancelados." -ForegroundColor Red
        }
    }
    "3" {
        Write-Host ""
        Write-Host "🎭 Executando Testes E2E..." -ForegroundColor Cyan
        Write-Host ""
        Write-Host "⚠️  IMPORTANTE: Servidor deve estar rodando em http://localhost:5173" -ForegroundColor Yellow
        $confirm = Read-Host "Servidor está rodando? (s/n)"
        if ($confirm -eq "s" -or $confirm -eq "S") {
            npx playwright test e2e/orders.spec.ts --headed
        } else {
            Write-Host "❌ Inicie o servidor com 'npm run dev' e tente novamente." -ForegroundColor Red
        }
    }
    "4" {
        Write-Host ""
        Write-Host "🌐 Executando Testes de Acessibilidade..." -ForegroundColor Cyan
        Write-Host ""
        Write-Host "⚠️  IMPORTANTE: Servidor deve estar rodando em http://localhost:5173" -ForegroundColor Yellow
        $confirm = Read-Host "Servidor está rodando? (s/n)"
        if ($confirm -eq "s" -or $confirm -eq "S") {
            npx playwright test tests/accessibility/a11y-audit.spec.ts --headed
            Write-Host ""
            Write-Host "📄 Relatório de acessibilidade salvo em: playwright-artifacts/accessibility-report.json" -ForegroundColor Green
        } else {
            Write-Host "❌ Inicie o servidor com 'npm run dev' e tente novamente." -ForegroundColor Red
        }
    }
    "5" {
        Write-Host ""
        Write-Host "🚀 Executando Testes de Performance (k6)..." -ForegroundColor Cyan
        Write-Host ""
        
        # Verificar se k6 está instalado
        $k6Installed = Get-Command k6 -ErrorAction SilentlyContinue
        if (-Not $k6Installed) {
            Write-Host "❌ k6 não está instalado." -ForegroundColor Red
            Write-Host ""
            Write-Host "Para instalar k6:" -ForegroundColor Yellow
            Write-Host "  Windows (Chocolatey): choco install k6"
            Write-Host "  Windows (Scoop): scoop install k6"
            Write-Host "  Ou baixe em: https://k6.io/docs/get-started/installation/"
        } else {
            Write-Host "⚠️  IMPORTANTE: Configure as variáveis de ambiente:" -ForegroundColor Yellow
            Write-Host "  - SUPABASE_URL" -ForegroundColor Yellow
            Write-Host "  - SUPABASE_ANON_KEY" -ForegroundColor Yellow
            Write-Host ""
            $confirm = Read-Host "Variáveis configuradas? (s/n)"
            if ($confirm -eq "s" -or $confirm -eq "S") {
                k6 run tests/performance/orders-load-test.js
            } else {
                Write-Host "❌ Configure as variáveis e tente novamente." -ForegroundColor Red
            }
        }
    }
    "6" {
        Write-Host ""
        Write-Host "📊 Executando TODOS os Testes..." -ForegroundColor Cyan
        Write-Host ""
        
        # 1. Testes Unitários
        Write-Host "1️⃣  Testes Unitários..." -ForegroundColor Magenta
        npm run test:unit
        
        # 2. Testes de Integração
        Write-Host ""
        Write-Host "2️⃣  Testes de Integração..." -ForegroundColor Magenta
        npm run test:integration
        
        # 3. Testes E2E
        Write-Host ""
        Write-Host "3️⃣  Testes E2E..." -ForegroundColor Magenta
        Write-Host "⚠️  Certifique-se de que o servidor está rodando!" -ForegroundColor Yellow
        Start-Sleep -Seconds 2
        npx playwright test e2e/orders.spec.ts
        
        # 4. Testes de Acessibilidade
        Write-Host ""
        Write-Host "4️⃣  Testes de Acessibilidade..." -ForegroundColor Magenta
        npx playwright test tests/accessibility/a11y-audit.spec.ts
        
        Write-Host ""
        Write-Host "=" -NoNewline; for ($i=1; $i -le 70; $i++) { Write-Host "=" -NoNewline }; Write-Host ""
        Write-Host "✅ TODOS OS TESTES CONCLUÍDOS!" -ForegroundColor Green
        Write-Host "=" -NoNewline; for ($i=1; $i -le 70; $i++) { Write-Host "=" -NoNewline }; Write-Host ""
    }
    "7" {
        Write-Host ""
        Write-Host "📈 Gerando Relatório de Cobertura..." -ForegroundColor Cyan
        Write-Host ""
        npm run test:coverage
        
        Write-Host ""
        Write-Host "📄 Relatório HTML disponível em: coverage/index.html" -ForegroundColor Green
        
        # Abrir relatório no navegador
        $openBrowser = Read-Host "Abrir relatório no navegador? (s/n)"
        if ($openBrowser -eq "s" -or $openBrowser -eq "S") {
            Start-Process "coverage/index.html"
        }
    }
    "0" {
        Write-Host ""
        Write-Host "👋 Saindo..." -ForegroundColor Yellow
    }
    default {
        Write-Host ""
        Write-Host "❌ Opção inválida!" -ForegroundColor Red
    }
}

Write-Host ""
