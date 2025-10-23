import { test, expect } from '@playwright/test';

test.describe('Conciliação bancária', () => {
  test('importa extrato e reconcilia lançamentos', async ({ page }) => {
    test.skip(true, 'Implementar com fixtures de extrato e seletores definidos.');

    await page.goto('/financeiro/concilia');

    // TODO: carregar arquivo fixture via input[type=file]
    // TODO: revisar lançamentos e aprovar
    // TODO: validar status Reconhecido

    await expect(page.getByTestId('reconciliation-table')).toBeVisible();
  });
});
