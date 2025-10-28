# Script para executar migration de professional_service_commissions
# Autor: Andrey Viana
# Data: 2025-10-27

Write-Host "🚀 Executando migration: professional_service_commissions..." -ForegroundColor Cyan

# Caminho do arquivo SQL
$sqlFile = ".\supabase\migrations\create_professional_service_commissions.sql"

# Verificar se o arquivo existe
if (-Not (Test-Path $sqlFile)) {
    Write-Host "❌ Arquivo SQL não encontrado: $sqlFile" -ForegroundColor Red
    exit 1
}

Write-Host "📄 Arquivo encontrado: $sqlFile" -ForegroundColor Green

# Executar migration via Supabase CLI (se disponível)
if (Get-Command supabase -ErrorAction SilentlyContinue) {
    Write-Host "🔧 Executando via Supabase CLI..." -ForegroundColor Yellow
    supabase db push
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Migration executada com sucesso via CLI!" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Erro ao executar via CLI. Tente executar manualmente no Supabase Dashboard." -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️ Supabase CLI não encontrado." -ForegroundColor Yellow
    Write-Host "" 
    Write-Host "📋 Instruções manuais:" -ForegroundColor Cyan
    Write-Host "1. Acesse: https://supabase.com/dashboard/project/YOUR_PROJECT/editor" -ForegroundColor White
    Write-Host "2. Vá em 'SQL Editor'" -ForegroundColor White
    Write-Host "3. Cole o conteúdo do arquivo: $sqlFile" -ForegroundColor White
    Write-Host "4. Execute a query" -ForegroundColor White
    Write-Host ""
    Write-Host "Ou copie e execute este comando:" -ForegroundColor Yellow
    Write-Host "Get-Content $sqlFile | Set-Clipboard" -ForegroundColor Gray
}

Write-Host ""
Write-Host "✨ Próximos passos após executar a migration:" -ForegroundColor Cyan
Write-Host "1. Recarregue a aplicação" -ForegroundColor White
Write-Host "2. Abra o modal de edição de profissional" -ForegroundColor White
Write-Host "3. Vá na aba 'Comissões por Serviço'" -ForegroundColor White
Write-Host "4. Edite e salve uma comissão" -ForegroundColor White
