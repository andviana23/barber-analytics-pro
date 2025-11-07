/**
 * K6 Stress Testing Configuration
 * Testa os limites do sistema com carga gradual
 *
 * Executar com: k6 run tests/load/stress-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp-up: 0 → 100 usuários
    { duration: '5m', target: 100 }, // Stay: 100 usuários
    { duration: '2m', target: 200 }, // Spike: 100 → 200 usuários
    { duration: '5m', target: 200 }, // Stay: 200 usuários
    { duration: '2m', target: 0 }, // Ramp-down: 200 → 0
  ],
  thresholds: {
    http_req_duration: ['p(99)<5000'], // 99% devem responder em < 5s
    http_req_failed: ['rate<0.1'], // Máximo 10% de falha
  },
};

const BASE_URL = 'http://localhost:5173';

export default function () {
  const responses = http.batch([
    ['GET', `${BASE_URL}/`],
    ['GET', `${BASE_URL}/dashboard`],
    ['GET', `${BASE_URL}/relatorios`],
  ]);

  check(responses[0], {
    'homepage status 200': r => r.status === 200,
  });

  sleep(1);
}
