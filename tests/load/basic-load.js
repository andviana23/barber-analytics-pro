/**
 * K6 Load Testing Configuration
 * Testes de carga e stress para Barber Analytics Pro
 *
 * Executar com: k6 run tests/load/basic-load.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Métricas customizadas
const errorRate = new Rate('errors');

// Configuração de carga
export const options = {
  stages: [
    { duration: '30s', target: 10 }, // Ramp-up: 0 → 10 usuários em 30s
    { duration: '1m', target: 10 }, // Stay: 10 usuários por 1 min
    { duration: '30s', target: 50 }, // Spike: 10 → 50 usuários em 30s
    { duration: '1m', target: 50 }, // Stay: 50 usuários por 1 min
    { duration: '30s', target: 0 }, // Ramp-down: 50 → 0 usuários em 30s
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% das requisições devem responder em menos de 2s
    http_req_failed: ['rate<0.05'], // Taxa de erro deve ser menor que 5%
    errors: ['rate<0.1'], // Taxa de erros customizados < 10%
  },
};

// URL base da aplicação
const BASE_URL = __ENV.BASE_URL || 'http://localhost:5173';
const API_URL = __ENV.API_URL || 'https://your-project.supabase.co';

export default function () {
  // Teste 1: Carregar página inicial
  let response = http.get(`${BASE_URL}/`);
  check(response, {
    'status is 200': r => r.status === 200,
    'page loads in <2s': r => r.timings.duration < 2000,
  }) || errorRate.add(1);

  sleep(1);

  // Teste 2: Simular login (sem autenticação real)
  response = http.get(`${BASE_URL}/login`);
  check(response, {
    'login page loads': r => r.status === 200,
  }) || errorRate.add(1);

  sleep(2);

  // Teste 3: Dashboard (página principal)
  response = http.get(`${BASE_URL}/dashboard`);
  check(response, {
    'dashboard loads': r => r.status === 200 || r.status === 401, // 401 esperado sem auth
  });

  sleep(1);
}

// Função de teardown (executada uma vez no final)
export function teardown(data) {
  console.log('🏁 Teste de carga finalizado');
}
