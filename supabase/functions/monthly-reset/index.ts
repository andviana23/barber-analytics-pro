import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

/**
 * @file monthly-reset.ts
 * @description Edge Function para reset mensal automático da Lista da Vez
 * @module edge-functions/monthly-reset
 * @author AI Agent
 * @date 2024-10-18
 *
 * @description
 * Edge Function que executa o reset mensal automático da Lista da Vez,
 * salvando o histórico e zerando as pontuações para o próximo mês.
 * Deve ser executada via cron job no último dia de cada mês às 23:59.
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verificar se é uma requisição autorizada (cron job ou manual)
    const authHeader = req.headers.get('Authorization');
    const apiKey = req.headers.get('apikey');

    if (!authHeader && !apiKey) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔄 Iniciando reset mensal da Lista da Vez...');

    // Executar função SQL de reset mensal
    const { data, error } = await supabase.rpc('fn_monthly_reset_turn_list');

    if (error) {
      console.error('❌ Erro ao executar reset mensal:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ Reset mensal executado com sucesso:', data);

    // Log adicional para auditoria
    const auditLog = {
      action: 'monthly_reset_executed',
      timestamp: new Date().toISOString(),
      result: data,
      function: 'monthly-reset',
      environment: Deno.env.get('ENVIRONMENT') || 'production',
    };

    console.log('📊 Log de auditoria:', JSON.stringify(auditLog, null, 2));

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Reset mensal executado com sucesso',
        data: data,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Erro inesperado no reset mensal:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Erro interno do servidor',
        message: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
