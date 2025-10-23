import { test, expect } from '@playwright/test';

test.describe('Fluxo financeiro completo', () => {
  test('cria receita, despesa e valida DRE/fluxo de caixa', async ({ page }) => {
    test.skip(true, 'Implementar quando fixtures e seletores estiverem disponíveis.');

    await page.goto('/financeiro');

    // TODO: implementar criação de receita
    // TODO: implementar criação de despesa
    // TODO: validar cartões de fluxo de caixa / DRE

    await expect(page.getByTestId('financial-dashboard')).toBeVisible();
  });
});
