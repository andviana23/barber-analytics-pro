# =====================================================
# SCRIPT PARA EXECUTAR MIGRATION DA LISTA DA VEZ
# =====================================================
# Este script executa a migration SQL para criar
# as tabelas e funções do módulo Lista da Vez
# =====================================================

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  MIGRATION: LISTA DA VEZ" -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se o arquivo de migration existe
$migrationFile = "supabase\migrations\create_lista_da_vez_tables.sql"

if (-not (Test-Path $migrationFile)) {
    Write-Host "❌ ERRO: Arquivo de migration não encontrado!" -ForegroundColor Red
    Write-Host "   Procurando por: $migrationFile" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Arquivo de migration encontrado" -ForegroundColor Green
Write-Host ""

# Ler credenciais do Supabase
Write-Host "📋 Configure suas credenciais do Supabase:" -ForegroundColor Cyan
Write-Host ""

$supabaseUrl = Read-Host "SUPABASE_URL (ex: https://xxx.supabase.co)"
$supabaseKey = Read-Host "SUPABASE_SERVICE_ROLE_KEY (Service Role Key)" -AsSecureString

# Converter senha segura para texto
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($supabaseKey)
$supabaseKeyPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

Write-Host ""
Write-Host "🔄 Executando migration..." -ForegroundColor Yellow
Write-Host ""

# Ler conteúdo do arquivo SQL
$sqlContent = Get-Content $migrationFile -Raw

# Executar via API do Supabase
try {
    $headers = @{
        "apikey" = $supabaseKeyPlain
        "Authorization" = "Bearer $supabaseKeyPlain"
        "Content-Type" = "application/json"
    }

    $body = @{
        query = $sqlContent
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/rpc/exec" -Method Post -Headers $headers -Body $body -ErrorAction Stop

    Write-Host "✅ Migration executada com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Tabelas criadas:" -ForegroundColor Cyan
    Write-Host "   • barbers_turn_list" -ForegroundColor White
    Write-Host "   • barbers_turn_history" -ForegroundColor White
    Write-Host ""
    Write-Host "📋 Funções criadas:" -ForegroundColor Cyan
    Write-Host "   • fn_initialize_turn_list" -ForegroundColor White
    Write-Host "   • fn_add_point_to_barber" -ForegroundColor White
    Write-Host "   • fn_reorder_turn_list" -ForegroundColor White
    Write-Host "   • fn_monthly_reset_turn_list" -ForegroundColor White
    Write-Host ""
    Write-Host "📋 Views criadas:" -ForegroundColor Cyan
    Write-Host "   • vw_turn_list_complete" -ForegroundColor White
    Write-Host "   • vw_turn_history_complete" -ForegroundColor White
    Write-Host ""
    Write-Host "🎉 Sistema Lista da Vez pronto para uso!" -ForegroundColor Green

} catch {
    Write-Host "❌ ERRO ao executar migration:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 SOLUÇÃO ALTERNATIVA:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Acesse o Supabase Dashboard:" -ForegroundColor Cyan
    Write-Host "   $supabaseUrl" -ForegroundColor White
    Write-Host ""
    Write-Host "2. Vá em: SQL Editor" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "3. Copie e cole o conteúdo do arquivo:" -ForegroundColor Cyan
    Write-Host "   $migrationFile" -ForegroundColor White
    Write-Host ""
    Write-Host "4. Clique em 'Run' para executar" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Pressione qualquer tecla para continuar..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

