#!/usr/bin/env node

/**
 * Script de teste para verificar conectividade com Supabase
 * Uso: node test-supabase-cors.js
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  console.log('Certifique-se de ter um arquivo .env com:');
  console.log('  VITE_SUPABASE_URL');
  console.log('  VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

console.log('🔍 Testando conexão com Supabase...\n');
console.log(`URL: ${supabaseUrl}`);
console.log(`Key: ${supabaseKey.substring(0, 20)}...`);
console.log('');

const supabase = createClient(supabaseUrl, supabaseKey);

// Teste 1: Health check básico
console.log('📡 Teste 1: Health Check...');
try {
  const { data, error } = await supabase.from('units').select('count');
  if (error) {
    console.log('⚠️  Erro na query:', error.message);
  } else {
    console.log('✅ Conexão OK - Supabase respondeu');
  }
} catch (err) {
  console.log('❌ Erro de conexão:', err.message);
}

// Teste 2: Teste de autenticação
console.log('\n🔐 Teste 2: Sistema de Auth...');
try {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.log('⚠️  Erro ao buscar sessão:', error.message);
  } else {
    console.log('✅ Sistema de Auth respondeu');
    console.log('   Sessão ativa:', data.session ? 'Sim' : 'Não');
  }
} catch (err) {
  console.log('❌ Erro:', err.message);
}

console.log('\n✨ Teste concluído!\n');
console.log('Se viu erros de CORS, configure o Supabase Dashboard:');
console.log(
  '👉 https://supabase.com/dashboard/project/cwfrtqtienguzwsybvwm/settings/auth'
);
console.log('\nAdicione http://localhost:5173 nas URLs permitidas.');
