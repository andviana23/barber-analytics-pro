# Script PowerShell para executar SQL no Supabase via API REST
# Arquivo: execute-permissions-sql.ps1

$supabaseUrl = "https://waxpclctxaeegptihsmc.supabase.co"
$serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndheHBjbGN0eGFlZWdwdGloc21jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDE4MDAwMSwiZXhwIjoyMDc1NzU2MDAxfQ.bXCgDrXOGI6a6SLT1YMnRexkgMISdyAFAh4UCf2NwsY"

# Ler o conteúdo do arquivo SQL
$sqlContent = Get-Content -Path "db\sql\08-implement-user-permissions.sql" -Raw

# Preparar o body para a requisição
$body = @{
    query = $sqlContent
} | ConvertTo-Json -Depth 10

# Headers para autenticação
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $serviceRoleKey"
    "apikey" = $serviceRoleKey
}

try {
    Write-Host "Executando script de permissões no Supabase..." -ForegroundColor Yellow
    
    # Fazer a requisição para execução do SQL
    $response = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/rpc/exec_sql" -Method Post -Body $body -Headers $headers
    
    Write-Host "✅ Script executado com sucesso!" -ForegroundColor Green
    Write-Host "Resposta: $($response | ConvertTo-Json -Depth 3)" -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ Erro ao executar o script:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    # Se a API REST não funcionar, vamos tentar via SQL Editor do Supabase
    Write-Host "`n💡 Alternativa: Execute o SQL manualmente no SQL Editor do Supabase Dashboard" -ForegroundColor Yellow
    Write-Host "1. Acesse: https://supabase.com/dashboard/project/waxpclctxaeegptihsmc/sql/new" -ForegroundColor Cyan
    Write-Host "2. Cole o conteúdo do arquivo: db\sql\08-implement-user-permissions.sql" -ForegroundColor Cyan
    Write-Host "3. Execute o script" -ForegroundColor Cyan
}