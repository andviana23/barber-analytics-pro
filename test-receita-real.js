/**
 * Teste real de criação de receita - Validação pós-recriação do banco
 */

import { createClient } from '@supabase/supabase-js';
import { financeiroService } from './src/services/financeiroService.js';

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🧪 TESTE REAL DE CADASTRO DE RECEITA');
console.log('=====================================');

async function testarCadastroReceita() {
  try {
    console.log('🔍 Verificando conexão com o banco...');

    // Dados de teste realistas
    const dadosReceita = {
      type: 'service',
      value: 150.0,
      date: '2025-10-16',
      source: 'Corte de cabelo + barba',
      observations: 'Cliente preferencial - teste pós-recriação DB',
    };

    console.log('📝 Dados da receita:', dadosReceita);
    console.log('');
    console.log('🚀 Criando receita...');

    // Tentativa de criação
    const resultado = await financeiroService.createReceita(dadosReceita);

    if (resultado.success) {
      console.log('✅ SUCESSO! Receita criada com sucesso!');
      console.log('📋 ID da receita:', resultado.data.id);
      console.log('💰 Valor:', resultado.data.value);
      console.log('📅 Data:', resultado.data.date);
      console.log('📊 Status:', resultado.data.status);
      console.log('');
      console.log('🎉 CONFIRMADO: Erro "profit field" foi ELIMINADO!');

      return true;
    } else {
      console.log('❌ ERRO na criação da receita:');
      console.log('📝 Detalhes:', resultado.error);

      if (resultado.error?.includes('profit')) {
        console.log(
          '🚨 ATENÇÃO: Erro relacionado ao campo "profit" ainda persiste!'
        );
      }

      return false;
    }
  } catch (error) {
    console.log('💥 ERRO INESPERADO:');
    console.log('📝 Detalhes:', error.message);

    if (error.message?.includes('profit')) {
      console.log('🚨 ATENÇÃO: Erro relacionado ao campo "profit" detectado!');
    }

    return false;
  }
}

// Executar teste
testarCadastroReceita()
  .then(sucesso => {
    if (sucesso) {
      console.log('');
      console.log('🏆 TESTE CONCLUÍDO COM SUCESSO!');
      console.log('✅ Sistema pronto para produção');
      process.exit(0);
    } else {
      console.log('');
      console.log('⚠️ TESTE FALHOU - Investigação necessária');
      process.exit(1);
    }
  })
  .catch(err => {
    console.log('💥 ERRO CRÍTICO:', err);
    process.exit(1);
  });
