import { test, expect } from '@playwright/test';

/**
 * Testes E2E - Fluxo Completo de Comandas
 *
 * Cobre o ciclo de vida completo de uma comanda:
 * - Criação
 * - Adição de itens
 * - Aplicação de descontos/taxas
 * - Fechamento com pagamento
 * - Visualização no histórico
 */

test.describe('Fluxo Completo de Comandas', () => {
  let orderId;

  test.beforeEach(async ({ page }) => {
    // Login antes de cada teste
    await page.goto('/login');

    await page.fill('[name="email"]', 'gerente@test.com');
    await page.fill('[name="password"]', 'senha123');
    await page.click('button[type="submit"]');

    // Aguardar redirecionamento para dashboard
    await page.waitForURL('/dashboard');
    expect(page.url()).toContain('/dashboard');
  });

  test('deve criar uma nova comanda com sucesso', async ({ page }) => {
    // Navegar para página de comandas
    await page.goto('/comandas');

    // Clicar no botão "Nova Comanda"
    await page.click('button:has-text("Nova Comanda")');

    // Aguardar modal abrir
    await page.waitForSelector('[role="dialog"]');

    // Selecionar cliente
    await page.selectOption('[name="clientId"]', { index: 1 });

    // Adicionar serviço
    await page.click('button:has-text("Adicionar Item")');
    await page.selectOption('[name="serviceId"]', { index: 1 });
    await page.selectOption('[name="professionalId"]', { index: 1 });

    // Salvar comanda
    await page.click('button:has-text("Salvar")');

    // Validar toast de sucesso
    await expect(page.locator('.toast-success')).toBeVisible();
    await expect(page.locator('.toast-success')).toContainText(
      'Comanda criada com sucesso'
    );

    // Validar que comanda aparece na lista
    await expect(
      page.locator('[data-testid="order-card"]').first()
    ).toBeVisible();

    // Capturar ID da comanda para testes seguintes
    const orderCard = page.locator('[data-testid="order-card"]').first();
    orderId = await orderCard.getAttribute('data-order-id');
  });

  test('deve adicionar desconto em uma comanda', async ({ page }) => {
    // Criar comanda primeiro
    await page.goto('/comandas');
    await page.click('button:has-text("Nova Comanda")');
    await page.waitForSelector('[role="dialog"]');
    await page.selectOption('[name="clientId"]', { index: 1 });
    await page.click('button:has-text("Adicionar Item")');
    await page.selectOption('[name="serviceId"]', { index: 1 });
    await page.click('button:has-text("Salvar")');
    await page.waitForSelector('.toast-success');

    // Abrir menu de ações da comanda
    await page.click('[data-testid="order-actions-menu"]');

    // Clicar em "Aplicar Desconto"
    await page.click('button:has-text("Aplicar Desconto")');

    // Aguardar modal de desconto
    await page.waitForSelector('[data-testid="discount-modal"]');

    // Selecionar tipo percentual
    await page.check('input[value="percentage"]');

    // Informar valor
    await page.fill('[name="discountValue"]', '10');

    // Informar motivo
    await page.fill('[name="reason"]', 'Desconto de cliente fidelidade');

    // Aplicar desconto
    await page.click('button:has-text("Aplicar Desconto")');

    // Validar toast de sucesso
    await expect(page.locator('.toast-success')).toBeVisible();
    await expect(page.locator('.toast-success')).toContainText(
      'Desconto aplicado com sucesso'
    );

    // Validar badge de desconto na comanda
    await expect(page.locator('[data-testid="discount-badge"]')).toBeVisible();
  });

  test('deve fechar uma comanda com pagamento', async ({ page }) => {
    // Criar comanda
    await page.goto('/comandas');
    await page.click('button:has-text("Nova Comanda")');
    await page.waitForSelector('[role="dialog"]');
    await page.selectOption('[name="clientId"]', { index: 1 });
    await page.click('button:has-text("Adicionar Item")');
    await page.selectOption('[name="serviceId"]', { index: 1 });
    await page.click('button:has-text("Salvar")');
    await page.waitForSelector('.toast-success');

    // Abrir modal de pagamento
    await page.click('[data-testid="close-order-button"]');

    // Aguardar modal de pagamento
    await page.waitForSelector('[data-testid="payment-modal"]');

    // Selecionar forma de pagamento
    await page.selectOption('[name="paymentMethodId"]', { index: 1 });

    // Selecionar conta de destino
    await page.selectOption('[name="accountId"]', { index: 1 });

    // Confirmar pagamento
    await page.click('button:has-text("Finalizar Venda")');

    // Validar toast de sucesso
    await expect(page.locator('.toast-success')).toBeVisible();
    await expect(page.locator('.toast-success')).toContainText(
      'Comanda fechada com sucesso'
    );

    // Validar que comanda foi removida da lista de abertas
    await expect(page.locator('[data-testid="order-card"]')).toHaveCount(0);
  });

  test('deve visualizar comanda no histórico após fechamento', async ({
    page,
  }) => {
    // Criar e fechar comanda
    await page.goto('/comandas');
    await page.click('button:has-text("Nova Comanda")');
    await page.waitForSelector('[role="dialog"]');
    await page.selectOption('[name="clientId"]', { index: 1 });
    await page.click('button:has-text("Adicionar Item")');
    await page.selectOption('[name="serviceId"]', { index: 1 });
    await page.click('button:has-text("Salvar")');
    await page.waitForSelector('.toast-success');

    await page.click('[data-testid="close-order-button"]');
    await page.waitForSelector('[data-testid="payment-modal"]');
    await page.selectOption('[name="paymentMethodId"]', { index: 1 });
    await page.selectOption('[name="accountId"]', { index: 1 });
    await page.click('button:has-text("Finalizar Venda")');
    await page.waitForSelector('.toast-success');

    // Navegar para histórico
    await page.goto('/comandas/historico');

    // Validar que comanda aparece no histórico
    await expect(
      page.locator('[data-testid="order-history-card"]').first()
    ).toBeVisible();

    // Validar badge de status "Fechada"
    await expect(
      page.locator('[data-testid="status-badge"]:has-text("Fechada")')
    ).toBeVisible();
  });

  test('deve cancelar uma comanda aberta', async ({ page }) => {
    // Criar comanda
    await page.goto('/comandas');
    await page.click('button:has-text("Nova Comanda")');
    await page.waitForSelector('[role="dialog"]');
    await page.selectOption('[name="clientId"]', { index: 1 });
    await page.click('button:has-text("Adicionar Item")');
    await page.selectOption('[name="serviceId"]', { index: 1 });
    await page.click('button:has-text("Salvar")');
    await page.waitForSelector('.toast-success');

    // Abrir menu de ações
    await page.click('[data-testid="order-actions-menu"]');

    // Clicar em cancelar
    await page.click('button:has-text("Cancelar Comanda")');

    // Confirmar cancelamento no modal de confirmação
    await page.waitForSelector('[role="alertdialog"]');
    await page.click('button:has-text("Confirmar")');

    // Validar toast
    await expect(page.locator('.toast-success')).toBeVisible();
    await expect(page.locator('.toast-success')).toContainText(
      'Comanda cancelada'
    );

    // Validar que comanda foi removida
    await expect(page.locator('[data-testid="order-card"]')).toHaveCount(0);
  });

  test('deve filtrar comandas no histórico por período', async ({ page }) => {
    // Navegar para histórico
    await page.goto('/comandas/historico');

    // Preencher filtro de data
    const today = new Date().toISOString().split('T')[0];
    await page.fill('[name="startDate"]', today);
    await page.fill('[name="endDate"]', today);

    // Aguardar resultados filtrados
    await page.waitForTimeout(1000);

    // Validar que apenas comandas de hoje aparecem
    const orderCards = page.locator('[data-testid="order-history-card"]');
    const count = await orderCards.count();

    for (let i = 0; i < count; i++) {
      const dateText = await orderCards
        .nth(i)
        .locator('[data-testid="order-date"]')
        .textContent();
      expect(dateText).toContain(today);
    }
  });

  test('deve exportar histórico para CSV', async ({ page }) => {
    // Navegar para histórico
    await page.goto('/comandas/historico');

    // Configurar listener para download
    const downloadPromise = page.waitForEvent('download');

    // Clicar no botão exportar
    await page.click('button:has-text("Exportar CSV")');

    // Aguardar download
    const download = await downloadPromise;

    // Validar nome do arquivo
    expect(download.suggestedFilename()).toMatch(/historico-comandas-.*\.csv/);

    // Validar toast de sucesso
    await expect(page.locator('.toast-success')).toBeVisible();
    await expect(page.locator('.toast-success')).toContainText(
      'Histórico exportado'
    );
  });

  test('deve receber notificação em tempo real quando nova comanda é criada', async ({
    page,
    context,
  }) => {
    // Abrir duas abas
    const page1 = page;
    const page2 = await context.newPage();

    // Login em ambas
    await page1.goto('/comandas');
    await page2.goto('/login');
    await page2.fill('[name="email"]', 'gerente@barber.com');
    await page2.fill('[name="password"]', 'senha123');
    await page2.click('button[type="submit"]');
    await page2.goto('/comandas');

    // Criar comanda na primeira aba
    await page1.click('button:has-text("Nova Comanda")');
    await page1.waitForSelector('[role="dialog"]');
    await page1.selectOption('[name="clientId"]', { index: 1 });
    await page1.click('button:has-text("Adicionar Item")');
    await page1.selectOption('[name="serviceId"]', { index: 1 });
    await page1.click('button:has-text("Salvar")');

    // Validar que notificação aparece na segunda aba
    await expect(
      page2.locator('.toast:has-text("Nova comanda criada")')
    ).toBeVisible({ timeout: 5000 });

    // Validar que comanda aparece automaticamente na lista da segunda aba
    await expect(page2.locator('[data-testid="order-card"]')).toHaveCount(1);
  });

  test('deve validar acessibilidade dos componentes principais', async ({
    page,
  }) => {
    await page.goto('/comandas');

    // Validar landmarks ARIA
    await expect(page.locator('[role="main"]')).toBeVisible();
    await expect(page.locator('[role="navigation"]')).toBeVisible();

    // Validar labels em inputs
    const inputs = page.locator('input');
    const count = await inputs.count();

    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const ariaLabel = await input.getAttribute('aria-label');
      const associatedLabel = await input.evaluate(el => {
        const id = el.id;
        return id
          ? document.querySelector(`label[for="${id}"]`) !== null
          : false;
      });

      expect(ariaLabel || associatedLabel).toBeTruthy();
    }

    // Validar contraste de botões (simulado)
    const buttons = page.locator('button');
    await expect(buttons.first()).toHaveCSS('color', expect.any(String));
    await expect(buttons.first()).toHaveCSS(
      'background-color',
      expect.any(String)
    );
  });

  test('deve carregar página de comandas em menos de 2 segundos', async ({
    page,
  }) => {
    const startTime = Date.now();

    await page.goto('/comandas');
    await page.waitForSelector('[data-testid="orders-page"]');

    const endTime = Date.now();
    const loadTime = endTime - startTime;

    expect(loadTime).toBeLessThan(2000);
  });
});
