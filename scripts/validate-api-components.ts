#!/usr/bin/env tsx

/**
 * Validate API Components
 * ------------------------
 * Testa os componentes das APIs (repositories e services)
 * sem precisar do servidor HTTP rodando
 */

import { config } from 'dotenv';
import path from 'path';

// Carregar variáveis de ambiente
config({ path: path.resolve(process.cwd(), '.env') });

if (!process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.VITE_SUPABASE_URL) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.VITE_SUPABASE_URL;
}

import { aiMetricsRepository } from '../lib/repositories/aiMetricsRepository';
import { alertsRepository } from '../lib/repositories/alertsRepository';
import { generateAnalysis, PromptType } from '../lib/ai/analysis';

const UNIT_ID = '28c57936-5b4b-45a3-b6ef-eaebb96a9479'; // Mangabeiras

interface TestResult {
  name: string;
  status: 'success' | 'error';
  duration: number;
  data?: any;
  error?: string;
}

async function testComponent(
  name: string,
  fn: () => Promise<any>
): Promise<TestResult> {
  const startTime = Date.now();

  try {
    console.log(`\n🔍 Testando: ${name}`);
    const result = await fn();
    const duration = Date.now() - startTime;

    if (result.error) {
      console.log(`   ❌ Erro: ${result.error.message || result.error}`);
      return {
        name,
        status: 'error',
        duration,
        error: result.error.message || result.error,
      };
    }

    console.log(`   ✅ Sucesso (${duration}ms)`);
    console.log(
      `   Dados:`,
      JSON.stringify(result.data, null, 2).substring(0, 150) + '...'
    );

    return {
      name,
      status: 'success',
      duration,
      data: result.data,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.log(`   ❌ Exceção: ${error.message}`);

    return {
      name,
      status: 'error',
      duration,
      error: error.message,
    };
  }
}

async function main() {
  console.log('🧪 Validação de Componentes das APIs');
  console.log('====================================\n');
  console.log(`Unit ID: ${UNIT_ID}\n`);

  const results: TestResult[] = [];

  // 1. AI Metrics Repository - findByPeriod
  const startDate = new Date('2025-11-01');
  const endDate = new Date('2025-11-11');

  results.push(
    await testComponent('AI Metrics: findByPeriod', async () => {
      return await aiMetricsRepository.findByPeriod(
        UNIT_ID,
        startDate,
        endDate
      );
    })
  );

  // 2. AI Metrics Repository - findByDate
  const today = new Date('2025-11-11');

  results.push(
    await testComponent('AI Metrics: findByDate', async () => {
      return await aiMetricsRepository.findByDate(UNIT_ID, today);
    })
  );

  // 3. Alerts Repository - findByUnit
  results.push(
    await testComponent('Alerts: findByUnit (OPEN)', async () => {
      return await alertsRepository.findByUnit(UNIT_ID, 'OPEN', 10);
    })
  );

  // 4. Alerts Repository - findByType
  results.push(
    await testComponent('Alerts: findByType (ANOMALIA)', async () => {
      return await alertsRepository.findByType('ANOMALIA' as any, UNIT_ID, 5);
    })
  );

  // 5. Generate Analysis (OpenAI) - apenas se houver métricas
  const metricsResult = results.find(
    r => r.name === 'AI Metrics: findByPeriod'
  );

  if (metricsResult?.status === 'success' && metricsResult.data?.length > 0) {
    results.push(
      await testComponent('OpenAI: Generate Weekly Analysis', async () => {
        try {
          const analysis = await generateAnalysis(
            UNIT_ID,
            metricsResult.data,
            'WEEKLY' as PromptType
          );

          return { data: analysis, error: null };
        } catch (error: any) {
          return { data: null, error: error.message };
        }
      })
    );
  }

  // Resumo
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 RESUMO DOS TESTES');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  const avgDuration =
    results.reduce((sum, r) => sum + r.duration, 0) / results.length;

  results.forEach(result => {
    const icon = result.status === 'success' ? '✅' : '❌';
    const duration = `${result.duration}ms`;
    console.log(`${icon} ${result.name.padEnd(45)} ${duration.padStart(10)}`);
    if (result.error) {
      console.log(`   Erro: ${result.error}`);
    }
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Total: ${results.length} componentes testados`);
  console.log(`✅ Sucesso: ${successCount}`);
  console.log(`❌ Falhas: ${errorCount}`);
  console.log(`⏱️  Tempo médio: ${avgDuration.toFixed(0)}ms`);
  console.log(
    `⏱️  Tempo total: ${results.reduce((sum, r) => sum + r.duration, 0)}ms`
  );
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Detalhes dos dados
  console.log('📋 DETALHES DOS DADOS:\n');

  const metricsData = results.find(r => r.name === 'AI Metrics: findByPeriod');
  if (metricsData?.status === 'success') {
    const metrics = metricsData.data;
    console.log(`📊 Métricas (${metrics.length} dias):`);
    if (metrics.length > 0) {
      const totalRevenue = metrics.reduce(
        (sum: number, m: any) =>
          sum + (m.receita_bruta || m.gross_revenue || 0),
        0
      );
      const totalExpenses = metrics.reduce(
        (sum: number, m: any) =>
          sum + (m.despesas_totais || m.total_expenses || 0),
        0
      );
      console.log(`   Receita Total: R$ ${totalRevenue.toFixed(2)}`);
      console.log(`   Despesas Totais: R$ ${totalExpenses.toFixed(2)}`);
      console.log(`   Margem: R$ ${(totalRevenue - totalExpenses).toFixed(2)}`);
    }
  }

  const alertsData = results.find(r => r.name === 'Alerts: findByUnit (OPEN)');
  if (alertsData?.status === 'success') {
    const alerts = alertsData.data;
    console.log(`\n🚨 Alertas Abertos: ${alerts.length}`);
    alerts.slice(0, 3).forEach((alert: any, idx: number) => {
      console.log(
        `   ${idx + 1}. [${alert.severity}] ${alert.alert_type}: ${alert.message.substring(0, 60)}...`
      );
    });
  }

  process.exit(errorCount > 0 ? 1 : 0);
}

main();
