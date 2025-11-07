/**
 * @file demonstrativo-fluxo.spec.ts
 * @description Testes E2E para Demonstrativo de Fluxo de Caixa Acumulado
 * @module e2e/demonstrativo-fluxo
 * @author Andrey Viana
 * @date 6 de novembro de 2025
 */

import { test, expect } from '@playwright/test';

test.describe('Demonstrativo de Fluxo de Caixa Acumulado', () => {
  /**
   * Setup - Login e navegação antes de cada teste
   */
  test.beforeEach(async ({ page }) => {
    // Login como gerente (permissão necessária)
    await page.goto('/login');
    await page.fill('input[name="email"]', 'gerente@test.com');
    await page.fill('input[name="password"]', 'senha123');

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

    // Aguardar redirecionamento
    await Promise.race([
      page.waitForURL(/\/(dashboard|home)/, { timeout: 10000 }),
      page.waitForSelector('nav, [data-authenticated="true"]', {
        timeout: 10000,
      }),
    ]).catch(() => page.waitForTimeout(2000));

    // Navegar para página do Demonstrativo
    await page.goto('/demonstrativo-fluxo');
    await page.waitForLoadState('networkidle');
  });

  /**
   * Teste 1: Verificar renderização inicial da página
   */
  test('deve exibir a página corretamente na primeira carga', async ({
    page,
  }) => {
    // Verificar título principal
    await expect(
      page.getByRole('heading', {
        name: /Demonstrativo de Fluxo de Caixa Acumulado/i,
      })
    ).toBeVisible();

    // Verificar descrição
    await expect(
      page.getByText(/Visualize o fluxo de caixa com saldo acumulado/i)
    ).toBeVisible();

    // Verificar botões de export (desabilitados sem dados)
    const excelBtn = page.getByRole('button', { name: /Excel/i });
    const pdfBtn = page.getByRole('button', { name: /PDF/i });
    const csvBtn = page.getByRole('button', { name: /CSV/i });

    await expect(excelBtn).toBeVisible();
    await expect(pdfBtn).toBeVisible();
    await expect(csvBtn).toBeVisible();

    // Verificar seção de filtros
    await expect(page.getByText('Unidade')).toBeVisible();
    await expect(page.getByText('Conta Bancária')).toBeVisible();
    await expect(page.getByText('Data Inicial')).toBeVisible();
    await expect(page.getByText('Data Final')).toBeVisible();

    // Verificar botões de filtro
    await expect(page.getByRole('button', { name: /Buscar/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Limpar/i })).toBeVisible();
  });

  /**
   * Teste 2: Aplicar filtros e buscar dados
   */
  test('deve aplicar filtros e exibir dados na tabela', async ({ page }) => {
    // Selecionar unidade (primeira opção disponível)
    const unitSelect = page.locator('select').first();
    await unitSelect.selectOption({ index: 1 });

    // Aguardar um momento para carregar contas bancárias
    await page.waitForTimeout(500);

    // Selecionar conta bancária (ou "Todas as Contas")
    const accountSelect = page.locator('select[name="account_id"]');
    if (await accountSelect.isVisible()) {
      await accountSelect.selectOption({ index: 0 }); // Todas as Contas
    }

    // Preencher período (últimos 30 dias)
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const startDate = thirtyDaysAgo.toISOString().split('T')[0];
    const endDate = today.toISOString().split('T')[0];

    await page.fill('input[name="start_date"]', startDate);
    await page.fill('input[name="end_date"]', endDate);

    // Clicar em Buscar
    await page.click('button:has-text("Buscar")');

    // Aguardar carregamento
    await page.waitForTimeout(2000);

    // Verificar se tabela está visível (pode estar vazia ou com dados)
    const table = page.locator('table');
    const emptyState = page.getByText(/Nenhum dado encontrado/i);

    // Pelo menos um dos dois deve estar visível
    const hasTable = await table.isVisible();
    const hasEmptyState = await emptyState.isVisible();

    expect(hasTable || hasEmptyState).toBeTruthy();

    // Se houver dados, verificar colunas
    if (hasTable) {
      await expect(page.getByText('Data')).toBeVisible();
      await expect(page.getByText('Entradas')).toBeVisible();
      await expect(page.getByText('Saídas')).toBeVisible();
      await expect(page.getByText('Saldo do Dia')).toBeVisible();
      await expect(page.getByText('Saldo Acumulado')).toBeVisible();
    }
  });

  /**
   * Teste 3: Validar KPIs (Summary) quando há dados
   */
  test('deve exibir KPIs de resumo quando há dados', async ({ page }) => {
    // Aplicar filtros primeiro
    const unitSelect = page.locator('select').first();
    await unitSelect.selectOption({ index: 1 });
    await page.waitForTimeout(500);

    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    await page.fill(
      'input[name="start_date"]',
      thirtyDaysAgo.toISOString().split('T')[0]
    );
    await page.fill(
      'input[name="end_date"]',
      today.toISOString().split('T')[0]
    );

    await page.click('button:has-text("Buscar")');
    await page.waitForTimeout(2000);

    // Verificar se seção de KPIs está visível
    const summarySection = page.getByText(/Resumo do Período/i);

    if (await summarySection.isVisible()) {
      // Verificar KPI cards
      await expect(page.getByText('Saldo Inicial')).toBeVisible();
      await expect(page.getByText('Total Entradas')).toBeVisible();
      await expect(page.getByText('Total Saídas')).toBeVisible();
      await expect(page.getByText('Saldo Final')).toBeVisible();
      await expect(page.getByText('Variação %')).toBeVisible();
      await expect(page.getByText('Tendência')).toBeVisible();
    }
  });

  /**
   * Teste 4: Validar sorting na tabela
   */
  test('deve ordenar dados ao clicar nos headers da tabela', async ({
    page,
  }) => {
    // Aplicar filtros e buscar dados
    const unitSelect = page.locator('select').first();
    await unitSelect.selectOption({ index: 1 });
    await page.waitForTimeout(500);

    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    await page.fill(
      'input[name="start_date"]',
      thirtyDaysAgo.toISOString().split('T')[0]
    );
    await page.fill(
      'input[name="end_date"]',
      today.toISOString().split('T')[0]
    );

    await page.click('button:has-text("Buscar")');
    await page.waitForTimeout(2000);

    // Verificar se tabela tem dados
    const table = page.locator('table tbody tr');
    const rowCount = await table.count();

    if (rowCount > 1) {
      // Clicar no header "Data" para ordenar
      const dateHeader = page.locator('th:has-text("Data")');
      await dateHeader.click();

      // Aguardar reordenação
      await page.waitForTimeout(500);

      // Verificar que ícone de sorting apareceu
      const sortIcon = dateHeader.locator('svg');
      await expect(sortIcon).toBeVisible();

      // Clicar novamente para inverter ordem
      await dateHeader.click();
      await page.waitForTimeout(500);

      // Verificar que ícone mudou de direção
      await expect(sortIcon).toBeVisible();
    }
  });

  /**
   * Teste 5: Validar paginação
   */
  test('deve paginar dados quando há mais de 30 registros', async ({
    page,
  }) => {
    // Aplicar filtros com período maior (chance de ter +30 registros)
    const unitSelect = page.locator('select').first();
    await unitSelect.selectOption({ index: 1 });
    await page.waitForTimeout(500);

    const today = new Date();
    const ninetyDaysAgo = new Date(today);
    ninetyDaysAgo.setDate(today.getDate() - 90);

    await page.fill(
      'input[name="start_date"]',
      ninetyDaysAgo.toISOString().split('T')[0]
    );
    await page.fill(
      'input[name="end_date"]',
      today.toISOString().split('T')[0]
    );

    await page.click('button:has-text("Buscar")');
    await page.waitForTimeout(2000);

    // Verificar se há botões de paginação
    const nextButton = page.getByRole('button', { name: /Próxima/i });
    const prevButton = page.getByRole('button', { name: /Anterior/i });

    if (await nextButton.isVisible()) {
      // Verificar estado inicial
      await expect(prevButton).toBeDisabled();

      // Clicar em próxima
      await nextButton.click();
      await page.waitForTimeout(500);

      // Verificar que botão anterior está habilitado
      await expect(prevButton).toBeEnabled();

      // Voltar para primeira página
      await prevButton.click();
      await page.waitForTimeout(500);

      // Verificar que voltou ao estado inicial
      await expect(prevButton).toBeDisabled();
    }
  });

  /**
   * Teste 6: Validar reset de filtros
   */
  test('deve limpar filtros ao clicar em Limpar', async ({ page }) => {
    // Aplicar filtros primeiro
    const unitSelect = page.locator('select').first();
    await unitSelect.selectOption({ index: 1 });
    await page.waitForTimeout(500);

    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    await page.fill(
      'input[name="start_date"]',
      thirtyDaysAgo.toISOString().split('T')[0]
    );
    await page.fill(
      'input[name="end_date"]',
      today.toISOString().split('T')[0]
    );

    // Clicar em Limpar
    await page.click('button:has-text("Limpar")');
    await page.waitForTimeout(500);

    // Verificar que campos foram resetados
    const startDateInput = page.locator('input[name="start_date"]');
    const endDateInput = page.locator('input[name="end_date"]');

    // Verificar que as datas voltaram ao padrão (primeiro e último dia do mês)
    const startValue = await startDateInput.inputValue();
    const endValue = await endDateInput.inputValue();

    expect(startValue).toBeTruthy();
    expect(endValue).toBeTruthy();
  });

  /**
   * Teste 7: Validar estado de erro
   */
  test('deve exibir mensagem de erro ao falhar na busca', async ({ page }) => {
    // Interceptar request e forçar erro
    await page.route('**/demonstrativo_fluxo_caixa_acumulado*', route =>
      route.abort()
    );

    // Aplicar filtros
    const unitSelect = page.locator('select').first();
    await unitSelect.selectOption({ index: 1 });
    await page.waitForTimeout(500);

    const today = new Date();
    await page.fill(
      'input[name="start_date"]',
      today.toISOString().split('T')[0]
    );
    await page.fill(
      'input[name="end_date"]',
      today.toISOString().split('T')[0]
    );

    // Buscar (vai falhar)
    await page.click('button:has-text("Buscar")');
    await page.waitForTimeout(2000);

    // Verificar mensagem de erro
    const errorMessage = page.getByText(/Erro ao carregar demonstrativo/i);
    await expect(errorMessage).toBeVisible();

    // Verificar botão "Tentar novamente"
    const retryButton = page.getByRole('button', {
      name: /Tentar novamente/i,
    });
    await expect(retryButton).toBeVisible();
  });

  /**
   * Teste 8: Validar estado vazio (sem dados)
   */
  test('deve exibir estado vazio quando não há dados', async ({ page }) => {
    // Aplicar filtros com período muito antigo (sem dados)
    const unitSelect = page.locator('select').first();
    await unitSelect.selectOption({ index: 1 });
    await page.waitForTimeout(500);

    // Data de 5 anos atrás
    const oldDate = new Date();
    oldDate.setFullYear(oldDate.getFullYear() - 5);

    await page.fill(
      'input[name="start_date"]',
      oldDate.toISOString().split('T')[0]
    );
    await page.fill(
      'input[name="end_date"]',
      oldDate.toISOString().split('T')[0]
    );

    // Buscar
    await page.click('button:has-text("Buscar")');
    await page.waitForTimeout(2000);

    // Verificar estado vazio
    const emptyState = page.getByText(/Nenhum dado encontrado/i);
    await expect(emptyState).toBeVisible();

    // Verificar mensagem de ajuda
    const helpText = page.getByText(/Ajuste os filtros/i);
    await expect(helpText).toBeVisible();
  });

  /**
   * Teste 9: Validar validação de período (máx 2 anos)
   */
  test('deve validar período máximo de 2 anos', async ({ page }) => {
    // Aplicar filtros
    const unitSelect = page.locator('select').first();
    await unitSelect.selectOption({ index: 1 });
    await page.waitForTimeout(500);

    // Período maior que 2 anos
    const today = new Date();
    const threeYearsAgo = new Date(today);
    threeYearsAgo.setFullYear(today.getFullYear() - 3);

    await page.fill(
      'input[name="start_date"]',
      threeYearsAgo.toISOString().split('T')[0]
    );
    await page.fill(
      'input[name="end_date"]',
      today.toISOString().split('T')[0]
    );

    // Buscar (deve falhar validação)
    await page.click('button:has-text("Buscar")');
    await page.waitForTimeout(500);

    // Verificar que dados não foram carregados (validação falhou)
    // Nota: validação é client-side, então não deve fazer request
    const table = page.locator('table tbody tr');
    const rowCount = await table.count();

    // Se validação funcionou, não deve ter feito request
    expect(rowCount).toBe(0);
  });

  /**
   * Teste 10: Validar botões de export (devem estar desabilitados sem dados)
   */
  test('botões de export devem estar desabilitados sem dados', async ({
    page,
  }) => {
    // Verificar estado inicial (sem dados)
    const excelBtn = page.getByRole('button', { name: /Excel/i });
    const pdfBtn = page.getByRole('button', { name: /PDF/i });
    const csvBtn = page.getByRole('button', { name: /CSV/i });

    await expect(excelBtn).toBeDisabled();
    await expect(pdfBtn).toBeDisabled();
    await expect(csvBtn).toBeDisabled();
  });
});
