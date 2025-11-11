#!/usr/bin/env tsx

/**
 * Test OpenAI Connection
 * ----------------------
 * Testa a conexão com a API do OpenAI e valida configuração
 */

import { config } from 'dotenv';
import path from 'path';

// Carregar variáveis de ambiente
config({ path: path.resolve(process.cwd(), '.env') });

// Garantir que NEXT_PUBLIC_SUPABASE_URL está disponível
if (!process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.VITE_SUPABASE_URL) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.VITE_SUPABASE_URL;
}

import { testOpenAIConnection } from '../lib/ai/openai';
import { logger } from '../lib/logger';

async function main() {
  console.log('🤖 Testando conexão com OpenAI...\n');

  // Verificar API key
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY não configurada no .env');
    process.exit(1);
  }

  const apiKeyPreview = process.env.OPENAI_API_KEY.substring(0, 20) + '...';
  console.log(`📋 API Key: ${apiKeyPreview}`);
  console.log(`📋 Model: ${process.env.OPENAI_MODEL || 'gpt-4o-mini'}\n`);

  try {
    console.log('🔄 Fazendo chamada de teste...');
    const isConnected = await testOpenAIConnection();

    if (isConnected) {
      console.log('\n✅ Conexão OpenAI bem-sucedida!');
      console.log('✅ API configurada corretamente');
      console.log('✅ Modelo respondendo normalmente');
      process.exit(0);
    } else {
      console.log('\n❌ Conexão OpenAI falhou!');
      console.log('Verifique:');
      console.log('  1. API key está válida e ativa');
      console.log('  2. Há créditos disponíveis na conta');
      console.log('  3. Modelo está disponível');
      process.exit(1);
    }
  } catch (error: any) {
    console.error('\n❌ Erro ao testar OpenAI:', error.message);
    console.error('\nDetalhes:', {
      status: error.status,
      type: error.type,
      code: error.code,
    });
    process.exit(1);
  }
}

main();
