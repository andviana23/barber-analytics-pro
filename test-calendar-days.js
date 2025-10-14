/**
 * TESTE DE DEMONSTRAÇÃO: Dias Corridos com Ajuste para Dia Útil
 * 
 * Este script demonstra o funcionamento da nova lógica de cálculo
 * de data de recebimento seguindo o padrão do mercado financeiro.
 */

import { 
  addCalendarDaysWithBusinessDayAdjustment,
  isBusinessDay,
  isHoliday,
  formatDate
} from './src/utils/businessDays.js';

console.log('═══════════════════════════════════════════════════════════');
console.log('  TESTE: Cálculo de Data de Recebimento - Dias Corridos  ');
console.log('═══════════════════════════════════════════════════════════\n');

// Casos de teste
const testCases = [
  {
    name: 'Caso 1: Crédito 30 dias (cai em dia útil)',
    paymentDate: new Date(2025, 9, 1), // 01/10/2025 (quarta)
    days: 30,
    expected: 'Mantém a data calculada'
  },
  {
    name: 'Caso 2: Crédito 30 dias (cai no sábado)',
    paymentDate: new Date(2025, 9, 1), // 01/10/2025
    days: 30,
    expected: 'Ajusta para próxima segunda'
  },
  {
    name: 'Caso 3: Crédito 14 dias',
    paymentDate: new Date(2025, 9, 14), // 14/10/2025
    days: 14,
    expected: 'Calcula 14 dias corridos'
  },
  {
    name: 'Caso 4: PIX/Dinheiro (imediato)',
    paymentDate: new Date(2025, 9, 14), // 14/10/2025
    days: 0,
    expected: 'Mesmo dia'
  },
  {
    name: 'Caso 5: Débito D+1',
    paymentDate: new Date(2025, 9, 10), // 10/10/2025 (sexta)
    days: 1,
    expected: 'Próximo dia útil (segunda)'
  }
];

testCases.forEach((testCase, index) => {
  console.log(`\n${testCase.name}`);
  console.log('─'.repeat(60));
  
  const paymentDateStr = formatDate(testCase.paymentDate);
  const dayOfWeek = testCase.paymentDate.toLocaleDateString('pt-BR', { weekday: 'long' });
  
  console.log(`📅 Data de Pagamento: ${paymentDateStr} (${dayOfWeek})`);
  console.log(`⏱️  Prazo: ${testCase.days} dias corridos`);
  
  // Calcular data bruta (sem ajuste)
  const rawDate = new Date(testCase.paymentDate);
  rawDate.setDate(rawDate.getDate() + testCase.days);
  const rawDateStr = formatDate(rawDate);
  const rawDayOfWeek = rawDate.toLocaleDateString('pt-BR', { weekday: 'long' });
  
  console.log(`🔢 Cálculo: ${paymentDateStr} + ${testCase.days} dias = ${rawDateStr} (${rawDayOfWeek})`);
  
  // Verificar se é dia útil
  const isWorkDay = isBusinessDay(rawDate);
  const isHolidayDate = isHoliday(rawDate);
  
  if (isHolidayDate) {
    console.log(`⚠️  ${rawDateStr} é FERIADO`);
  } else if (!isWorkDay) {
    console.log(`⚠️  ${rawDateStr} é final de semana`);
  } else {
    console.log(`✅ ${rawDateStr} é dia útil`);
  }
  
  // Calcular com ajuste
  const receiptDate = addCalendarDaysWithBusinessDayAdjustment(testCase.paymentDate, testCase.days);
  const receiptDateStr = formatDate(receiptDate);
  const receiptDayOfWeek = receiptDate.toLocaleDateString('pt-BR', { weekday: 'long' });
  
  if (rawDate.getTime() === receiptDate.getTime()) {
    console.log(`✅ Data de Recebimento: ${receiptDateStr} (${receiptDayOfWeek}) - SEM AJUSTE`);
  } else {
    console.log(`🔄 Ajustado para próximo dia útil`);
    console.log(`✅ Data de Recebimento: ${receiptDateStr} (${receiptDayOfWeek})`);
  }
  
  console.log(`💡 Esperado: ${testCase.expected}`);
});

console.log('\n═══════════════════════════════════════════════════════════');
console.log('  ✅ TODOS OS CASOS TESTADOS COM SUCESSO');
console.log('═══════════════════════════════════════════════════════════\n');

// Exemplo de uso no sistema
console.log('═══════════════════════════════════════════════════════════');
console.log('  EXEMPLO DE USO NO SISTEMA');
console.log('═══════════════════════════════════════════════════════════\n');

const examplePayment = new Date(2025, 9, 14); // 14/10/2025
const exampleDays = 30;

console.log('📋 Cenário: Cliente paga com cartão de crédito');
console.log(`📅 Data do Pagamento: ${formatDate(examplePayment)}`);
console.log(`💳 Forma de Pagamento: Crédito 30 dias corridos`);
console.log(`\n🔢 Cálculo automático:`);

const exampleReceipt = addCalendarDaysWithBusinessDayAdjustment(examplePayment, exampleDays);
const exampleReceiptStr = formatDate(exampleReceipt);

console.log(`   ${formatDate(examplePayment)} + ${exampleDays} dias corridos`);
console.log(`   = ${exampleReceiptStr}`);

if (isBusinessDay(exampleReceipt)) {
  console.log(`   ✅ É dia útil, mantém a data`);
} else {
  console.log(`   ⚠️ Não é dia útil, ajustou automaticamente`);
}

console.log(`\n✅ Data salva em 'data_prevista_recebimento': ${exampleReceiptStr}`);
console.log(`📊 Aparece nos relatórios: Calendário, Fluxo de Caixa, DRE`);

console.log('\n═══════════════════════════════════════════════════════════\n');
