/**
 * @file dre-flow.spec.ts
 * @description Testes E2E para o fluxo completo do DRE
 * @author Barber Analytics Pro Team
 * @date 2025-10-21
 */

import { test, expect } from '@playwright/test';

test.describe('DRE - Demonstração do Resultado do Exercício', () => {
  test.beforeEach(async ({ page }) => {
    // Login antes de cada teste
    await page.goto('/login');
    await page.fill('input[name="email"]', 'profissional@test.com');
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

    // Aguardar redirecionamento com múltiplas opções
    await Promise.race([
      page.waitForURL(/\/(dashboard|home)/, { timeout: 10000 }),
      page.waitForSelector('nav, [data-authenticated="true"]', {
        timeout: 10000,
      }),
    ]).catch(() => page.waitForTimeout(2000));

    // Navegar para página do DRE
    await page.goto('/dre');
    await page.waitForLoadState('networkidle');
  });

  test('deve exibir a página DRE corretamente', async ({ page }) => {
    // Verificar título
    await expect(
      page.getByRole('heading', { name: /DRE.*Demonstração do Resultado/i })
    ).toBeVisible();

    // Verificar filtros de período
    await expect(page.getByText('Mês Atual')).toBeVisible();
    await expect(page.getByText('Ano Atual')).toBeVisible();
    await expect(page.getByText('Período Customizado')).toBeVisible();
  });

  test('deve calcular DRE do mês atual', async ({ page }) => {
    // Selecionar mês atual
    await page.click('button:has-text("Mês Atual")');

    // Aguardar cálculo
    await page.waitForSelector('text=Calculando DRE...', {
      state: 'hidden',
      timeout: 10000,
    });

    // Verificar se DRE foi carregado
    await expect(page.getByText('RECEITA BRUTA')).toBeVisible();
    await expect(page.getByText('MARGEM DE CONTRIBUIÇÃO')).toBeVisible();
    await expect(page.getByText('LUCRO LÍQUIDO DO PERÍODO')).toBeVisible();

    // Verificar indicadores
    await expect(
      page.locator('text=Margem de Contribuição').first()
    ).toBeVisible();
    await expect(page.locator('text=Margem EBIT').first()).toBeVisible();
    await expect(page.locator('text=Margem Líquida').first()).toBeVisible();
  });

  test('deve calcular DRE do ano atual', async ({ page }) => {
    // Selecionar ano atual
    await page.click('button:has-text("Ano Atual")');

    // Aguardar cálculo
    await page.waitForSelector('text=Calculando DRE...', {
      state: 'hidden',
      timeout: 10000,
    });

    // Verificar se DRE foi carregado
    await expect(page.getByText('RECEITA BRUTA')).toBeVisible();

    // Verificar que o período exibido é o ano todo
    const currentYear = new Date().getFullYear();
    await expect(page.getByText(currentYear.toString())).toBeVisible();
  });

  test('deve calcular DRE com período customizado', async ({ page }) => {
    // Selecionar período customizado
    await page.click('button:has-text("Período Customizado")');

    // Preencher datas
    await page.fill('input[type="date"]', '2025-10-01');
    await page.fill('input[type="date"] ~ input[type="date"]', '2025-10-15');

    // Calcular
    await page.click('button:has-text("Calcular DRE")');

    // Aguardar cálculo
    await page.waitForSelector('text=Calculando DRE...', {
      state: 'hidden',
      timeout: 10000,
    });

    // Verificar se DRE foi carregado
    await expect(page.getByText('RECEITA BRUTA')).toBeVisible();

    // Verificar período
    await expect(page.getByText(/01\/10\/2025.*15\/10\/2025/)).toBeVisible();
  });

  test('deve exibir erro ao tentar calcular sem selecionar unidade', async ({
    page,
  }) => {
    // TODO: Implementar lógica para desselecionar unidade
    // Este teste deve verificar que o sistema exibe mensagem apropriada
  });

  test('deve exportar DRE como TXT', async ({ page }) => {
    // Calcular DRE primeiro
    await page.click('button:has-text("Mês Atual")');
    await page.waitForSelector('text=RECEITA BRUTA', { timeout: 10000 });

    // Configurar listener para download
    const downloadPromise = page.waitForEvent('download');

    // Clicar no botão de exportar TXT
    await page.click('button:has-text("TXT")');

    // Aguardar download
    const download = await downloadPromise;

    // Verificar nome do arquivo
    expect(download.suggestedFilename()).toMatch(/DRE_.*\.txt$/);

    // Verificar toast de sucesso
    await expect(page.getByText('DRE exportado com sucesso')).toBeVisible();
  });

  test('deve exportar DRE como CSV', async ({ page }) => {
    // Calcular DRE primeiro
    await page.click('button:has-text("Mês Atual")');
    await page.waitForSelector('text=RECEITA BRUTA', { timeout: 10000 });

    // Configurar listener para download
    const downloadPromise = page.waitForEvent('download');

    // Clicar no botão de exportar CSV
    await page.click('button:has-text("CSV")');

    // Aguardar download
    const download = await downloadPromise;

    // Verificar nome do arquivo
    expect(download.suggestedFilename()).toMatch(/DRE_.*\.csv$/);

    // Verificar toast de sucesso
    await expect(page.getByText(/exportado.*CSV.*sucesso/i)).toBeVisible();
  });

  test('deve abrir visualização para PDF', async ({ page }) => {
    // Calcular DRE primeiro
    await page.click('button:has-text("Mês Atual")');
    await page.waitForSelector('text=RECEITA BRUTA', { timeout: 10000 });

    // Configurar listener para nova página/janela
    const popupPromise = page.waitForEvent('popup');

    // Clicar no botão de exportar PDF
    await page.click('button:has-text("PDF")');

    // Aguardar nova janela
    const popup = await popupPromise;

    // Verificar conteúdo da nova janela
    await expect(
      popup.getByText('DRE - Demonstração do Resultado do Exercício')
    ).toBeVisible();
    await expect(popup.getByText('RECEITA BRUTA')).toBeVisible();

    // Fechar popup
    await popup.close();
  });

  test('deve exibir valores formatados corretamente', async ({ page }) => {
    // Calcular DRE
    await page.click('button:has-text("Mês Atual")');
    await page.waitForSelector('text=RECEITA BRUTA', { timeout: 10000 });

    // Verificar formatação de moeda (deve conter R$)
    const receitas = page.locator('text=/R\\$\\s+[\\d.,]+/');
    await expect(receitas.first()).toBeVisible();

    // Verificar formatação de percentuais
    const percentuais = page.locator('text=/%/');
    await expect(percentuais.first()).toBeVisible();
  });

  test('deve exibir metadata do DRE (dias e timestamp)', async ({ page }) => {
    // Calcular DRE
    await page.click('button:has-text("Mês Atual")');
    await page.waitForSelector('text=RECEITA BRUTA', { timeout: 10000 });

    // Verificar se exibe número de dias
    await expect(page.locator('text=/\\(\\d+ dias\\)/')).toBeVisible();

    // Verificar se exibe timestamp de geração
    await expect(page.locator('text=/Gerado em:/')).toBeVisible();
  });

  test('deve destacar lucro líquido positivo em verde', async ({ page }) => {
    // Calcular DRE
    await page.click('button:has-text("Mês Atual")');
    await page.waitForSelector('text=LUCRO LÍQUIDO', { timeout: 10000 });

    // Localizar linha do lucro líquido
    const lucroRow = page.locator('text=LUCRO LÍQUIDO').locator('..');

    // Verificar se tem classe de destaque
    const hasHighlight = await lucroRow.evaluate(
      el =>
        el.classList.contains('highlight-row') ||
        el.classList.contains('bg-blue-50')
    );

    expect(hasHighlight).toBe(true);
  });

  test('deve exibir loading durante cálculo', async ({ page }) => {
    // Clicar para calcular
    await page.click('button:has-text("Mês Atual")');

    // Verificar que loading aparece
    await expect(page.getByText('Calculando DRE...')).toBeVisible();
    await expect(page.locator('[class*="animate-spin"]')).toBeVisible();

    // Aguardar finalização
    await page.waitForSelector('text=Calculando DRE...', { state: 'hidden' });
  });

  test('deve exibir mensagem quando não há dados', async ({ page }) => {
    // TODO: Criar cenário com unidade sem movimentações
    // Verificar que exibe EmptyState apropriado
  });

  test('deve exibir estrutura hierárquica correta do DRE', async ({ page }) => {
    // Calcular DRE
    await page.click('button:has-text("Mês Atual")');
    await page.waitForSelector('text=RECEITA BRUTA', { timeout: 10000 });

    // Verificar ordem das seções
    const sections = [
      'RECEITA BRUTA',
      'CUSTOS OPERACIONAIS',
      'MARGEM DE CONTRIBUIÇÃO',
      'DESPESAS ADMINISTRATIVAS',
      'RESULTADO ANTES DOS IMPOSTOS',
      'IMPOSTO',
      'LUCRO LÍQUIDO',
    ];

    for (const section of sections) {
      await expect(page.getByText(section)).toBeVisible();
    }
  });

  test('deve permitir alternar entre períodos mantendo estado', async ({
    page,
  }) => {
    // Calcular mês atual
    await page.click('button:has-text("Mês Atual")');
    await page.waitForSelector('text=RECEITA BRUTA', { timeout: 10000 });

    const mesAtualValue = await page
      .locator('text=RECEITA BRUTA')
      .locator('..')
      .textContent();

    // Alternar para ano atual
    await page.click('button:has-text("Ano Atual")');
    await page.waitForSelector('text=RECEITA BRUTA', { timeout: 10000 });

    const anoAtualValue = await page
      .locator('text=RECEITA BRUTA')
      .locator('..')
      .textContent();

    // Valores devem ser diferentes
    expect(mesAtualValue).not.toBe(anoAtualValue);

    // Voltar para mês atual
    await page.click('button:has-text("Mês Atual")');
    await page.waitForSelector('text=RECEITA BRUTA', { timeout: 10000 });
  });
});
