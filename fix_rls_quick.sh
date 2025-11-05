#!/bin/bash

# Script para executar a correção RLS via psql
# Certifique-se de que você tem acesso ao banco de dados

echo "🔧 Aplicando correção RLS para bank_account_balance_logs..."

# Execute no seu banco de dados Supabase/PostgreSQL
cat database/migrations/fix_bank_account_balance_logs_rls.sql | psql "your_database_connection_string_here"

echo "✅ Correção aplicada!"
echo "📝 Agora tente novamente ajustar o saldo inicial."
