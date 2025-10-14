# ========================================
# Execute SQL Migration: Add account_id to revenues
# ========================================
# This script executes the migration to add account_id column
# to the revenues table in Supabase
# ========================================

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Add account_id to revenues table" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env.local exists
if (-not (Test-Path ".env.local")) {
    Write-Host "ERROR: .env.local file not found!" -ForegroundColor Red
    Write-Host "Please create .env.local with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Yellow
    exit 1
}

Write-Host "IMPORTANT: This migration will:" -ForegroundColor Yellow
Write-Host "  1. Add account_id column to revenues table" -ForegroundColor White
Write-Host "  2. Create a foreign key to bank_accounts table" -ForegroundColor White
Write-Host "  3. Create an index for better performance" -ForegroundColor White
Write-Host ""
Write-Host "Please execute the following SQL in your Supabase SQL Editor:" -ForegroundColor Cyan
Write-Host ""
Write-Host "------------------------------------------------" -ForegroundColor Gray

# Read and display the SQL file
$sqlContent = Get-Content "db\sql\12-add-account-id-to-revenues.sql" -Raw
Write-Host $sqlContent -ForegroundColor White

Write-Host "------------------------------------------------" -ForegroundColor Gray
Write-Host ""
Write-Host "To execute:" -ForegroundColor Yellow
Write-Host "  1. Go to your Supabase Dashboard" -ForegroundColor White
Write-Host "  2. Navigate to SQL Editor" -ForegroundColor White
Write-Host "  3. Create a new query" -ForegroundColor White
Write-Host "  4. Copy and paste the SQL above" -ForegroundColor White
Write-Host "  5. Run the query" -ForegroundColor White
Write-Host ""
Write-Host "Supabase Dashboard: https://supabase.com/dashboard/project" -ForegroundColor Cyan
Write-Host ""
Write-Host "Migration script ready!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
