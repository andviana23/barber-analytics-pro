# =====================================================
# Script: Executar Fix de RLS da Lista da Vez
# =====================================================
# Data: 2025-10-31
# Descrição: Aplica correção de RLS para views da Lista da Vez
# =====================================================

Write-Host "🔧 Aplicando correção de RLS para Lista da Vez..." -ForegroundColor Cyan
Write-Host ""

# Caminho do arquivo SQL
$sqlFile = ".\database\migrations\fix-lista-da-vez-rls.sql"

# Verificar se arquivo existe
if (-Not (Test-Path $sqlFile)) {
    Write-Host "❌ Erro: Arquivo SQL não encontrado: $sqlFile" -ForegroundColor Red
    exit 1
}

# Carregar variáveis de ambiente do .env
if (Test-Path ".\.env") {
    Write-Host "📄 Carregando variáveis de ambiente..." -ForegroundColor Yellow
    Get-Content ".\.env" | ForEach-Object {
        if ($_ -match "^\s*([^#][^=]*)\s*=\s*(.*)\s*$") {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
} else {
    Write-Host "⚠️  Arquivo .env não encontrado. Usando variáveis de ambiente do sistema." -ForegroundColor Yellow
}

# Obter credenciais do Supabase
$supabaseUrl = $env:VITE_SUPABASE_URL
$supabaseKey = $env:VITE_SUPABASE_SERVICE_ROLE_KEY

if (-Not $supabaseUrl -or -Not $supabaseKey) {
    Write-Host "❌ Erro: Variáveis VITE_SUPABASE_URL ou VITE_SUPABASE_SERVICE_ROLE_KEY não encontradas!" -ForegroundColor Red
    Write-Host "   Configure o arquivo .env ou variáveis de ambiente." -ForegroundColor Red
    exit 1
}

# Extrair dados da URL do Supabase
$supabaseUrl -match "https://([^.]+)\.supabase\.co" | Out-Null
$projectRef = $matches[1]

if (-Not $projectRef) {
    Write-Host "❌ Erro: Não foi possível extrair o project_ref da URL do Supabase!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Projeto Supabase detectado: $projectRef" -ForegroundColor Green
Write-Host ""

# Ler conteúdo do arquivo SQL
$sqlContent = Get-Content $sqlFile -Raw

# Executar SQL via API REST do Supabase
Write-Host "🚀 Executando migração..." -ForegroundColor Cyan
Write-Host ""

try {
    $headers = @{
        "apikey" = $supabaseKey
        "Authorization" = "Bearer $supabaseKey"
        "Content-Type" = "application/json"
        "Prefer" = "return=representation"
    }

    $body = @{
        "query" = $sqlContent
    } | ConvertTo-Json

    $response = Invoke-RestMethod `
        -Uri "$supabaseUrl/rest/v1/rpc/exec_sql" `
        -Method Post `
        -Headers $headers `
        -Body $body `
        -ErrorAction Stop

    Write-Host "✅ Migração aplicada com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Resumo das alterações:" -ForegroundColor Cyan
    Write-Host "   - Views recriadas com SECURITY DEFINER" -ForegroundColor White
    Write-Host "   - vw_turn_list_complete" -ForegroundColor White
    Write-Host "   - vw_turn_history_complete" -ForegroundColor White
    Write-Host "   - Funções auxiliares criadas:" -ForegroundColor White
    Write-Host "     • fn_get_turn_list_for_unit()" -ForegroundColor White
    Write-Host "     • fn_get_turn_history_for_unit()" -ForegroundColor White
    Write-Host ""
    Write-Host "✅ Lista da Vez agora deve funcionar corretamente!" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Erro ao executar migração:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Tente executar manualmente via Supabase Dashboard:" -ForegroundColor Yellow
    Write-Host "   1. Acesse: https://supabase.com/dashboard/project/$projectRef/sql" -ForegroundColor White
    Write-Host "   2. Cole o conteúdo de: $sqlFile" -ForegroundColor White
    Write-Host "   3. Execute o SQL" -ForegroundColor White
    Write-Host ""
    exit 1
}
