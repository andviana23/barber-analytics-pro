/**
 * Configuração global para testes
 * Vitest + Supertest
 */

import { afterEach, beforeAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup após cada teste
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock do Supabase Client
vi.mock('@/services/supabase', () => {
  const mockQuery = {
    select: vi.fn(function () {
      return this;
    }),
    insert: vi.fn(function () {
      return this;
    }),
    update: vi.fn(function () {
      return this;
    }),
    delete: vi.fn(function () {
      return this;
    }),
    eq: vi.fn(function () {
      return this;
    }),
    gte: vi.fn(function () {
      return this;
    }),
    lte: vi.fn(function () {
      return this;
    }),
    order: vi.fn(function () {
      return this;
    }),
    range: vi.fn(function () {
      return this;
    }),
    single: vi.fn(),
    maybeSingle: vi.fn(),
  };

  return {
    supabase: {
      from: vi.fn(() => mockQuery),
      rpc: vi.fn(),
      auth: {
        getSession: vi.fn(),
        signOut: vi.fn(),
      },
      channel: vi.fn(() => ({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn(),
      })),
    },
  };
});

// Mock de localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

global.localStorage = localStorageMock as any;

// Mock de console para testes limpos
global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn(),
};

// Setup de variáveis de ambiente para testes
process.env.NEXT_PUBLIC_SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-role-key';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key';

// Setup antes de todos os testes
beforeAll(() => {
  console.log('🧪 Iniciando testes com Vitest + Supertest');
});
