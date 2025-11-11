#!/usr/bin/env tsx

/**
 * Create Test Alert
 * -----------------
 * Cria um alerta de teste para validar o sistema de notificações
 */

import { config } from 'dotenv';
import path from 'path';

// Carregar variáveis de ambiente
config({ path: path.resolve(process.cwd(), '.env') });

if (!process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.VITE_SUPABASE_URL) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.VITE_SUPABASE_URL;
}

import { alertsRepository } from '../lib/repositories/alertsRepository';
import { sendTelegramMessage } from '../lib/telegram';

async function main() {
  console.log('🚨 Criando alerta de teste...\n');

  try {
    // Criar alerta de anomalia
    const { data: alert, error } = await alertsRepository.create({
      unit_id: '28c57936-5b4b-45a3-b6ef-eaebb96a9479',
      alert_type: 'ANOMALIA' as any, // Banco usa português!
      severity: 'HIGH',
      message:
        '🚨 Anomalia Detectada: Despesas acima do padrão hoje (R$ 1.397,18)',
      metadata: {
        expenses_value: 1397.18,
        average: 500.0,
        deviation: 179.5,
      },
    });

    if (error) {
      console.error('❌ Erro ao criar alerta:', error);
      process.exit(1);
    }

    console.log('✅ Alerta criado:', alert?.id);
    console.log(`   Tipo: ${alert?.alert_type}`);
    console.log(`   Severidade: ${alert?.severity}`);
    console.log(`   Status: ${alert?.status}\n`);

    // Enviar via Telegram
    console.log('📱 Enviando alerta via Telegram...\n');

    const telegramMessage = `
🚨 *ALERTA DE ANOMALIA*

🏢 Unidade: Mangabeiras
📊 Tipo: ${alert?.alert_type}
⚠️ Severidade: ${alert?.severity}

${alert?.message}

_Alertas gerados automaticamente pelo sistema_
    `.trim();

    const result = await sendTelegramMessage(telegramMessage);

    if (result.success) {
      console.log('✅ Alerta enviado com sucesso via Telegram!');
      console.log(`   Message ID: ${result.messageId}\n`);
    } else {
      console.error('❌ Falha ao enviar via Telegram:', result.error);
    }

    console.log('\n📱 Verifique seu Telegram!');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

main();
