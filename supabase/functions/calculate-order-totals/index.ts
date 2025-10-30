import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface OrderItem {
  id: string;
  service_id?: string;
  product_id?: string;
  professional_id: string;
  quantity: number;
  unit_price: number;
}

interface OrderTotals {
  subtotal: number;
  discount: number;
  total: number;
  commission_total: number;
  items: Array<{
    id: string;
    commission: number;
  }>;
}

Deno.serve(async req => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { order_id } = await req.json();

    if (!order_id) {
      return new Response(JSON.stringify({ error: 'order_id é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Buscar itens da comanda com relacionamentos
    const { data: items, error: itemsError } = await supabaseClient
      .from('order_items')
      .select(
        `
        id,
        service_id,
        product_id,
        professional_id,
        quantity,
        unit_price,
        services:service_id (
          commission_percentage,
          category_id
        ),
        products:product_id (
          commission_percentage,
          category_id
        ),
        professionals:professional_id (
          commission_percentage
        )
      `
      )
      .eq('order_id', order_id)
      .eq('is_active', true);

    if (itemsError) {
      console.error('Erro ao buscar itens:', itemsError);
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar itens da comanda' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!items || items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Comanda não possui itens' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Calcular totais
    let subtotal = 0;
    let commission_total = 0;
    const itemsWithCommission = [];

    for (const item of items) {
      const itemTotal = item.quantity * item.unit_price;
      subtotal += itemTotal;

      // Determinar percentual de comissão
      let commissionPercentage = 0;

      if (item.service_id && item.services) {
        commissionPercentage = item.services.commission_percentage || 0;
      } else if (item.product_id && item.products) {
        commissionPercentage = item.products.commission_percentage || 0;
      }

      // Se o profissional tem um percentual específico, usar ele
      if (item.professionals?.commission_percentage) {
        commissionPercentage = item.professionals.commission_percentage;
      }

      const itemCommission = (itemTotal * commissionPercentage) / 100;
      commission_total += itemCommission;

      itemsWithCommission.push({
        id: item.id,
        commission: itemCommission,
      });
    }

    // Buscar descontos aplicados (se existir tabela de descontos)
    const discount = 0; // TODO: Implementar lógica de descontos quando SPRINT 5 for executada

    const total = subtotal - discount;

    const result: OrderTotals = {
      subtotal,
      discount,
      total,
      commission_total,
      items: itemsWithCommission,
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro na Edge Function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
