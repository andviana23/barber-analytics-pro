import { test, expect } from '@playwright/test';

/**
 * E2E Tests - Orders (Comandas) Flow
 *
 * Testes de fluxo completo para criação, edição e fechamento de comandas
 * com controle de acesso por perfil
 */

const testUsers = {
  recepcionista: {
    email: process.env.E2E_RECEPCIONISTA_EMAIL || 'recepcionista@test.com',
    password: process.env.E2E_RECEPCIONISTA_PASSWORD || 'senha123',
    role: 'recepcionista',
  },
  profissional: {
    email: process.env.E2E_PROFISSIONAL_EMAIL || 'profissional@test.com',
    password: process.env.E2E_PROFISSIONAL_PASSWORD || 'senha123',
    role: 'profissional',
  },
};

test.describe('Orders - Fluxo de Comandas', () => {
  test.describe.configure({ mode: 'serial' });

  let orderNumber: string;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Usuário cria comanda com sucesso', async ({ page }) => {
    // Login como recepcionista
    await page.goto('/login');
    await page.fill('input[name="email"]', testUsers.recepcionista.email);
    await page.fill('input[name="password"]', testUsers.recepcionista.password);

    // Aguarda a requisição de autenticação
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

    await Promise.race([
      page.waitForURL(/\/(dashboard|home|comandas)/, { timeout: 10000 }),
      page.waitForSelector('nav, [data-authenticated="true"]', {
        timeout: 10000,
      }),
    ]).catch(() => page.waitForTimeout(2000));

    // Navega para página de comandas
    await page.goto('/comandas');
    await page.waitForLoadState('networkidle');

    // Clica no botão "Nova Comanda"
    const newOrderButton = page.locator(
      'button:has-text("Nova Comanda"), button:has-text("Criar Comanda")'
    );
    await expect(newOrderButton.first()).toBeVisible();
    await newOrderButton.first().click();

    // Aguarda o modal aparecer
    const modal = page.locator('[role="dialog"], .modal');
    await expect(modal).toBeVisible();

    // Seleciona ou preenche cliente
    const clientInput = page.locator(
      'input[name="client"], input[placeholder*="cliente"], select[name="clientId"]'
    );

    if ((await clientInput.first().getAttribute('type')) === 'text') {
      await clientInput.first().fill('Cliente Teste E2E');
      // Aguarda autocomplete e seleciona primeira opção
      await page.waitForTimeout(500);
      const firstOption = page
        .locator('[role="option"], .autocomplete-item')
        .first();
      if (await firstOption.isVisible()) {
        await firstOption.click();
      }
    } else {
      // É um select, seleciona primeira opção
      await clientInput.first().selectOption({ index: 1 });
    }

    // Seleciona profissional
    const professionalSelect = page.locator(
      'select[name="professionalId"], select[name="professional"]'
    );
    await professionalSelect.selectOption({ index: 1 });

    // Confirma criação da comanda
    await page.click('button:has-text("Criar"), button:has-text("Confirmar")');

    // Aguarda feedback de sucesso
    await expect(page.locator('text=/comanda.*criada.*sucesso/i')).toBeVisible({
      timeout: 10000,
    });

    // Captura o número da comanda criada
    const orderNumberElement = page
      .locator('[data-testid="order-number"], text=/comanda.*#[0-9]+/i')
      .first();
    if (await orderNumberElement.isVisible()) {
      const text = await orderNumberElement.textContent();
      orderNumber = text?.match(/#?(\d+)/)?.[1] || '';
    }

    // Verifica que a comanda aparece na lista com status "Aberta"
    await expect(
      page
        .locator('text=/status.*aberta|aberto/i, [data-status="open"]')
        .first()
    ).toBeVisible();
  });

  test('Adiciona serviços à comanda', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', testUsers.recepcionista.email);
    await page.fill('input[name="password"]', testUsers.recepcionista.password);
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/(dashboard|home)/);

    // Navega para comandas
    await page.goto('/comandas');
    await page.waitForLoadState('networkidle');

    // Abre a primeira comanda aberta
    const openOrder = page
      .locator('[data-status="open"], tr:has-text("Aberta")')
      .first();
    await openOrder.click();

    // Aguarda modal de detalhes
    const modal = page.locator('[role="dialog"], .modal');
    await expect(modal).toBeVisible();

    // Clica em "Adicionar Serviço"
    const addServiceButton = page.locator(
      'button:has-text("Adicionar Serviço"), button:has-text("Adicionar Item")'
    );
    await addServiceButton.click();

    // Aguarda modal de adicionar serviço
    await page.waitForTimeout(500);

    // Seleciona um serviço
    const serviceSelect = page.locator(
      'select[name="serviceId"], select[name="service"]'
    );
    await serviceSelect.selectOption({ index: 1 });

    // Define quantidade (se houver campo)
    const quantityInput = page.locator('input[name="quantity"]');
    if (await quantityInput.isVisible()) {
      await quantityInput.fill('1');
    }

    // Confirma adição
    await page.click(
      'button:has-text("Adicionar"), button:has-text("Confirmar")'
    );

    // Aguarda feedback
    await expect(
      page.locator('text=/serviço.*adicionado|item.*adicionado/i')
    ).toBeVisible({ timeout: 5000 });

    // Verifica que o serviço aparece na lista de itens
    const itemsList = page.locator(
      'table tbody tr, [data-testid="order-item"]'
    );
    await expect(itemsList.first()).toBeVisible();

    // Verifica que o total foi atualizado
    await expect(page.locator('text=/total.*R\$/i')).toBeVisible();
  });

  test('Fecha comanda e gera receita', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', testUsers.recepcionista.email);
    await page.fill('input[name="password"]', testUsers.recepcionista.password);
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/(dashboard|home)/);

    // Navega para comandas
    await page.goto('/comandas');
    await page.waitForLoadState('networkidle');

    // Abre a primeira comanda aberta
    const openOrder = page
      .locator('[data-status="open"], tr:has-text("Aberta")')
      .first();
    await openOrder.click();

    // Aguarda modal
    const modal = page.locator('[role="dialog"], .modal');
    await expect(modal).toBeVisible();

    // Clica em "Fechar Comanda"
    const closeOrderButton = page.locator(
      'button:has-text("Fechar Comanda"), button:has-text("Finalizar")'
    );
    await expect(closeOrderButton).toBeVisible();
    await closeOrderButton.click();

    // Pode aparecer um modal de confirmação
    const confirmButton = page.locator(
      'button:has-text("Confirmar"), button:has-text("Sim")'
    );
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }

    // Aguarda feedback de sucesso
    await expect(
      page.locator('text=/comanda.*fechada.*sucesso|receita.*gerada/i')
    ).toBeVisible({ timeout: 10000 });

    // Verifica que o status mudou para "Fechada"
    await page.goto('/comandas');
    await page.waitForLoadState('networkidle');

    // Filtra por fechadas ou procura na lista
    const closedFilter = page.locator(
      'select[name="status"], button:has-text("Fechadas")'
    );
    if (await closedFilter.isVisible()) {
      if ((await closedFilter.evaluate(el => el.tagName)) === 'SELECT') {
        await closedFilter.selectOption('closed');
      } else {
        await closedFilter.click();
      }
      await page.waitForTimeout(1000);
    }

    // Verifica que existem comandas fechadas
    await expect(
      page.locator('[data-status="closed"], text=/fechada/i').first()
    ).toBeVisible();
  });

  test('Profissional visualiza apenas suas próprias comandas', async ({
    page,
  }) => {
    // Login como profissional
    await page.goto('/login');
    await page.fill('input[name="email"]', testUsers.profissional.email);
    await page.fill('input[name="password"]', testUsers.profissional.password);
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/(dashboard|home)/);

    // Navega para comandas
    await page.goto('/comandas');
    await page.waitForLoadState('networkidle');

    // Verifica que pode ver a página de comandas
    await expect(
      page
        .locator('h1, h2')
        .filter({ hasText: /comanda/i })
        .first()
    ).toBeVisible();

    // Captura o nome do profissional logado
    const userName = await page
      .locator('[data-testid="user-name"], .user-name, .profile-name')
      .first()
      .textContent();

    // Verifica todas as comandas visíveis
    const orderRows = page.locator(
      'table tbody tr, [data-testid="order-item"]'
    );
    const count = await orderRows.count();

    if (count > 0) {
      // Verifica que todas as comandas pertencem ao profissional logado
      for (let i = 0; i < Math.min(count, 5); i++) {
        const row = orderRows.nth(i);
        const professionalName = await row
          .locator('[data-testid="professional-name"], td:nth-child(3)')
          .textContent();

        // Se conseguir capturar o nome, verifica se é o mesmo do usuário logado
        if (professionalName && userName) {
          expect(professionalName).toContain(userName.split(' ')[0]);
        }
      }
    }

    // Verifica que NÃO pode ver comandas de outros profissionais
    // (se houver um filtro de profissional, ele deve estar travado ou não aparecer)
    const professionalFilter = page.locator(
      'select[name="professionalId"]:not([disabled])'
    );
    if (await professionalFilter.isVisible()) {
      const options = await professionalFilter.locator('option').count();
      // Profissional só deve ver sua própria opção (1 ou 2 com a opção "Todos")
      expect(options).toBeLessThanOrEqual(2);
    }
  });

  test('Calcula comissão corretamente ao adicionar serviços', async ({
    page,
  }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', testUsers.recepcionista.email);
    await page.fill('input[name="password"]', testUsers.recepcionista.password);
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/(dashboard|home)/);

    // Cria nova comanda
    await page.goto('/comandas');
    await page.waitForLoadState('networkidle');

    const newOrderButton = page
      .locator('button:has-text("Nova Comanda")')
      .first();
    await newOrderButton.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Preenche campos básicos
    await page.locator('select[name="clientId"]').selectOption({ index: 1 });
    await page
      .locator('select[name="professionalId"]')
      .selectOption({ index: 1 });
    await page.click('button:has-text("Criar")');

    await page.waitForTimeout(2000);

    // Adiciona serviço
    await page.locator('button:has-text("Adicionar Serviço")').click();
    await page.waitForTimeout(500);

    // Seleciona serviço
    await page.locator('select[name="serviceId"]').selectOption({ index: 1 });

    // Captura o preço exibido
    const priceText = await page
      .locator('[data-testid="service-price"], text=/R\$.*\d+/')
      .first()
      .textContent();
    const price = parseFloat(
      priceText?.replace(/[^\d,]/g, '').replace(',', '.') || '0'
    );

    // Captura o percentual de comissão
    const commissionText = await page
      .locator('[data-testid="commission-percentage"], text=/\d+%/')
      .first()
      .textContent();
    const commissionPercentage = parseFloat(
      commissionText?.replace(/[^\d]/g, '') || '0'
    );

    // Confirma
    await page.click('button:has-text("Adicionar")');
    await page.waitForTimeout(1000);

    // Verifica que a comissão foi calculada corretamente
    if (price > 0 && commissionPercentage > 0) {
      const expectedCommission = (price * commissionPercentage) / 100;
      const commissionValueText = await page
        .locator('[data-testid="commission-value"]')
        .first()
        .textContent();
      const displayedCommission = parseFloat(
        commissionValueText?.replace(/[^\d,]/g, '').replace(',', '.') || '0'
      );

      expect(Math.abs(displayedCommission - expectedCommission)).toBeLessThan(
        0.01
      );
    }
  });

  test('Não permite fechar comanda sem itens', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', testUsers.recepcionista.email);
    await page.fill('input[name="password"]', testUsers.recepcionista.password);
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/(dashboard|home)/);

    // Cria nova comanda vazia
    await page.goto('/comandas');
    await page.waitForLoadState('networkidle');

    const newOrderButton = page
      .locator('button:has-text("Nova Comanda")')
      .first();
    await newOrderButton.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    await page.locator('select[name="clientId"]').selectOption({ index: 1 });
    await page
      .locator('select[name="professionalId"]')
      .selectOption({ index: 1 });
    await page.click('button:has-text("Criar")');

    await page.waitForTimeout(2000);

    // Tenta fechar sem adicionar itens
    const closeButton = page.locator('button:has-text("Fechar Comanda")');

    // Verifica que o botão está desabilitado ou não aparece
    if (await closeButton.isVisible()) {
      const isDisabled = await closeButton.getAttribute('disabled');
      expect(isDisabled).not.toBeNull();
    } else {
      // Botão não deve estar visível se comanda vazia
      await expect(closeButton).not.toBeVisible();
    }
  });
});
