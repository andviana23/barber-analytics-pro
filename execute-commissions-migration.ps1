# SCRIPT PARA EXECUTAR MIGRATION DE COMISSÕES
# Executa a migração da tabela professional_service_commissions via Supabase

Write-Host "🚀 Iniciando migração de comissões..." -ForegroundColor Green

# Carregar variáveis do .env
$envFile = ".\.env"
if (-not (Test-Path $envFile)) {
    Write-Host "❌ Arquivo .env não encontrado!" -ForegroundColor Red
    exit 1
}

$envVars = @{}
Get-Content $envFile | ForEach-Object {
    if ($_ -match "^([^#][^=]+)=(.*)$") {
        $envVars[$matches[1]] = $matches[2]
    }
}

$supabaseUrl = $envVars["VITE_SUPABASE_URL"]
$serviceRoleKey = $envVars["SUPABASE_SERVICE_ROLE_KEY"]

if (-not $supabaseUrl -or -not $serviceRoleKey) {
    Write-Host "❌ Variáveis VITE_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontradas no .env!" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Executando migração..." -ForegroundColor Cyan

# Ler o arquivo de migração
$migrationFile = ".\supabase\migrations\20250125_create_professional_service_commissions.sql"
if (-not (Test-Path $migrationFile)) {
    Write-Host "❌ Arquivo de migração não encontrado: $migrationFile" -ForegroundColor Red
    exit 1
}

$sqlContent = Get-Content $migrationFile -Raw

# Executar via função RPC exec_sql (se existir) ou criar uma função temporária
try {
    # Primeiro, vamos tentar criar uma função RPC para executar SQL
    $createFunctionSql = @"
CREATE OR REPLACE FUNCTION exec_migration_sql(sql_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS `$`$
BEGIN
    EXECUTE sql_text;
    RETURN 'Migration executed successfully';
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'Error: ' || SQLERRM;
END;
`$`$;
"@

    # Executar criação da função via REST API
    $headers = @{
        "apikey" = $serviceRoleKey
        "Authorization" = "Bearer $serviceRoleKey"
        "Content-Type" = "application/json"
    }

    # Criar a função RPC
    Write-Host "📝 Criando função RPC temporária..." -ForegroundColor Yellow
    $functionBody = @{
        sql = $createFunctionSql
    } | ConvertTo-Json

    $functionResponse = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/rpc/exec_sql" -Method POST -Headers $headers -Body $functionBody -ErrorAction SilentlyContinue

    # Executar a migração
    Write-Host "🔧 Executando migração SQL..." -ForegroundColor Yellow
    $migrationBody = @{
        sql_text = $sqlContent
    } | ConvertTo-Json

    $migrationResponse = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/rpc/exec_migration_sql" -Method POST -Headers $headers -Body $migrationBody

    Write-Host "✅ Migração executada com sucesso!" -ForegroundColor Green
    Write-Host "📊 Resposta: $migrationResponse" -ForegroundColor Cyan

    # Verificar se a tabela foi criada
    Write-Host "🔍 Verificando se a tabela foi criada..." -ForegroundColor Yellow
    $checkResponse = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/professional_service_commissions?limit=1" -Headers $headers -ErrorAction SilentlyContinue

    if ($checkResponse -ne $null) {
        Write-Host "✅ Tabela professional_service_commissions criada com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Tabela pode ter sido criada, mas não é acessível via API REST" -ForegroundColor Yellow
    }

} catch {
    Write-Host "❌ Erro ao executar migração: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Tente executar a migração manualmente no painel do Supabase:" -ForegroundColor Yellow
    Write-Host "   1. Acesse o painel do Supabase" -ForegroundColor White
    Write-Host "   2. Vá para SQL Editor" -ForegroundColor White
    Write-Host "   3. Execute o conteúdo do arquivo: $migrationFile" -ForegroundColor White
    exit 1
}

Write-Host "🎉 Processo concluído!" -ForegroundColor Green