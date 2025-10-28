/**
 * Script para corrigir status de receitas baseado na data de recebimento
 *
 * Regra:
 * - Se expected_receipt_date <= data de hoje → status = 'Received'
 * - Se expected_receipt_date > data de hoje → status = 'Pending'
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Ler variáveis do .env
const envPath = path.join(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts
        .join('=')
        .trim()
        .replace(/^["']|["']$/g, '');
    }
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    '❌ Erro: VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não encontrados no .env'
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeAndFixRevenueStatus() {
  console.log('🔍 ANÁLISE E CORREÇÃO DE STATUS DE RECEITAS\n');
  console.log('='.repeat(120));

  // Data de hoje (timezone local)
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const hojeStr = hoje.toISOString().split('T')[0];

  console.log(`📅 Data de hoje: ${hojeStr}\n`);

  // 1️⃣ Buscar todas as receitas ativas
  const { data: receitas, error } = await supabase
    .from('revenues')
    .select(
      'id, source, date, expected_receipt_date, status, value, actual_receipt_date'
    )
    .eq('is_active', true)
    .order('expected_receipt_date', { ascending: true });

  if (error) {
    console.error('❌ Erro ao buscar receitas:', error);
    return;
  }

  console.log(`📊 Total de receitas ativas: ${receitas.length}\n`);

  // 2️⃣ Analisar e categorizar
  const incorretas = [];
  const corretas = [];

  receitas.forEach(r => {
    if (!r.expected_receipt_date) {
      console.warn(`⚠️ Receita ${r.id} sem expected_receipt_date`);
      return;
    }

    const prevReceb = new Date(r.expected_receipt_date + 'T00:00:00');
    const statusAtual = r.status;

    // ✅ REGRA: Status correto baseado na data prevista
    const statusCorreto = prevReceb <= hoje ? 'Received' : 'Pending';

    if (statusAtual !== statusCorreto) {
      incorretas.push({
        id: r.id,
        source: r.source,
        date: r.date,
        expected_receipt_date: r.expected_receipt_date,
        statusAtual,
        statusCorreto,
        value: r.value,
      });
    } else {
      corretas.push(r);
    }
  });

  console.log(`✅ Receitas com status CORRETO: ${corretas.length}`);
  console.log(`❌ Receitas com status INCORRETO: ${incorretas.length}\n`);

  if (incorretas.length === 0) {
    console.log('🎉 Todas as receitas estão com status correto!');
    return;
  }

  // 3️⃣ Mostrar receitas incorretas
  console.log('='.repeat(120));
  console.log('❌ RECEITAS COM STATUS INCORRETO:\n');

  incorretas.forEach((r, index) => {
    console.log(
      `${index + 1}. ${r.source?.substring(0, 40).padEnd(40)} | Prev: ${r.expected_receipt_date} | Atual: ${r.statusAtual.padEnd(10)} → Correto: ${r.statusCorreto.padEnd(10)} | R$ ${r.value}`
    );
  });

  console.log('\n' + '='.repeat(120));
  console.log(`\n🔧 Corrigindo ${incorretas.length} receitas...\n`);

  // 4️⃣ Corrigir status
  let corrigidas = 0;
  let erros = 0;

  for (const r of incorretas) {
    const updateData = {
      status: r.statusCorreto,
    };

    // Se status correto é 'Received' e não tem actual_receipt_date, setar como expected_receipt_date
    if (r.statusCorreto === 'Received') {
      updateData.actual_receipt_date = r.expected_receipt_date;
    }

    const { error: updateError } = await supabase
      .from('revenues')
      .update(updateData)
      .eq('id', r.id);

    if (updateError) {
      console.error(`❌ Erro ao atualizar ${r.id}:`, updateError.message);
      erros++;
    } else {
      console.log(
        `✅ ${r.id.substring(0, 8)} | ${r.source?.substring(0, 30).padEnd(30)} | ${r.statusAtual} → ${r.statusCorreto}`
      );
      corrigidas++;
    }
  }

  console.log('\n' + '='.repeat(120));
  console.log(`\n🎉 CONCLUSÃO:`);
  console.log(`   ✅ ${corrigidas} receitas corrigidas`);
  console.log(`   ❌ ${erros} erros`);
  console.log(`   📊 Total processado: ${incorretas.length}`);
}

// Executar
analyzeAndFixRevenueStatus()
  .then(() => {
    console.log('\n✅ Script finalizado com sucesso!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Erro ao executar script:', error);
    process.exit(1);
  });
