#!/usr/bin/env tsx

/**
 * Validate REST APIs
 * -------------------
 * Testa as principais APIs REST do sistema com dados reais
 *
 * APIs testadas:
 * 1. /api/kpis/health - KPIs de saúde financeira
 * 2. /api/forecasts/cashflow - Previsão de fluxo de caixa
 * 3. /api/alerts/query - Consulta de alertas
 */

import { config } from 'dotenv';
import path from 'path';

// Carregar variáveis de ambiente
config({ path: path.resolve(process.cwd(), '.env') });

if (!process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.VITE_SUPABASE_URL) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.VITE_SUPABASE_URL;
}

const BASE_URL = process.env.VITE_API_URL || 'http://localhost:5173';
const UNIT_ID = '28c57936-5b4b-45a3-b6ef-eaebb96a9479'; // Mangabeiras

interface TestResult {
  api: string;
  status: 'success' | 'error';
  duration: number;
  data?: any;
  error?: string;
}

async function testAPI(
  name: string,
  url: string,
  options: RequestInit = {}
): Promise<TestResult> {
  const startTime = Date.now();

  try {
    console.log(`\n🔍 Testando: ${name}`);
    console.log(`   URL: ${url}`);

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const duration = Date.now() - startTime;

    if (!response.ok) {
      const error = await response.text();
      console.log(`   ❌ Falhou (${response.status}): ${error}`);
      return {
        api: name,
        status: 'error',
        duration,
        error: `${response.status}: ${error}`,
      };
    }

    const data = await response.json();
    console.log(`   ✅ Sucesso (${duration}ms)`);
    console.log(`   Dados:`, JSON.stringify(data, null, 2).substring(0, 200));

    return {
      api: name,
      status: 'success',
      duration,
      data,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.log(`   ❌ Erro: ${error.message}`);

    return {
      api: name,
      status: 'error',
      duration,
      error: error.message,
    };
  }
}

async function main() {
  console.log('🧪 Validação de APIs REST');
  console.log('========================\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Unit ID: ${UNIT_ID}\n`);

  const results: TestResult[] = [];

  // 1. KPIs Health
  const startDate = '2025-11-01';
  const endDate = '2025-11-11';

  results.push(
    await testAPI(
      'KPIs Health',
      `${BASE_URL}/api/kpis/health?unitId=${UNIT_ID}&startDate=${startDate}&endDate=${endDate}`
    )
  );

  // 2. Cashflow Forecast
  const days = 7;

  results.push(
    await testAPI(
      'Cashflow Forecast',
      `${BASE_URL}/api/forecasts/cashflow?unitId=${UNIT_ID}&days=${days}`
    )
  );

  // 3. Alerts Query
  results.push(
    await testAPI(
      'Alerts Query',
      `${BASE_URL}/api/alerts/query?unitId=${UNIT_ID}&status=OPEN`
    )
  );

  // Resumo
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 RESUMO DOS TESTES');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  const avgDuration =
    results.reduce((sum, r) => sum + r.duration, 0) / results.length;

  results.forEach(result => {
    const icon = result.status === 'success' ? '✅' : '❌';
    const duration = `${result.duration}ms`;
    console.log(`${icon} ${result.api.padEnd(30)} ${duration.padStart(10)}`);
    if (result.error) {
      console.log(`   Erro: ${result.error}`);
    }
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Total: ${results.length} APIs testadas`);
  console.log(`✅ Sucesso: ${successCount}`);
  console.log(`❌ Falhas: ${errorCount}`);
  console.log(`⏱️  Tempo médio: ${avgDuration.toFixed(0)}ms`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  process.exit(errorCount > 0 ? 1 : 0);
}

main();
