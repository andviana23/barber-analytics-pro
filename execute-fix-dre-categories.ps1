# =====================================================
# Script: Execute DRE Category Mapping Fix
# Description: Executa a migration para corrigir mapeamento de categorias no DRE
# Author: Barber Analytics Pro Team
# Date: 2025-10-30
# =====================================================

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host " FIX DRE - Category Mapping" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📊 Esta migration vai:" -ForegroundColor Yellow
Write-Host "  1. Ajustar a função fn_calculate_dre_dynamic" -ForegroundColor White
Write-Host "  2. Aceitar categorias 'ADMINISTRATIVAS' E 'Despesas Fixas'" -ForegroundColor White
Write-Host "  3. Aceitar categorias 'OPERACIONAIS' E 'Despesas Operacionais'" -ForegroundColor White
Write-Host "  4. Corrigir divisão de despesas no DRE" -ForegroundColor White
Write-Host ""

# Ler arquivo SQL
$sqlFile = Join-Path $PSScriptRoot "supabase\migrations\20251030_fix_dre_category_mapping.sql"

if (-Not (Test-Path $sqlFile)) {
    Write-Host "❌ Arquivo SQL não encontrado: $sqlFile" -ForegroundColor Red
    exit 1
}

Write-Host "📄 Lendo migration: $sqlFile" -ForegroundColor Cyan
$sql = Get-Content $sqlFile -Raw

# Supabase connection string
$SUPABASE_DB_URL = $env:SUPABASE_DB_URL

if (-Not $SUPABASE_DB_URL) {
    Write-Host "❌ Variável de ambiente SUPABASE_DB_URL não encontrada!" -ForegroundColor Red
    Write-Host "💡 Configure com: `$env:SUPABASE_DB_URL = 'postgresql://...'" -ForegroundColor Yellow
    exit 1
}

Write-Host "🔌 Conectando ao Supabase..." -ForegroundColor Cyan

# Executar SQL via psql (requer PostgreSQL client instalado)
try {
    $sql | psql $SUPABASE_DB_URL
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "=============================================" -ForegroundColor Green
        Write-Host " ✅ Migration executada com sucesso!" -ForegroundColor Green
        Write-Host "=============================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "🎉 Agora o DRE vai reconhecer corretamente:" -ForegroundColor Yellow
        Write-Host "   - Despesas Operacionais = Custos Operacionais" -ForegroundColor White
        Write-Host "   - Despesas Fixas = Despesas Administrativas" -ForegroundColor White
        Write-Host "   - IMPOSTO / Impostos (Tributos) = Impostos" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "❌ Erro ao executar migration!" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "❌ Erro: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Certifique-se de ter o PostgreSQL client (psql) instalado" -ForegroundColor Yellow
    Write-Host "   Download: https://www.postgresql.org/download/windows/" -ForegroundColor Cyan
    exit 1
}
