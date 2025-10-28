import { test, expect } from '@playwright/test';

test.describe('Lista da Vez', () => {
  test('adiciona ponto e verifica reordenação', async ({ page }) => {
    test.skip(
      true,
      'Implementar após definir seletores e dados seed para Lista da Vez.'
    );

    await page.goto('/lista-da-vez');

    // TODO: capturar posição inicial, adicionar ponto e validar nova ordem

    await expect(page.getByTestId('turn-list')).toBeVisible();
  });

  test('visualiza histórico mensal após reset', async ({ page }) => {
    test.skip(
      true,
      'Implementar após sementes do histórico serem configuradas.'
    );

    await page.goto('/lista-da-vez');

    // TODO: abrir modal de histórico e validar dados do mês atual

    await expect(page.getByTestId('turn-history-modal')).toBeVisible();
  });
});
