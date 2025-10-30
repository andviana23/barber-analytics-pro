import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

/**
 * Testes de Performance e Concorrência - Barber Analytics Pro
 *
 * Execução: k6 run tests/performance/orders-load-test.js
 *
 * Cenários:
 * - Carga normal (10 VUs por 30s)
 * - Pico de carga (50 VUs por 1min)
 * - Stress test (100 VUs por 2min)
 */

// Métricas customizadas
const errorRate = new Rate('errors');
const orderCreationTime = new Trend('order_creation_duration');
const orderClosureTime = new Trend('order_closure_duration');

// Configuração de thresholds (95% das requisições < 1s)
export const options = {
  stages: [
    { duration: '30s', target: 10 }, // Warm-up: 10 usuários
    { duration: '1m', target: 50 }, // Carga normal: 50 usuários
    { duration: '2m', target: 100 }, // Pico: 100 usuários
    { duration: '30s', target: 0 }, // Cool-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% das requests < 1s
    errors: ['rate<0.1'], // Taxa de erro < 10%
    order_creation_duration: ['p(95)<2000'], // Criação < 2s
    order_closure_duration: ['p(95)<1500'], // Fechamento < 1.5s
  },
};

// Configuração da API
/* global __ENV */
const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY || 'your-anon-key';

// Headers padrão
const headers = {
  'Content-Type': 'application/json',
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
};

/**
 * Setup - Executado uma vez antes dos testes
 */
export function setup() {
  // Login e obtenção de token
  const loginPayload = JSON.stringify({
    email: 'test@barber.com',
    password: 'senha123',
  });

  const loginRes = http.post(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    loginPayload,
    { headers }
  );

  const authToken = loginRes.json('access_token');

  return {
    authToken,
    headers: {
      ...headers,
      Authorization: `Bearer ${authToken}`,
    },
  };
}

/**
 * Cenário 1: Criar Comandas
 */
export function createOrders(data) {
  const payload = JSON.stringify({
    client_id: 'test-client-id',
    unit_id: 'test-unit-id',
    items: [
      {
        service_id: 'test-service-id',
        professional_id: 'test-professional-id',
        quantity: 1,
      },
    ],
  });

  const startTime = new Date();

  const res = http.post(`${SUPABASE_URL}/rest/v1/orders`, payload, {
    headers: data.headers,
  });

  const duration = new Date() - startTime;
  orderCreationTime.add(duration);

  const success = check(res, {
    'status is 201': r => r.status === 201,
    'has order id': r => r.json('id') !== undefined,
    'response time < 2s': r => r.timings.duration < 2000,
  });

  errorRate.add(!success);

  if (success) {
    return res.json('id');
  }

  return null;
}

/**
 * Cenário 2: Fechar Comandas
 */
export function closeOrder(data, orderId) {
  if (!orderId) return;

  const startTime = new Date();

  const res = http.post(
    `${SUPABASE_URL}/rest/v1/rpc/fn_close_order`,
    JSON.stringify({ p_order_id: orderId }),
    { headers: data.headers }
  );

  const duration = new Date() - startTime;
  orderClosureTime.add(duration);

  const success = check(res, {
    'status is 200': r => r.status === 200,
    'order closed successfully': r => r.json('success') === true,
    'response time < 1.5s': r => r.timings.duration < 1500,
  });

  errorRate.add(!success);
}

/**
 * Cenário 3: Listar Comandas (Read-heavy)
 */
export function listOrders(data) {
  const res = http.get(
    `${SUPABASE_URL}/rest/v1/orders?status=eq.OPEN&select=*,items(*),client(*)`,
    { headers: data.headers }
  );

  const success = check(res, {
    'status is 200': r => r.status === 200,
    'has orders array': r => Array.isArray(r.json()),
    'response time < 500ms': r => r.timings.duration < 500,
  });

  errorRate.add(!success);
}

/**
 * Cenário 4: Aplicar Desconto
 */
export function applyDiscount(data, orderId) {
  if (!orderId) return;

  const payload = JSON.stringify({
    p_order_id: orderId,
    p_discount_type: 'percentage',
    p_discount_value: 10,
    p_reason: 'Desconto de teste de carga',
    p_user_id: 'test-user-id',
  });

  const res = http.post(
    `${SUPABASE_URL}/rest/v1/rpc/fn_apply_discount`,
    payload,
    { headers: data.headers }
  );

  const success = check(res, {
    'status is 200': r => r.status === 200,
    'discount applied': r => r.json('success') === true,
    'response time < 1s': r => r.timings.duration < 1000,
  });

  errorRate.add(!success);
}

/**
 * Cenário 5: Buscar Histórico
 */
export function getHistory(data) {
  const today = new Date().toISOString().split('T')[0];

  const res = http.get(
    `${SUPABASE_URL}/rest/v1/orders?created_at=gte.${today}&select=*,items(*),client(*)&limit=100`,
    { headers: data.headers }
  );

  const success = check(res, {
    'status is 200': r => r.status === 200,
    'response time < 1s': r => r.timings.duration < 1000,
  });

  errorRate.add(!success);
}

/**
 * Função principal - Mix de cenários
 */
export default function (data) {
  // 60% das operações: listar comandas (read-heavy)
  if (Math.random() < 0.6) {
    listOrders(data);
    sleep(1);
    return;
  }

  // 20% das operações: criar e fechar comanda
  if (Math.random() < 0.2) {
    const orderId = createOrders(data);
    sleep(0.5);

    if (orderId) {
      // 50% das comandas criadas recebem desconto
      if (Math.random() < 0.5) {
        applyDiscount(data, orderId);
        sleep(0.5);
      }

      closeOrder(data, orderId);
    }

    sleep(1);
    return;
  }

  // 20% das operações: buscar histórico
  getHistory(data);
  sleep(1);
}

/**
 * Teardown - Executado uma vez após os testes
 */
// eslint-disable-next-line no-unused-vars
export function teardown(data) {
  // eslint-disable-next-line no-console
  console.log('='.repeat(50));
  // eslint-disable-next-line no-console
  console.log('Performance Test Summary');
  // eslint-disable-next-line no-console
  console.log('='.repeat(50));
  // eslint-disable-next-line no-console
  console.log(`Error Rate: ${errorRate.rate * 100}%`);
  // eslint-disable-next-line no-console
  console.log(`P95 Order Creation: ${orderCreationTime.p(95)}ms`);
  // eslint-disable-next-line no-console
  console.log(`P95 Order Closure: ${orderClosureTime.p(95)}ms`);
  // eslint-disable-next-line no-console
  console.log('='.repeat(50));
}
