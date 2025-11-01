// Script para extrair tabelas do schema PostgREST
const fs = require('fs');

// Simulando a resposta do PostgREST (apenas os paths principais)
const paths = {
  '/': {},
  '/asaas_webhook_logs': {},
  '/vw_goals_with_units': {},
  '/vw_commission_by_professional': {},
  '/vw_cash_register_summary': {},
  '/orders': {},
  '/subscriptions': {},
  '/units': {},
  '/professionals': {},
  '/services': {},
  '/clients': {},
  '/products': {},
  '/product_movements': {},
  '/categories': {},
  '/parties': {},
  '/bank_accounts': {},
  '/payment_methods': {},
  '/revenues': {},
  '/expenses': {},
  '/bank_statements': {},
  '/reconciliations': {},
  '/cash_registers': {},
  '/order_items': {},
  '/goals': {},
  '/goal_history': {},
  '/barbers_turn_list': {},
  '/barbers_turn_history': {},
  '/access_logs': {},
  '/professional_service_commissions': {},
  '/vw_revenue_summary': {},
  '/vw_expense_summary': {},
  '/vw_bank_balance': {},
  '/vw_reconciliation_summary': {},
};

const tables = Object.keys(paths)
  .filter(path => path !== '/' && !path.startsWith('/rpc/'))
  .map(path => path.substring(1))
  .sort();

console.log('📊 TABELAS DO BANCO DE DADOS BARBER ANALYTICS PRO');
console.log('='.repeat(60));
console.log();

let tableCount = 0;
let viewCount = 0;

tables.forEach((table, index) => {
  const isView = table.startsWith('vw_');
  if (isView) {
    viewCount++;
  } else {
    tableCount++;
  }

  const type = isView ? '📋 VIEW' : '🗃️  TABLE';
  console.log(`${(index + 1).toString().padStart(2, '0')}. ${type} ${table}`);
});

console.log();
console.log('='.repeat(60));
console.log(
  `📈 RESUMO: ${tableCount} tabelas + ${viewCount} views = ${tables.length} objetos`
);
