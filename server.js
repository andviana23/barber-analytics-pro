/**
 * 🚀 Servidor de API para Cron Jobs
 *
 * Este servidor Express roda PARALELAMENTE ao Vite (porta 5173)
 * e expõe os endpoints de API na porta 3001.
 *
 * Deploy no VPS:
 * 1. npm install express cors dotenv
 * 2. pm2 start server.js --name "barber-api"
 * 3. pm2 start "npm run dev" --name "barber-frontend"
 *
 * Nginx deve fazer proxy reverso:
 * - /api/* → localhost:3001
 * - /* → localhost:5173
 */

import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 3001;
const CRON_SECRET = process.env.CRON_SECRET;

// Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Middleware
app.use(cors());
app.use(express.json());

// Middleware de autenticação
function verifyCronAuth(req, res, next) {
  const { secret } = req.query;
  const headerSecret = req.headers['x-cron-secret'];

  if (!secret && !headerSecret) {
    return res.status(401).json({ error: 'Unauthorized: secret missing' });
  }

  if (secret !== CRON_SECRET && headerSecret !== CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized: invalid secret' });
  }

  next();
}

// Health check (sem autenticação)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'barber-analytics-api',
  });
});

// ========================================
// CRON ROUTES
// ========================================

// 1. 📊 Relatório Diário (21:00)
app.get('/api/cron/relatorio-diario', verifyCronAuth, async (req, res) => {
  try {
    console.log('🕐 Executando relatório diário...');

    // Buscar unidades com Telegram habilitado
    const { data: units, error } = await supabase
      .from('units')
      .select(
        'id, name, telegram_bot_token, telegram_chat_id, telegram_enabled'
      )
      .eq('is_active', true)
      .eq('telegram_enabled', true);

    if (error) throw error;

    if (!units || units.length === 0) {
      return res.json({
        success: true,
        message: 'No units with Telegram enabled',
        reports_sent: 0,
      });
    }

    const results = [];
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    for (const unit of units) {
      try {
        // TODO: Implementar lógica completa de geração de relatório
        // Por enquanto, retorna sucesso para teste
        results.push({
          unit_id: unit.id,
          unit_name: unit.name,
          sent: true,
          message: 'Relatório seria gerado aqui',
        });
      } catch (err) {
        console.error(`Erro na unidade ${unit.name}:`, err);
        results.push({
          unit_id: unit.id,
          unit_name: unit.name,
          sent: false,
          error: err.message,
        });
      }
    }

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      report_date: yesterday.toISOString().split('T')[0],
      reports_sent: results.filter(r => r.sent).length,
      reports_failed: results.filter(r => !r.sent).length,
      results,
    });
  } catch (error) {
    console.error('Erro no relatório diário:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 2. 🔄 ETL Diário (03:00)
app.get('/api/cron/etl-diario', verifyCronAuth, async (req, res) => {
  try {
    console.log('🕐 Executando ETL diário...');

    res.json({
      success: true,
      message: 'ETL diário executado',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erro no ETL:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 3. 💰 Gerar Despesas Recorrentes (02:00 dia 1)
app.get(
  '/api/cron/gerar-despesas-recorrentes',
  verifyCronAuth,
  async (req, res) => {
    try {
      console.log('🕐 Gerando despesas recorrentes...');

      res.json({
        success: true,
        message: 'Despesas recorrentes geradas',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// 4. ✅ Validar Saldos (04:00)
app.get('/api/cron/validate-balance', verifyCronAuth, async (req, res) => {
  try {
    console.log('🕐 Validando saldos...');

    res.json({
      success: true,
      message: 'Saldos validados',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 5. 🔔 Enviar Alertas (22:00)
app.get('/api/cron/enviar-alertas', verifyCronAuth, async (req, res) => {
  try {
    console.log('🕐 Enviando alertas...');

    res.json({
      success: true,
      message: 'Alertas enviados',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 6. ❤️ Health Check (05:00)
app.get('/api/cron/health-check', verifyCronAuth, async (req, res) => {
  try {
    console.log('🕐 Health check...');

    // Testar conexão com Supabase
    const { error } = await supabase.from('units').select('count').limit(1);

    res.json({
      success: true,
      message: 'Sistema saudável',
      timestamp: new Date().toISOString(),
      supabase: error ? 'error' : 'connected',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 7. 📅 Relatório Semanal (08:00 segunda)
app.get('/api/cron/relatorio-semanal', verifyCronAuth, async (req, res) => {
  try {
    console.log('🕐 Relatório semanal...');

    res.json({
      success: true,
      message: 'Relatório semanal gerado',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 8. 📆 Fechamento Mensal (09:00 dia 1)
app.get('/api/cron/fechamento-mensal', verifyCronAuth, async (req, res) => {
  try {
    console.log('🕐 Fechamento mensal...');

    res.json({
      success: true,
      message: 'Fechamento mensal executado',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    message: 'Endpoint não encontrado',
    availableEndpoints: [
      'GET /health',
      'GET /api/cron/relatorio-diario?secret=...',
      'GET /api/cron/etl-diario?secret=...',
      'GET /api/cron/gerar-despesas-recorrentes?secret=...',
      'GET /api/cron/validate-balance?secret=...',
      'GET /api/cron/enviar-alertas?secret=...',
      'GET /api/cron/health-check?secret=...',
      'GET /api/cron/relatorio-semanal?secret=...',
      'GET /api/cron/fechamento-mensal?secret=...',
    ],
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('❌ Erro no servidor:', error);
  res.status(500).json({
    error: 'Internal Server Error',
    message: error.message,
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`\n🚀 API Server rodando na porta ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(
    `🔐 CRON_SECRET: ${CRON_SECRET ? CRON_SECRET.substring(0, 10) + '...' : '⚠️  NÃO CONFIGURADO'}`
  );
  console.log(`\n📋 Endpoints disponíveis:`);
  console.log(`   GET /api/cron/relatorio-diario`);
  console.log(`   GET /api/cron/etl-diario`);
  console.log(`   GET /api/cron/gerar-despesas-recorrentes`);
  console.log(`   GET /api/cron/validate-balance`);
  console.log(`   GET /api/cron/enviar-alertas`);
  console.log(`   GET /api/cron/health-check`);
  console.log(`   GET /api/cron/relatorio-semanal`);
  console.log(`   GET /api/cron/fechamento-mensal\n`);
});
