#!/bin/bash

# 🚀 Script de Teste ETL - Barber Analytics Pro
# Executa ETL diário e valida resultados

echo "🔍 Testando ETL Diário..."
echo ""

# Configuração
API_URL="http://localhost:5174"
CRON_SECRET="dev-cron-4f7a9d2e5b8c1f3a6d9e2b5c8f1a4d7e0b3c6f9a2d5e8b1c4f7a0d3e6b9c2f5"

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se servidor está rodando
echo "1️⃣ Verificando servidor..."
if curl -s "$API_URL" > /dev/null; then
    echo -e "${GREEN}✅ Servidor rodando${NC}"
else
    echo -e "${RED}❌ Servidor não está rodando!${NC}"
    echo "Execute: npm run dev"
    exit 1
fi

echo ""
echo "2️⃣ Executando ETL Diário..."
echo ""

# Executar ETL
RESPONSE=$(curl -s -X GET \
  -H "Authorization: Bearer $CRON_SECRET" \
  "$API_URL/api/cron/etl-diario")

# Fallback: se a resposta for HTML (rota não disponível localmente), usar runner CLI
if echo "$RESPONSE" | grep -qi "<!doctype html>"; then
    echo -e "${YELLOW}⚠️  API local não disponível. Executando fallback via CLI (scripts/run-etl.ts)...${NC}"
    echo ""

    # Primeiro tenta com tsx
    if pnpm tsx --tsconfig tsconfig.cli.json scripts/run-etl.ts "$@"; then
        EXIT_CODE=$?
        if [ $EXIT_CODE -eq 0 ]; then
            echo ""
            echo -e "${GREEN}✅ ETL executado com sucesso via CLI (tsx)!${NC}"
            exit 0
        fi
    fi

    # Se tsx falhou, tenta ts-node como último recurso
    echo ""
    echo -e "${YELLOW}⚠️  Fallback TSX falhou. Tentando executar via ts-node...${NC}"

    # Garantir dependências auxiliares
    pnpm add -D tsconfig-paths ts-node >/dev/null 2>&1 || true

    # Executar com ts-node
    node --loader ts-node/esm --experimental-specifier-resolution=node --import tsconfig-paths/register scripts/run-etl.ts "$@"
    EXIT_CODE=$?

    if [ $EXIT_CODE -ne 0 ]; then
        echo ""
        echo -e "${RED}❌ ETL CLI retornou código $EXIT_CODE (falha crítica)${NC}"
        echo ""
        echo "Possíveis causas:"
        echo "   1. Erro de sintaxe em calculations.ts ou etl.ts"
        echo "   2. Dependências faltando (pnpm install)"
        echo "   3. Variáveis de ambiente não configuradas (.env.local)"
        echo "   4. Conexão com Supabase falhando"
        echo ""
        exit $EXIT_CODE
    fi

    echo ""
    echo -e "${GREEN}✅ ETL executado com sucesso via CLI (ts-node)!${NC}"
    exit 0
fi

# Verificar resposta
if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ ETL executado com sucesso!${NC}"
    echo ""
    echo "📊 Resultado:"
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
    echo ""

    # Extrair estatísticas
    TOTAL_UNITS=$(echo "$RESPONSE" | jq -r '.summary.totalUnits' 2>/dev/null || echo "N/A")
    SUCCESS_UNITS=$(echo "$RESPONSE" | jq -r '.summary.successfulUnits' 2>/dev/null || echo "N/A")
    FAILED_UNITS=$(echo "$RESPONSE" | jq -r '.summary.failedUnits' 2>/dev/null || echo "N/A")
    METRICS=$(echo "$RESPONSE" | jq -r '.summary.totalMetricsProcessed' 2>/dev/null || echo "N/A")
    DURATION=$(echo "$RESPONSE" | jq -r '.durationSeconds' 2>/dev/null || echo "N/A")

    echo "📈 Estatísticas:"
    echo "   - Total de unidades: $TOTAL_UNITS"
    echo "   - Unidades processadas: $SUCCESS_UNITS"
    echo "   - Unidades com erro: $FAILED_UNITS"
    echo "   - Métricas geradas: $METRICS"
    echo "   - Duração: ${DURATION}s"
    echo ""

    if [ "$METRICS" != "0" ] && [ "$METRICS" != "N/A" ]; then
        echo -e "${GREEN}✅ Métricas geradas com sucesso!${NC}"
        echo ""
        echo "🔍 Próximos passos:"
        echo "   1. Verificar métricas no banco:"
        echo "      SELECT * FROM ai_metrics_daily ORDER BY created_at DESC LIMIT 10;"
        echo ""
        echo "   2. Verificar alertas gerados:"
        echo "      SELECT * FROM alerts_events ORDER BY created_at DESC LIMIT 5;"
        echo ""
        echo "   3. Testar APIs:"
        echo "      curl '$API_URL/api/kpis/health?unitId=...&startDate=2025-11-01&endDate=2025-11-10'"
    else
        echo -e "${YELLOW}⚠️  Nenhuma métrica foi gerada${NC}"
        echo ""
        echo "Possíveis causas:"
        echo "   1. Nenhuma unidade ativa (SELECT * FROM units WHERE is_active = true)"
        echo "   2. Sem dados no período (SELECT COUNT(*) FROM revenues)"
        echo "   3. ETL já executado hoje (verificar etl_runs)"
    fi
else
    echo -e "${RED}❌ ETL falhou!${NC}"
    echo ""
    echo "Resposta:"
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
    echo ""
    echo "Verificar:"
    echo "   1. CRON_SECRET está correto?"
    echo "   2. SUPABASE_SERVICE_ROLE_KEY está configurado?"
    echo "   3. Servidor rodando sem erros?"
    exit 1
fi

echo ""
echo "✨ Teste concluído!"
