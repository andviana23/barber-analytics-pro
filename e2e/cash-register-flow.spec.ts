import { test, expect } from '@playwright/test';

/**
 * E2E Tests - Cash Register Flow
 *
 * Testes de fluxo completo para abertura e fechamento de caixa
 * com controle de acesso por perfil (Recepcionista, Gerente, Admin, Profissional)
 */

// Fixtures de dados de teste
const testUsers = {
  recepcionista: {
    email: process.env.E2E_RECEPCIONISTA_EMAIL || 'recepcionista@test.com',
    password: process.env.E2E_RECEPCIONISTA_PASSWORD || 'senha123',
    role: 'recepcionista',
  },
  gerente: {
    email: process.env.E2E_GERENTE_EMAIL || 'gerente@test.com',
    password: process.env.E2E_GERENTE_PASSWORD || 'senha123',
    role: 'gerente',
  },
  profissional: {
    email: process.env.E2E_PROFISSIONAL_EMAIL || 'profissional@test.com',
    password: process.env.E2E_PROFISSIONAL_PASSWORD || 'senha123',
    role: 'profissional',
  },
  admin: {
    email: process.env.E2E_ADMIN_EMAIL || 'admin@test.com',
    password: process.env.E2E_ADMIN_PASSWORD || 'senha123',
    role: 'admin',
  },
};

const cashRegisterData = {
  openingBalance: 500.0,
  closingBalance: 1234.56,
  observations: 'Teste E2E - Abertura de caixa',
  closingObservations: 'Teste E2E - Fechamento de caixa',
};

test.describe('Cash Register - Fluxo de Caixa', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    // Garante que estamos na página inicial
    await page.goto('/');
  });

  test('Recepcionista abre caixa com sucesso', async ({ page }) => {
    // Login como recepcionista
    await page.goto('/login');
    await page.fill('input[name="email"]', testUsers.recepcionista.email);
    await page.fill('input[name="password"]', testUsers.recepcionista.password);

    // Aguarda a requisição de autenticação antes de clicar
    const authPromise = page
      .waitForResponse(
        response =>
          response.url().includes('/auth/v1/token') &&
          response.status() === 200,
        { timeout: 10000 }
      )
      .catch(() => null);

    await page.click('button[type="submit"]');

    // Aguarda autenticação completar
    await authPromise;

    // Aguarda redirecionamento após login
    await Promise.race([
      page.waitForURL(/\/(dashboard|home|caixa)/, { timeout: 10000 }),
      page.waitForSelector('nav, [data-authenticated="true"]', {
        timeout: 10000,
      }),
    ]).catch(() => page.waitForTimeout(2000));

    // Navega para página de caixa
    await page.goto('/caixa');
    await page.waitForLoadState('networkidle');

    // Verifica que o botão "Abrir Caixa" está visível
    const openCashButton = page.locator('button:has-text("Abrir Caixa")');
    await expect(openCashButton).toBeVisible();

    // Clica no botão para abrir modal
    await openCashButton.click();

    // Aguarda o modal aparecer
    const modal = page.locator('[role="dialog"], .modal');
    await expect(modal).toBeVisible();

    // Preenche o formulário de abertura
    await page.fill(
      'input[name="openingBalance"], input[placeholder*="saldo"]',
      cashRegisterData.openingBalance.toString()
    );

    await page.fill(
      'textarea[name="observations"], textarea[placeholder*="observ"]',
      cashRegisterData.observations
    );

    // Submete o formulário
    await page.click('button:has-text("Confirmar"), button:has-text("Abrir")');

    // Aguarda feedback de sucesso
    await expect(page.locator('text=/caixa.*aberto.*sucesso/i')).toBeVisible({
      timeout: 10000,
    });

    // Verifica que o status mudou para "Aberto"
    await expect(
      page.locator('text=/status.*aberto/i, [data-status="open"]')
    ).toBeVisible();

    // Verifica que o botão "Fechar Caixa" agora está visível
    await expect(page.locator('button:has-text("Fechar Caixa")')).toBeVisible();
  });

  test('Profissional tenta abrir caixa - botão não aparece', async ({
    page,
  }) => {
    // Login como profissional
    await page.goto('/login');
    await page.fill('input[name="email"]', testUsers.profissional.email);
    await page.fill('input[name="password"]', testUsers.profissional.password);
    await page.click('button[type="submit"]');

    // Aguarda redirecionamento
    await page.waitForURL(/\/(dashboard|home)/);

    // Tenta navegar para página de caixa
    await page.goto('/caixa');
    await page.waitForLoadState('networkidle');

    // Verifica que o botão "Abrir Caixa" NÃO está visível
    const openCashButton = page.locator('button:has-text("Abrir Caixa")');
    await expect(openCashButton).not.toBeVisible();

    // Verifica que há uma mensagem de acesso restrito ou página vazia
    const accessDenied = page.locator('text=/acesso.*restrito|sem.*permiss/i');
    const noData = page.locator('text=/nenhum.*caixa|sem.*dados/i');

    // Pelo menos uma das mensagens deve estar visível
    await expect(accessDenied.or(noData)).toBeVisible();
  });

  test('Recepcionista fecha caixa e vê relatório', async ({ page }) => {
    // Login como recepcionista
    await page.goto('/login');
    await page.fill('input[name="email"]', testUsers.recepcionista.email);
    await page.fill('input[name="password"]', testUsers.recepcionista.password);
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/(dashboard|home)/);

    // Navega para página de caixa
    await page.goto('/caixa');
    await page.waitForLoadState('networkidle');

    // Verifica que existe um caixa aberto
    await expect(
      page.locator('text=/status.*aberto/i, [data-status="open"]')
    ).toBeVisible();

    // Clica no botão "Fechar Caixa"
    const closeCashButton = page.locator('button:has-text("Fechar Caixa")');
    await expect(closeCashButton).toBeVisible();
    await closeCashButton.click();

    // Aguarda o modal de fechamento
    const modal = page.locator('[role="dialog"], .modal');
    await expect(modal).toBeVisible();

    // Verifica que o saldo esperado está sendo exibido
    await expect(page.locator('text=/saldo.*esperado/i')).toBeVisible();

    // Preenche o saldo de fechamento
    await page.fill(
      'input[name="closingBalance"], input[placeholder*="saldo"]',
      cashRegisterData.closingBalance.toString()
    );

    // Preenche observações
    await page.fill(
      'textarea[name="observations"], textarea[placeholder*="observ"]',
      cashRegisterData.closingObservations
    );

    // Confirma o fechamento
    await page.click('button:has-text("Confirmar"), button:has-text("Fechar")');

    // Aguarda feedback de sucesso
    await expect(page.locator('text=/caixa.*fechado.*sucesso/i')).toBeVisible({
      timeout: 10000,
    });

    // Verifica que o relatório ou resumo é exibido
    const reportVisible = page.locator(
      'text=/relatório|resumo|total.*receitas|total.*despesas/i'
    );
    await expect(reportVisible.first()).toBeVisible({ timeout: 5000 });

    // Verifica que os valores são exibidos
    await expect(
      page.locator(`text=/${cashRegisterData.openingBalance}/`)
    ).toBeVisible();

    // Verifica que o status mudou para "Fechado"
    await expect(
      page.locator('text=/status.*fechado/i, [data-status="closed"]')
    ).toBeVisible();
  });

  test('Gerente tem acesso completo ao caixa', async ({ page }) => {
    // Login como gerente
    await page.goto('/login');
    await page.fill('input[name="email"]', testUsers.gerente.email);
    await page.fill('input[name="password"]', testUsers.gerente.password);
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/(dashboard|home)/);

    // Navega para página de caixa
    await page.goto('/caixa');
    await page.waitForLoadState('networkidle');

    // Verifica que o botão "Abrir Caixa" está visível para gerente
    const openCashButton = page.locator('button:has-text("Abrir Caixa")');
    await expect(openCashButton).toBeVisible();

    // Verifica que pode visualizar histórico
    const history = page.locator('text=/histórico|caixas.*anteriores/i');
    await expect(history.first()).toBeVisible();

    // Verifica que pode acessar relatórios
    const reports = page.locator(
      'button:has-text("Relatório"), a:has-text("Relatório")'
    );
    if ((await reports.count()) > 0) {
      await expect(reports.first()).toBeVisible();
    }
  });

  test('Admin tem acesso completo ao caixa', async ({ page }) => {
    // Login como admin
    await page.goto('/login');
    await page.fill('input[name="email"]', testUsers.admin.email);
    await page.fill('input[name="password"]', testUsers.admin.password);
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/(dashboard|home)/);

    // Navega para página de caixa
    await page.goto('/caixa');
    await page.waitForLoadState('networkidle');

    // Verifica que o botão "Abrir Caixa" está visível para admin
    const openCashButton = page.locator('button:has-text("Abrir Caixa")');
    await expect(openCashButton).toBeVisible();

    // Verifica acesso total aos recursos
    await expect(
      page.locator('text=/histórico|filtros|relatórios/i').first()
    ).toBeVisible();
  });

  test('Validação: não permite abrir dois caixas simultaneamente', async ({
    page,
  }) => {
    // Login como recepcionista
    await page.goto('/login');
    await page.fill('input[name="email"]', testUsers.recepcionista.email);
    await page.fill('input[name="password"]', testUsers.recepcionista.password);
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/(dashboard|home)/);

    // Navega para página de caixa
    await page.goto('/caixa');
    await page.waitForLoadState('networkidle');

    // Se já existe um caixa aberto, o botão "Abrir Caixa" não deve estar disponível
    const cashStatus = await page
      .locator('text=/status.*aberto/i, [data-status="open"]')
      .count();

    if (cashStatus > 0) {
      // Verifica que o botão "Abrir Caixa" está desabilitado ou oculto
      const openCashButton = page.locator('button:has-text("Abrir Caixa")');
      const isDisabled = await openCashButton.getAttribute('disabled');
      const isVisible = await openCashButton.isVisible();

      expect(isDisabled !== null || !isVisible).toBeTruthy();
    }
  });

  test('Histórico de caixas é exibido corretamente', async ({ page }) => {
    // Login como gerente
    await page.goto('/login');
    await page.fill('input[name="email"]', testUsers.gerente.email);
    await page.fill('input[name="password"]', testUsers.gerente.password);
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/(dashboard|home)/);

    // Navega para página de caixa
    await page.goto('/caixa');
    await page.waitForLoadState('networkidle');

    // Verifica que o histórico é exibido
    const historySection = page
      .locator('text=/histórico|caixas.*anteriores/i')
      .first();
    await expect(historySection).toBeVisible();

    // Verifica que há registros na tabela/lista
    const cashRecords = page.locator(
      'table tbody tr, [data-testid="cash-register-item"]'
    );

    if ((await cashRecords.count()) > 0) {
      // Verifica que as colunas essenciais estão presentes
      await expect(
        page.locator('text=/data|abertura|fechamento/i').first()
      ).toBeVisible();
      await expect(page.locator('text=/saldo|valor/i').first()).toBeVisible();
      await expect(page.locator('text=/status/i').first()).toBeVisible();
    }
  });
});
