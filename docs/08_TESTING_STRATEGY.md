---
title: 'Barber Analytics Pro - Testing Strategy'
author: 'Andrey Viana'
version: '1.0.0'
last_updated: '07/11/2025'
license: 'Proprietary - All Rights Reserved © 2025 Andrey Viana'
---

# 08 - Testing Strategy

Estratégia completa de testes do Barber Analytics Pro: **Vitest** para testes unitários e de integração, **Playwright** para testes E2E.

---

## 📋 Índice

- [Filosofia de Testes](#filosofia-de-testes)
- [Pirâmide de Testes](#pirâmide-de-testes)
- [Vitest - Testes Unitários](#vitest---testes-unitários)
- [Playwright - Testes E2E](#playwright---testes-e2e)
- [Coverage & Reports](#coverage--reports)
- [Mocking Strategy](#mocking-strategy)
- [CI/CD Integration](#cicd-integration)

---

## 🎯 Filosofia de Testes

### Princípios

1. **Test-Driven Development (TDD)**: Escrever testes antes do código
2. **Fast Feedback**: Testes devem rodar rapidamente (<5s para unit tests)
3. **Isolation**: Cada teste é independente e pode rodar sozinho
4. **Deterministic**: Mesmo input sempre gera mesmo output
5. **Readable**: Testes como documentação viva do sistema

### Objetivos de Cobertura

| Camada       | Cobertura Alvo | Prioridade |
| ------------ | -------------- | ---------- |
| Services     | 80%            | 🔴 Alta    |
| Repositories | 70%            | 🔴 Alta    |
| Hooks        | 75%            | 🟡 Média   |
| Components   | 60%            | 🟡 Média   |
| Utils        | 90%            | 🔴 Alta    |
| E2E Flows    | 40%            | 🟢 Baixa   |

---

## 📊 Pirâmide de Testes

```
        ┌─────────┐
        │   E2E   │  10% - Playwright (Fluxos críticos)
        └─────────┘
      ┌─────────────┐
      │ Integration │  20% - Vitest (API + DB)
      └─────────────┘
    ┌─────────────────┐
    │   Unit Tests    │  70% - Vitest (Funções puras)
    └─────────────────┘
```

### Distribuição por Tipo

- **70% Unit Tests**: Funções puras, Services, DTOs, Utils
- **20% Integration Tests**: Hooks + Repositories + Supabase
- **10% E2E Tests**: Fluxos de usuário críticos

---

## 🧪 Vitest - Testes Unitários

### Configuração

**Arquivo:** `vite.config.test.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/',
        'dist/',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 65,
        statements: 70,
      },
    },
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**Setup File:** `src/tests/setup.ts`

```typescript
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest matchers
expect.extend(matchers);

// Cleanup após cada teste
afterEach(() => {
  cleanup();
});

// Mock do Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getSession: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    },
    channel: vi.fn(),
  },
}));

// Mock do localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as any;
```

---

## 📝 Padrões de Teste

### 1. Testes de Services

**Arquivo:** `src/services/__tests__/revenueService.test.js`

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { revenueService } from '../revenueService';
import { revenueRepository } from '@/repositories/revenueRepository';

// Mock do repository
vi.mock('@/repositories/revenueRepository');

describe('revenueService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createRevenue', () => {
    it('deve criar receita com dados válidos', async () => {
      // Arrange
      const input = {
        unit_id: 'unit-123',
        professional_id: 'prof-456',
        value: 150.0,
        date: new Date('2025-11-07'),
        description: 'Corte + Barba',
        category_id: 'servicos',
        payment_method_id: 'pix',
        bank_account_id: 'conta-principal',
      };

      const user = {
        id: 'user-789',
        email: 'barber@example.com',
        role: 'barbeiro',
      };

      const mockRevenue = { id: 'revenue-001', ...input };

      revenueRepository.create.mockResolvedValue({
        data: mockRevenue,
        error: null,
      });

      // Act
      const result = await revenueService.createRevenue(input, user);

      // Assert
      expect(result.data).toEqual(mockRevenue);
      expect(result.error).toBeNull();
      expect(revenueRepository.create).toHaveBeenCalledTimes(1);
      expect(revenueRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          value: 150.0,
          description: 'Corte + Barba',
        })
      );
    });

    it('deve retornar erro quando valor é negativo', async () => {
      // Arrange
      const input = {
        unit_id: 'unit-123',
        professional_id: 'prof-456',
        value: -50.0, // ❌ Valor negativo
        date: new Date(),
        description: 'Teste',
        category_id: 'servicos',
        payment_method_id: 'pix',
        bank_account_id: 'conta',
      };

      const user = { id: 'user-789', role: 'barbeiro' };

      // Act
      const result = await revenueService.createRevenue(input, user);

      // Assert
      expect(result.data).toBeNull();
      expect(result.error).toContain('Valor deve ser maior que zero');
      expect(revenueRepository.create).not.toHaveBeenCalled();
    });

    it('deve retornar erro quando usuário não tem permissão', async () => {
      // Arrange
      const input = {
        unit_id: 'unit-123',
        professional_id: 'prof-456',
        value: 100,
        date: new Date(),
        description: 'Teste',
        category_id: 'servicos',
        payment_method_id: 'pix',
        bank_account_id: 'conta',
      };

      const user = {
        id: 'user-789',
        role: 'recepcionista', // ❌ Sem permissão
      };

      // Act
      const result = await revenueService.createRevenue(input, user);

      // Assert
      expect(result.data).toBeNull();
      expect(result.error).toContain('Sem permissão');
      expect(revenueRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('calculateFees', () => {
    it('deve calcular taxa corretamente', () => {
      // Arrange
      const revenue = {
        value: 100,
        payment_method: { fee: 4 }, // 4%
      };

      // Act
      const fees = revenueService.calculateFees(revenue);

      // Assert
      expect(fees).toEqual({
        grossValue: 100,
        feePercentage: 4,
        feeAmount: 4,
        netValue: 96,
      });
    });

    it('deve retornar valor bruto quando taxa é zero', () => {
      // Arrange
      const revenue = {
        value: 100,
        payment_method: { fee: 0 }, // Sem taxa
      };

      // Act
      const fees = revenueService.calculateFees(revenue);

      // Assert
      expect(fees.netValue).toBe(100);
      expect(fees.feeAmount).toBe(0);
    });
  });
});
```

---

### 2. Testes de Hooks

**Arquivo:** `src/hooks/__tests__/useRevenues.test.jsx`

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRevenues } from '../useRevenues';
import { revenueService } from '@/services/revenueService';

// Mock do service
vi.mock('@/services/revenueService');

// Wrapper para TanStack Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useRevenues', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve buscar receitas com sucesso', async () => {
    // Arrange
    const mockRevenues = [
      { id: '1', value: 100, description: 'Corte' },
      { id: '2', value: 150, description: 'Barba' },
    ];

    revenueService.findByPeriod.mockResolvedValue({
      data: mockRevenues,
      error: null,
    });

    // Act
    const { result } = renderHook(() => useRevenues('unit-123'), {
      wrapper: createWrapper(),
    });

    // Assert
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockRevenues);
    expect(result.current.error).toBeNull();
  });

  it('deve tratar erro na busca', async () => {
    // Arrange
    revenueService.findByPeriod.mockResolvedValue({
      data: null,
      error: 'Erro ao buscar receitas',
    });

    // Act
    const { result } = renderHook(() => useRevenues('unit-123'), {
      wrapper: createWrapper(),
    });

    // Assert
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeTruthy();
  });

  it('deve refetch quando chamado', async () => {
    // Arrange
    const mockRevenues = [{ id: '1', value: 100 }];

    revenueService.findByPeriod.mockResolvedValue({
      data: mockRevenues,
      error: null,
    });

    // Act
    const { result } = renderHook(() => useRevenues('unit-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    revenueService.findByPeriod.mockClear();

    result.current.refetch();

    // Assert
    await waitFor(() => {
      expect(revenueService.findByPeriod).toHaveBeenCalledTimes(1);
    });
  });
});
```

---

### 3. Testes de Componentes

**Arquivo:** `src/molecules/__tests__/KPICard.test.jsx`

```javascript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KPICard } from '../KPICard';

describe('KPICard', () => {
  it('deve renderizar título e valor', () => {
    // Act
    render(<KPICard title="Receita Total" value="R$ 10.000,00" />);

    // Assert
    expect(screen.getByText('Receita Total')).toBeInTheDocument();
    expect(screen.getByText('R$ 10.000,00')).toBeInTheDocument();
  });

  it('deve exibir trend positivo', () => {
    // Act
    render(<KPICard title="Lucro" value="R$ 5.000,00" trend={15} />);

    // Assert
    expect(screen.getByText('+15%')).toBeInTheDocument();
    expect(screen.getByText('+15%')).toHaveClass('text-feedback-light-success');
  });

  it('deve exibir trend negativo', () => {
    // Act
    render(<KPICard title="Despesas" value="R$ 3.000,00" trend={-5} />);

    // Assert
    expect(screen.getByText('-5%')).toBeInTheDocument();
    expect(screen.getByText('-5%')).toHaveClass('text-feedback-light-error');
  });

  it('deve renderizar ícone customizado', () => {
    // Arrange
    const CustomIcon = () => <svg data-testid="custom-icon" />;

    // Act
    render(<KPICard title="Teste" value="100" icon={CustomIcon} />);

    // Assert
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });
});
```

---

### 4. Testes de DTOs

**Arquivo:** `src/dtos/__tests__/CreateRevenueDTO.test.js`

```javascript
import { describe, it, expect } from 'vitest';
import { CreateRevenueDTO } from '../CreateRevenueDTO';

describe('CreateRevenueDTO', () => {
  const validInput = {
    unit_id: 'unit-123',
    professional_id: 'prof-456',
    value: 150.0,
    date: new Date('2025-11-07'),
    description: 'Corte + Barba',
    category_id: 'servicos',
    payment_method_id: 'pix',
    bank_account_id: 'conta',
  };

  it('deve validar dados corretos', () => {
    // Arrange
    const dto = new CreateRevenueDTO(validInput);

    // Act
    const validation = dto.validate();

    // Assert
    expect(validation.isValid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('deve rejeitar valor negativo', () => {
    // Arrange
    const dto = new CreateRevenueDTO({
      ...validInput,
      value: -50,
    });

    // Act
    const validation = dto.validate();

    // Assert
    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContain('Valor deve ser maior que zero');
  });

  it('deve rejeitar data futura', () => {
    // Arrange
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);

    const dto = new CreateRevenueDTO({
      ...validInput,
      date: futureDate,
    });

    // Act
    const validation = dto.validate();

    // Assert
    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContain('Data não pode ser futura');
  });

  it('deve definir competence_date como date quando ausente', () => {
    // Arrange
    const input = { ...validInput };
    delete input.competence_date;

    // Act
    const dto = new CreateRevenueDTO(input);

    // Assert
    expect(dto.competence_date).toEqual(dto.date);
  });

  it('deve converter para objeto corretamente', () => {
    // Arrange
    const dto = new CreateRevenueDTO(validInput);

    // Act
    const obj = dto.toObject();

    // Assert
    expect(obj).toHaveProperty('unit_id', 'unit-123');
    expect(obj).toHaveProperty('value', 150.0);
    expect(obj).toHaveProperty('status', 'PENDING');
    expect(obj).toHaveProperty('is_active', true);
  });
});
```

---

### 5. Testes de Utils

**Arquivo:** `src/utils/__tests__/formatters.test.js`

```javascript
import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatDate,
  formatCPF,
  formatPhone,
} from '../formatters';

describe('formatCurrency', () => {
  it('deve formatar número positivo', () => {
    expect(formatCurrency(1234.56)).toBe('R$ 1.234,56');
  });

  it('deve formatar número negativo', () => {
    expect(formatCurrency(-500)).toBe('-R$ 500,00');
  });

  it('deve formatar zero', () => {
    expect(formatCurrency(0)).toBe('R$ 0,00');
  });
});

describe('formatDate', () => {
  it('deve formatar data padrão', () => {
    const date = new Date('2025-11-07');
    expect(formatDate(date)).toBe('07/11/2025');
  });

  it('deve formatar ISO', () => {
    const date = new Date('2025-11-07');
    expect(formatDate(date, 'yyyy-MM-dd')).toBe('2025-11-07');
  });

  it('deve incluir hora quando solicitado', () => {
    const date = new Date('2025-11-07T14:30:00');
    expect(formatDate(date, 'dd/MM/yyyy HH:mm')).toBe('07/11/2025 14:30');
  });
});

describe('formatCPF', () => {
  it('deve formatar CPF válido', () => {
    expect(formatCPF('12345678900')).toBe('123.456.789-00');
  });

  it('deve retornar vazio para input inválido', () => {
    expect(formatCPF('123')).toBe('');
  });
});

describe('formatPhone', () => {
  it('deve formatar celular', () => {
    expect(formatPhone('11987654321')).toBe('(11) 98765-4321');
  });

  it('deve formatar fixo', () => {
    expect(formatPhone('1138765432')).toBe('(11) 3876-5432');
  });
});
```

---

## 🎭 Playwright - Testes E2E

### Configuração

**Arquivo:** `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['junit', { outputFile: 'playwright-report/junit.xml' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
  ],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile',
      use: { ...devices['iPhone 13'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

### Page Object Pattern

**Arquivo:** `e2e/pages/LoginPage.ts`

```typescript
import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel('E-mail');
    this.passwordInput = page.getByLabel('Senha');
    this.submitButton = page.getByRole('button', { name: 'Entrar' });
    this.errorMessage = page.getByTestId('error-message');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async expectErrorMessage(message: string) {
    await this.errorMessage.waitFor({ state: 'visible' });
    await this.page.waitForSelector(`text=${message}`);
  }
}
```

---

### Testes E2E - Fluxos Críticos

**Arquivo:** `e2e/financial-flow.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { RevenuePage } from './pages/RevenuePage';

test.describe('Fluxo Financeiro Completo', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;
  let revenuePage: RevenuePage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    revenuePage = new RevenuePage(page);

    // Login
    await loginPage.goto();
    await loginPage.login('barber@example.com', 'senha123');
    await expect(page).toHaveURL('/dashboard');
  });

  test('deve criar receita e visualizar no fluxo de caixa', async ({
    page,
  }) => {
    // 1. Ir para página de receitas
    await dashboardPage.navigateToRevenues();
    await expect(page).toHaveURL('/receitas');

    // 2. Criar nova receita
    await revenuePage.clickNewRevenue();
    await revenuePage.fillRevenueForm({
      value: '150.00',
      description: 'Corte + Barba',
      category: 'Serviços',
      paymentMethod: 'PIX',
      bankAccount: 'Conta Principal',
    });
    await revenuePage.submitForm();

    // 3. Verificar toast de sucesso
    await expect(page.getByText('Receita criada com sucesso')).toBeVisible();

    // 4. Verificar receita na lista
    await expect(page.getByText('Corte + Barba')).toBeVisible();
    await expect(page.getByText('R$ 150,00')).toBeVisible();

    // 5. Navegar para fluxo de caixa
    await dashboardPage.navigateToCashflow();
    await expect(page).toHaveURL('/fluxo-caixa');

    // 6. Verificar receita aparece no fluxo
    await expect(page.getByText('R$ 150,00')).toBeVisible();
  });

  test('deve calcular DRE corretamente', async ({ page }) => {
    // 1. Navegar para relatórios
    await dashboardPage.navigateToReports();
    await expect(page).toHaveURL('/relatorios');

    // 2. Selecionar período
    await page.getByLabel('Data Inicial').fill('2025-11-01');
    await page.getByLabel('Data Final').fill('2025-11-30');
    await page.getByRole('button', { name: 'Gerar DRE' }).click();

    // 3. Aguardar cálculo
    await page.waitForSelector('[data-testid="dre-result"]');

    // 4. Verificar estrutura do DRE
    await expect(page.getByText('Receita Bruta')).toBeVisible();
    await expect(page.getByText('Receita Líquida')).toBeVisible();
    await expect(page.getByText('Lucro Operacional')).toBeVisible();
    await expect(page.getByText('Margem %')).toBeVisible();
  });

  test('deve exportar relatório para PDF', async ({ page }) => {
    // 1. Ir para fluxo de caixa
    await dashboardPage.navigateToCashflow();

    // 2. Configurar período
    await page.getByLabel('Mês').selectOption('11');
    await page.getByLabel('Ano').fill('2025');

    // 3. Clicar em exportar
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Exportar PDF' }).click();
    const download = await downloadPromise;

    // 4. Verificar arquivo baixado
    expect(download.suggestedFilename()).toContain('fluxo-caixa');
    expect(download.suggestedFilename()).toContain('.pdf');
  });
});
```

---

## 📊 Coverage & Reports

### Executar Coverage

```bash
# Coverage completo
pnpm test:coverage

# Coverage de um arquivo específico
pnpm vitest run src/services/revenueService.test.js --coverage

# Coverage com UI
pnpm vitest --ui --coverage
```

### Relatório HTML

```bash
# Gerar relatório HTML
pnpm test:coverage

# Abrir relatório
open coverage/index.html
```

### Badge de Coverage

```markdown
![Coverage](https://img.shields.io/badge/coverage-78%25-brightgreen)
```

### Thresholds no CI/CD

```json
{
  "coverage": {
    "thresholds": {
      "lines": 70,
      "functions": 70,
      "branches": 65,
      "statements": 70
    }
  }
}
```

---

## 🎭 Mocking Strategy

### Mock do Supabase Client

**Arquivo:** `src/tests/mocks/supabase.ts`

```typescript
import { vi } from 'vitest';

export const createSupabaseMock = () => {
  const mockSelect = vi.fn().mockReturnThis();
  const mockInsert = vi.fn().mockReturnThis();
  const mockUpdate = vi.fn().mockReturnThis();
  const mockDelete = vi.fn().mockReturnThis();
  const mockEq = vi.fn().mockReturnThis();
  const mockSingle = vi.fn();
  const mockOrder = vi.fn().mockReturnThis();
  const mockLimit = vi.fn().mockReturnThis();

  return {
    from: vi.fn(() => ({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
      eq: mockEq,
      single: mockSingle,
      order: mockOrder,
      limit: mockLimit,
    })),
    auth: {
      getSession: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    })),
  };
};
```

### Fixture Data

**Arquivo:** `src/tests/fixtures/revenues.ts`

```typescript
export const mockRevenue = {
  id: 'revenue-001',
  unit_id: 'unit-123',
  professional_id: 'prof-456',
  value: 150.0,
  date: '2025-11-07',
  competence_date: '2025-11-07',
  description: 'Corte + Barba',
  category_id: 'servicos',
  payment_method_id: 'pix',
  bank_account_id: 'conta-principal',
  status: 'PENDING',
  is_active: true,
  created_at: '2025-11-07T10:00:00Z',
  updated_at: '2025-11-07T10:00:00Z',
};

export const mockRevenueList = [
  mockRevenue,
  {
    ...mockRevenue,
    id: 'revenue-002',
    value: 200.0,
    description: 'Corte Premium',
  },
];
```

---

## 🔄 CI/CD Integration

### GitHub Actions Workflow

**Arquivo:** `.github/workflows/test.yml`

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run unit tests
        run: pnpm test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Install Playwright
        run: pnpm exec playwright install --with-deps

      - name: Run E2E tests
        run: pnpm test:e2e
        env:
          VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}

      - name: Upload Playwright Report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 🎯 Comandos Úteis

```bash
# Vitest
pnpm test                    # Rodar todos os testes
pnpm test:watch              # Watch mode
pnpm test:ui                 # Interface visual
pnpm test:coverage           # Com coverage

# Playwright
pnpm test:e2e                # Rodar E2E headless
pnpm test:e2e:ui             # Playwright UI mode
pnpm test:e2e:debug          # Debug mode
pnpm test:e2e:report         # Ver último relatório

# CI/CD
pnpm test:ci                 # Rodar todos (unit + E2E)
```

---

## 🔗 Navegação

- [← 06 - API Reference](./06_API_REFERENCE.md)
- [→ 09 - Deployment Guide](./09_DEPLOYMENT_GUIDE.md)
- [📚 Documentação](./DOCUMENTACAO_INDEX.md)

---

## 📖 Referências

1. **Vitest Documentation**. https://vitest.dev/
2. **Playwright Documentation**. https://playwright.dev/
3. **Testing Library**. https://testing-library.com/
4. **Kent C. Dodds**. "Testing JavaScript" (2020)

---

**Última atualização:** 7 de novembro de 2025
**Versão:** 1.0.0
**Autor:** Andrey Viana
