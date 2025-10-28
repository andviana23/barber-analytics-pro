import { test, expect } from '@playwright/test';

/**
 * E2E Tests - Services (Serviços) Flow
 *
 * Testes de fluxo completo para cadastro de serviços
 * com controle de acesso por perfil (apenas Gerente e Admin podem criar/editar)
 */

const testUsers = {
  gerente: {
    email: process.env.E2E_GERENTE_EMAIL || 'gerente@test.com',
    password: process.env.E2E_GERENTE_PASSWORD || 'Test123!',
    role: 'gerente',
  },
  profissional: {
    email: process.env.E2E_PROFISSIONAL_EMAIL || 'profissional@test.com',
    password: process.env.E2E_PROFISSIONAL_PASSWORD || 'Test123!',
    role: 'profissional',
  },
  admin: {
    email: process.env.E2E_ADMIN_EMAIL || 'admin@test.com',
    password: process.env.E2E_ADMIN_PASSWORD || 'Test123!',
    role: 'admin',
  },
};

const serviceData = {
  name: 'Corte Teste E2E',
  durationMinutes: 45,
  price: 50.0,
  commissionPercentage: 30,
};

test.describe('Services - Fluxo de Serviços', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Gerente cadastra serviço com sucesso', async ({ page }) => {
    // Login como gerente
    await page.goto('/login');
    await page.fill('input[name="email"]', testUsers.gerente.email);
    await page.fill('input[name="password"]', testUsers.gerente.password);

    // Aguarda resposta de autenticação
    const authPromise = page
      .waitForResponse(
        response =>
          response.url().includes('/auth/v1/token') &&
          response.status() === 200,
        { timeout: 10000 }
      )
      .catch(() => null);

    await page.click('button[type="submit"]');

    await authPromise;

    await Promise.race([
      page.waitForURL(/\/(dashboard|home|servicos)/, { timeout: 10000 }),
      page.waitForSelector('nav, [data-authenticated="true"]', {
        timeout: 10000,
      }),
    ]).catch(() => page.waitForTimeout(2000));

    // Navega para página de serviços
    await page.goto('/servicos');
    await page.waitForLoadState('networkidle');

    // Verifica que o botão "Novo Serviço" está visível
    const newServiceButton = page.locator(
      'button:has-text("Novo Serviço"), button:has-text("Cadastrar Serviço")'
    );
    await expect(newServiceButton.first()).toBeVisible();

    // Clica no botão
    await newServiceButton.first().click();

    // Aguarda modal aparecer
    const modal = page.locator('[role="dialog"], .modal');
    await expect(modal).toBeVisible();

    // Preenche o formulário
    await page.fill(
      'input[name="name"], input[placeholder*="nome"]',
      serviceData.name
    );

    await page.fill(
      'input[name="durationMinutes"], input[name="duration"]',
      serviceData.durationMinutes.toString()
    );

    await page.fill(
      'input[name="price"], input[placeholder*="preço"]',
      serviceData.price.toString()
    );

    await page.fill(
      'input[name="commissionPercentage"], input[name="commission"]',
      serviceData.commissionPercentage.toString()
    );

    // Confirma criação
    await page.click(
      'button:has-text("Salvar"), button:has-text("Criar"), button:has-text("Confirmar")'
    );

    // Aguarda feedback de sucesso
    await expect(
      page.locator('text=/serviço.*cadastrado.*sucesso|serviço.*criado/i')
    ).toBeVisible({ timeout: 10000 });

    // Verifica que o serviço aparece na tabela
    await expect(page.locator(`text=${serviceData.name}`)).toBeVisible();

    // Verifica que os dados estão corretos
    const serviceRow = page
      .locator(
        `tr:has-text("${serviceData.name}"), [data-service-name="${serviceData.name}"]`
      )
      .first();
    await expect(
      serviceRow.locator(`text=/R\\$.*${serviceData.price}/`)
    ).toBeVisible();
    await expect(
      serviceRow.locator(`text=/${serviceData.commissionPercentage}%/`)
    ).toBeVisible();
  });

  test('Profissional tenta cadastrar serviço - botão não aparece', async ({
    page,
  }) => {
    // Login como profissional
    await page.goto('/login');
    await page.fill('input[name="email"]', testUsers.profissional.email);
    await page.fill('input[name="password"]', testUsers.profissional.password);
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/(dashboard|home)/);

    // Navega para página de serviços
    await page.goto('/servicos');
    await page.waitForLoadState('networkidle');

    // Verifica que o botão "Novo Serviço" NÃO está visível
    const newServiceButton = page.locator(
      'button:has-text("Novo Serviço"), button:has-text("Cadastrar Serviço")'
    );
    await expect(newServiceButton).not.toBeVisible();

    // Verifica que pode visualizar a lista de serviços (modo leitura)
    await expect(
      page.locator('table, [data-testid="services-list"]')
    ).toBeVisible();

    // Verifica que os botões de ação (editar, excluir) NÃO estão visíveis
    const editButton = page.locator(
      'button:has-text("Editar"), [aria-label*="Editar"]'
    );
    const deleteButton = page.locator(
      'button:has-text("Excluir"), [aria-label*="Excluir"]'
    );

    await expect(editButton).not.toBeVisible();
    await expect(deleteButton).not.toBeVisible();
  });

  test('Admin pode criar e editar serviços', async ({ page }) => {
    // Login como admin
    await page.goto('/login');
    await page.fill('input[name="email"]', testUsers.admin.email);
    await page.fill('input[name="password"]', testUsers.admin.password);
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/(dashboard|home)/);

    // Navega para serviços
    await page.goto('/servicos');
    await page.waitForLoadState('networkidle');

    // Verifica que o botão está visível
    const newServiceButton = page
      .locator('button:has-text("Novo Serviço")')
      .first();
    await expect(newServiceButton).toBeVisible();

    // Verifica que pode ver botões de ação
    const firstService = page
      .locator('table tbody tr, [data-testid="service-item"]')
      .first();

    if (await firstService.isVisible()) {
      // Hover para mostrar ações
      await firstService.hover();

      // Verifica que os botões de edição estão disponíveis
      const actionButtons = firstService.locator(
        'button:has-text("Editar"), [aria-label*="Editar"]'
      );
      await expect(actionButtons.first()).toBeVisible({ timeout: 2000 });
    }
  });

  test('Gerente edita serviço existente', async ({ page }) => {
    // Login como gerente
    await page.goto('/login');
    await page.fill('input[name="email"]', testUsers.gerente.email);
    await page.fill('input[name="password"]', testUsers.gerente.password);
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/(dashboard|home)/);

    // Navega para serviços
    await page.goto('/servicos');
    await page.waitForLoadState('networkidle');

    // Seleciona o primeiro serviço da lista
    const firstService = page
      .locator('table tbody tr, [data-testid="service-item"]')
      .first();
    await expect(firstService).toBeVisible();

    // Hover e clica em editar
    await firstService.hover();
    const editButton = firstService.locator(
      'button:has-text("Editar"), [aria-label*="Editar"]'
    );
    await editButton.click();

    // Aguarda modal de edição
    const modal = page.locator('[role="dialog"], .modal');
    await expect(modal).toBeVisible();

    // Modifica o preço
    const newPrice = 75.5;
    const priceInput = page.locator('input[name="price"]');
    await priceInput.clear();
    await priceInput.fill(newPrice.toString());

    // Modifica a comissão
    const newCommission = 35;
    const commissionInput = page.locator(
      'input[name="commissionPercentage"], input[name="commission"]'
    );
    await commissionInput.clear();
    await commissionInput.fill(newCommission.toString());

    // Salva alterações
    await page.click('button:has-text("Salvar"), button:has-text("Atualizar")');

    // Aguarda feedback
    await expect(
      page.locator('text=/serviço.*atualizado|alterações.*salvas/i')
    ).toBeVisible({ timeout: 10000 });

    // Verifica que as mudanças foram aplicadas
    await page.waitForTimeout(1000);
    await expect(
      page.locator(`text=/R\\$.*${newPrice}/`).first()
    ).toBeVisible();
    await expect(
      page.locator(`text=/${newCommission}%/`).first()
    ).toBeVisible();
  });

  test('Gerente desativa/ativa serviço (soft delete)', async ({ page }) => {
    // Login como gerente
    await page.goto('/login');
    await page.fill('input[name="email"]', testUsers.gerente.email);
    await page.fill('input[name="password"]', testUsers.gerente.password);
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/(dashboard|home)/);

    // Navega para serviços
    await page.goto('/servicos');
    await page.waitForLoadState('networkidle');

    // Seleciona um serviço ativo
    const activeService = page
      .locator('[data-status="active"], tr:has-text("Ativo")')
      .first();

    if (await activeService.isVisible()) {
      await activeService.hover();

      // Clica em desativar
      const deactivateButton = activeService.locator(
        'button:has-text("Desativar"), [aria-label*="Desativar"]'
      );
      await deactivateButton.click();

      // Confirma ação se houver modal
      const confirmButton = page.locator(
        'button:has-text("Confirmar"), button:has-text("Sim")'
      );
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }

      // Aguarda feedback
      await expect(page.locator('text=/serviço.*desativado/i')).toBeVisible({
        timeout: 10000,
      });

      // Verifica que o status mudou
      await expect(
        page.locator('[data-status="inactive"], text=/inativo/i').first()
      ).toBeVisible();
    }

    // Testa reativação
    const inactiveService = page
      .locator('[data-status="inactive"], tr:has-text("Inativo")')
      .first();

    if (await inactiveService.isVisible()) {
      await inactiveService.hover();

      const activateButton = inactiveService.locator(
        'button:has-text("Ativar"), [aria-label*="Ativar"]'
      );
      await activateButton.click();

      await expect(
        page.locator('text=/serviço.*ativado|serviço.*reativado/i')
      ).toBeVisible({ timeout: 10000 });
    }
  });

  test('Validação: não permite criar serviço com dados inválidos', async ({
    page,
  }) => {
    // Login como gerente
    await page.goto('/login');
    await page.fill('input[name="email"]', testUsers.gerente.email);
    await page.fill('input[name="password"]', testUsers.gerente.password);
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/(dashboard|home)/);

    // Navega para serviços
    await page.goto('/servicos');
    await page.waitForLoadState('networkidle');

    // Abre modal
    const newServiceButton = page
      .locator('button:has-text("Novo Serviço")')
      .first();
    await newServiceButton.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Tenta salvar sem preencher
    await page.click('button:has-text("Salvar"), button:has-text("Criar")');

    // Verifica que há mensagens de erro
    await expect(
      page.locator('text=/campo.*obrigatório|preencha.*campo/i').first()
    ).toBeVisible({ timeout: 3000 });

    // Testa comissão inválida (> 100%)
    await page.fill('input[name="name"]', 'Teste Validação');
    await page.fill('input[name="price"]', '50');
    await page.fill('input[name="durationMinutes"]', '30');
    await page.fill('input[name="commissionPercentage"]', '150');

    await page.click('button:has-text("Salvar"), button:has-text("Criar")');

    // Verifica erro de validação
    await expect(
      page.locator('text=/comissão.*inválida|valor.*entre.*0.*100/i')
    ).toBeVisible({ timeout: 3000 });
  });

  test('Busca e filtro de serviços funcionam corretamente', async ({
    page,
  }) => {
    // Login como gerente
    await page.goto('/login');
    await page.fill('input[name="email"]', testUsers.gerente.email);
    await page.fill('input[name="password"]', testUsers.gerente.password);
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/(dashboard|home)/);

    // Navega para serviços
    await page.goto('/servicos');
    await page.waitForLoadState('networkidle');

    // Conta total de serviços inicialmente
    const initialCount = await page
      .locator('table tbody tr, [data-testid="service-item"]')
      .count();

    // Testa busca por nome
    const searchInput = page.locator(
      'input[name="search"], input[placeholder*="buscar"]'
    );

    if (await searchInput.isVisible()) {
      await searchInput.fill('Corte');
      await page.waitForTimeout(1000);

      // Verifica que a lista foi filtrada
      const filteredCount = await page
        .locator('table tbody tr, [data-testid="service-item"]')
        .count();

      if (initialCount > 0) {
        // Deve ter menos ou igual itens após filtro
        expect(filteredCount).toBeLessThanOrEqual(initialCount);
      }

      // Verifica que os itens visíveis contêm o termo buscado
      if (filteredCount > 0) {
        const firstItem = page
          .locator('table tbody tr, [data-testid="service-item"]')
          .first();
        await expect(firstItem.locator('text=/corte/i')).toBeVisible();
      }
    }

    // Testa filtro por status
    const statusFilter = page.locator('select[name="status"]');

    if (await statusFilter.isVisible()) {
      await statusFilter.selectOption('active');
      await page.waitForTimeout(1000);

      // Verifica que só aparecem serviços ativos
      const activeItems = page.locator(
        '[data-status="active"], tr:has-text("Ativo")'
      );
      const inactiveItems = page.locator(
        '[data-status="inactive"], tr:has-text("Inativo")'
      );

      if ((await activeItems.count()) > 0) {
        await expect(activeItems.first()).toBeVisible();
      }

      expect(await inactiveItems.count()).toBe(0);
    }
  });

  test('Serviços aparecem corretamente em comandas', async ({ page }) => {
    // Login como gerente
    await page.goto('/login');
    await page.fill('input[name="email"]', testUsers.gerente.email);
    await page.fill('input[name="password"]', testUsers.gerente.password);
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/(dashboard|home)/);

    // Captura os serviços ativos
    await page.goto('/servicos');
    await page.waitForLoadState('networkidle');

    const activeServices = await page
      .locator(
        '[data-status="active"] [data-testid="service-name"], tbody tr:has-text("Ativo") td:first-child'
      )
      .allTextContents();

    // Vai para comandas
    await page.goto('/comandas');
    await page.waitForLoadState('networkidle');

    // Cria nova comanda
    await page.locator('button:has-text("Nova Comanda")').click();
    await page.waitForTimeout(500);

    await page.locator('select[name="clientId"]').selectOption({ index: 1 });
    await page
      .locator('select[name="professionalId"]')
      .selectOption({ index: 1 });
    await page.click('button:has-text("Criar")');

    await page.waitForTimeout(2000);

    // Clica em adicionar serviço
    await page.locator('button:has-text("Adicionar Serviço")').click();
    await page.waitForTimeout(500);

    // Verifica que o select de serviços contém os serviços ativos
    const serviceSelect = page.locator('select[name="serviceId"]');
    const options = await serviceSelect.locator('option').allTextContents();

    // Pelo menos alguns dos serviços ativos devem estar disponíveis
    if (activeServices.length > 0 && options.length > 1) {
      const hasActiveServices = activeServices.some(service =>
        options.some(option => option.includes(service))
      );
      expect(hasActiveServices).toBeTruthy();
    }
  });
});
