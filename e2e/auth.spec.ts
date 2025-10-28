import { test, expect } from '@playwright/test';

test.describe('Autenticação', () => {
  test('realiza login com credenciais válidas', async ({ page }) => {
    test.skip(
      true,
      'Implementar quando rota de login e seletores estiverem definidos.'
    );

    await page.goto('/login');
    await page.fill('[data-testid="email"]', process.env.E2E_USER_EMAIL ?? '');
    await page.fill(
      '[data-testid="password"]',
      process.env.E2E_USER_PASSWORD ?? ''
    );
    await page.click('[data-testid="submit-login"]');

    await expect(page).toHaveURL(/dashboard/i);
  });

  test('exibe mensagem para credenciais inválidas', async ({ page }) => {
    test.skip(
      true,
      'Implementar quando mensagens de erro estiverem definidas.'
    );

    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'invalid@example.com');
    await page.fill('[data-testid="password"]', 'senha-incorreta');
    await page.click('[data-testid="submit-login"]');

    await expect(page.getByTestId('auth-error')).toBeVisible();
  });
});
