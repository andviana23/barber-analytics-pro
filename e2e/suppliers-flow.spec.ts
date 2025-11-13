import { test, expect } from '@playwright/test';

test.describe('Suppliers - Fluxo completo CRUD', () => {
  test.beforeEach(async ({ page }) => {
    // TODO: Implementar login via fixture quando disponível
    // await page.goto('/login');
    // await page.getByLabel('E-mail').fill('admin@example.com');
    // await page.getByLabel('Senha').fill('senha123');
    // await page.getByRole('button', { name: 'Entrar' }).click();
    // await expect(page).toHaveURL('/dashboard');

    // Por enquanto, navegar direto para a página de fornecedores
    await page.goto('/fornecedores');
  });

  test('deve exibir página de fornecedores com elementos principais', async ({
    page,
  }) => {
    // Verificar título da página
    await expect(
      page.getByRole('heading', { name: 'Fornecedores' })
    ).toBeVisible();

    // Verificar botão de novo fornecedor
    await expect(
      page.getByRole('button', { name: /novo fornecedor/i })
    ).toBeVisible();

    // Verificar botão de refresh
    await expect(
      page.getByRole('button', { name: /atualizar/i })
    ).toBeVisible();

    // Verificar cards de estatísticas
    await expect(page.getByText(/total fornecedores/i)).toBeVisible();
    await expect(page.getByText(/ativos/i)).toBeVisible();
    await expect(page.getByText(/inativos/i)).toBeVisible();

    // Verificar barra de filtros
    await expect(
      page.getByPlaceholder(/buscar por nome ou cnpj/i)
    ).toBeVisible();
    await expect(page.getByRole('combobox', { name: /status/i })).toBeVisible();
  });

  test('deve criar novo fornecedor com dados válidos', async ({ page }) => {
    test.skip(
      true,
      'Implementar quando backend estiver conectado e dados de teste disponíveis.'
    );

    // Clicar no botão "Novo Fornecedor"
    await page.getByRole('button', { name: /novo fornecedor/i }).click();

    // Aguardar modal abrir
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /novo fornecedor/i })
    ).toBeVisible();

    // Preencher formulário
    await page.getByLabel(/nome/i).fill('Fornecedor Teste E2E');
    await page.getByLabel(/cnpj/i).fill('12.345.678/0001-90'); // CNPJ válido
    await page.getByLabel(/email/i).fill('teste@fornecedor.com');
    await page.getByLabel(/telefone/i).fill('(11) 98765-4321');
    await page.getByLabel(/endereço/i).fill('Rua Teste, 123');
    await page.getByLabel(/cidade/i).fill('São Paulo');
    await page.getByLabel(/estado/i).selectOption('SP');
    await page.getByLabel(/cep/i).fill('01234-567');
    await page.getByLabel(/prazo de pagamento/i).fill('30/60 dias');
    await page
      .getByLabel(/observações/i)
      .fill('Fornecedor criado via teste E2E');

    // Salvar
    await page.getByRole('button', { name: /salvar/i }).click();

    // Verificar toast de sucesso
    await expect(page.getByText(/fornecedor criado com sucesso/i)).toBeVisible({
      timeout: 5000,
    });

    // Verificar que modal fechou
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Verificar que fornecedor aparece na lista
    await expect(page.getByText('Fornecedor Teste E2E')).toBeVisible();
    await expect(page.getByText('12.345.678/0001-90')).toBeVisible();
  });

  test('deve validar CNPJ inválido', async ({ page }) => {
    test.skip(
      true,
      'Implementar quando validação de CNPJ estiver implementada no modal.'
    );

    // Abrir modal
    await page.getByRole('button', { name: /novo fornecedor/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Preencher nome (obrigatório)
    await page.getByLabel(/nome/i).fill('Teste Validação');

    // Preencher CNPJ inválido (check digits errados)
    await page.getByLabel(/cnpj/i).fill('12.345.678/0001-99');

    // Tentar salvar
    await page.getByRole('button', { name: /salvar/i }).click();

    // Verificar mensagem de erro
    await expect(page.getByText(/cnpj inválido/i)).toBeVisible();

    // Modal deve permanecer aberto
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('deve detectar CNPJ duplicado', async ({ page }) => {
    test.skip(
      true,
      'Implementar quando detecção de duplicatas estiver funcionando.'
    );

    // Abrir modal
    await page.getByRole('button', { name: /novo fornecedor/i }).click();

    // Preencher com CNPJ que já existe no banco
    await page.getByLabel(/nome/i).fill('Fornecedor Duplicado');
    await page.getByLabel(/cnpj/i).fill('11.222.333/0001-44'); // CNPJ existente

    // Aguardar verificação de duplicata (trigger on blur)
    await page.getByLabel(/email/i).click();

    // Verificar aviso de duplicata
    await expect(page.getByText(/cnpj já cadastrado/i)).toBeVisible();
  });

  test('deve editar fornecedor existente', async ({ page }) => {
    test.skip(true, 'Implementar quando dados de teste estiverem disponíveis.');

    // Clicar no botão de ações do primeiro fornecedor
    await page.locator('[data-testid="supplier-actions-menu"]').first().click();

    // Clicar em "Editar"
    await page.getByRole('menuitem', { name: /editar/i }).click();

    // Aguardar modal abrir
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /editar fornecedor/i })
    ).toBeVisible();

    // Modificar nome
    const nomeInput = page.getByLabel(/nome/i);
    await nomeInput.clear();
    await nomeInput.fill('Fornecedor Editado E2E');

    // Salvar
    await page.getByRole('button', { name: /salvar/i }).click();

    // Verificar toast de sucesso
    await expect(
      page.getByText(/fornecedor atualizado com sucesso/i)
    ).toBeVisible({ timeout: 5000 });

    // Verificar que nome foi atualizado na lista
    await expect(page.getByText('Fornecedor Editado E2E')).toBeVisible();
  });

  test('deve visualizar detalhes do fornecedor', async ({ page }) => {
    test.skip(true, 'Implementar quando dados de teste estiverem disponíveis.');

    // Clicar no botão de ações
    await page.locator('[data-testid="supplier-actions-menu"]').first().click();

    // Clicar em "Ver detalhes"
    await page.getByRole('menuitem', { name: /ver detalhes/i }).click();

    // Verificar que a view de detalhes foi exibida
    await expect(page.getByTestId('supplier-details-view')).toBeVisible();

    // Verificar seções principais
    await expect(page.getByText(/informações do fornecedor/i)).toBeVisible();
    await expect(page.getByText(/histórico de compras/i)).toBeVisible();

    // Verificar botões de ação
    await expect(page.getByRole('button', { name: /editar/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /arquivar/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /voltar/i })).toBeVisible();
  });

  test('deve voltar da view de detalhes para a lista', async ({ page }) => {
    test.skip(true, 'Implementar quando dados de teste estiverem disponíveis.');

    // Ir para detalhes
    await page.locator('[data-testid="supplier-actions-menu"]').first().click();
    await page.getByRole('menuitem', { name: /ver detalhes/i }).click();
    await expect(page.getByTestId('supplier-details-view')).toBeVisible();

    // Clicar em "Voltar"
    await page.getByRole('button', { name: /voltar/i }).click();

    // Verificar que voltou para a lista
    await expect(page.getByTestId('suppliers-table')).toBeVisible();
    await expect(page.getByTestId('supplier-details-view')).not.toBeVisible();
  });

  test('deve filtrar fornecedores por status', async ({ page }) => {
    test.skip(true, 'Implementar quando dados de teste estiverem disponíveis.');

    // Selecionar filtro "ATIVO"
    await page.getByRole('combobox', { name: /status/i }).selectOption('ATIVO');

    // Aguardar requisição
    await page.waitForTimeout(500);

    // Verificar que apenas fornecedores ativos são exibidos
    const statusBadges = page.locator('[data-testid="supplier-status-badge"]');
    const count = await statusBadges.count();

    for (let i = 0; i < count; i++) {
      await expect(statusBadges.nth(i)).toHaveText('ATIVO');
    }

    // Selecionar filtro "INATIVO"
    await page
      .getByRole('combobox', { name: /status/i })
      .selectOption('INATIVO');
    await page.waitForTimeout(500);

    // Verificar que apenas fornecedores inativos são exibidos
    const inactiveBadges = page.locator(
      '[data-testid="supplier-status-badge"]'
    );
    const inactiveCount = await inactiveBadges.count();

    for (let i = 0; i < inactiveCount; i++) {
      await expect(inactiveBadges.nth(i)).toHaveText('INATIVO');
    }
  });

  test('deve buscar fornecedor por nome', async ({ page }) => {
    test.skip(true, 'Implementar quando dados de teste estiverem disponíveis.');

    // Digitar no campo de busca
    const searchInput = page.getByPlaceholder(/buscar por nome ou cnpj/i);
    await searchInput.fill('Fornecedor A');

    // Aguardar debounce (500ms)
    await page.waitForTimeout(600);

    // Verificar que apenas fornecedores com "Fornecedor A" no nome aparecem
    await expect(page.getByText('Fornecedor A')).toBeVisible();
    await expect(page.getByText('Fornecedor B')).not.toBeVisible();
  });

  test('deve buscar fornecedor por CNPJ', async ({ page }) => {
    test.skip(true, 'Implementar quando dados de teste estiverem disponíveis.');

    // Digitar CNPJ no campo de busca
    const searchInput = page.getByPlaceholder(/buscar por nome ou cnpj/i);
    await searchInput.fill('12.345.678');

    // Aguardar debounce
    await page.waitForTimeout(600);

    // Verificar que apenas fornecedor com esse CNPJ aparece
    await expect(page.getByText('12.345.678/0001-90')).toBeVisible();
  });

  test('deve limpar filtros', async ({ page }) => {
    test.skip(true, 'Implementar quando dados de teste estiverem disponíveis.');

    // Aplicar filtros
    await page.getByPlaceholder(/buscar por nome ou cnpj/i).fill('Teste');
    await page.getByRole('combobox', { name: /status/i }).selectOption('ATIVO');
    await page.waitForTimeout(600);

    // Verificar que botão "Limpar filtros" apareceu
    const clearButton = page.getByRole('button', { name: /limpar filtros/i });
    await expect(clearButton).toBeVisible();

    // Clicar em limpar
    await clearButton.click();

    // Verificar que filtros foram resetados
    await expect(page.getByPlaceholder(/buscar por nome ou cnpj/i)).toHaveValue(
      ''
    );
    await expect(page.getByRole('combobox', { name: /status/i })).toHaveValue(
      ''
    );
  });

  test('deve navegar pela paginação', async ({ page }) => {
    test.skip(
      true,
      'Implementar quando houver dados suficientes para paginar.'
    );

    // Verificar indicador de página atual
    await expect(page.getByText(/1 - 50 de \d+ fornecedores/)).toBeVisible();

    // Verificar que botão "Anterior" está desabilitado na primeira página
    const prevButton = page.getByRole('button', { name: /anterior/i });
    await expect(prevButton).toBeDisabled();

    // Clicar em "Próximo"
    const nextButton = page.getByRole('button', { name: /próximo/i });
    await nextButton.click();

    // Aguardar requisição
    await page.waitForTimeout(500);

    // Verificar que página mudou
    await expect(page.getByText(/51 - 100 de \d+ fornecedores/)).toBeVisible();

    // Verificar que botão "Anterior" agora está habilitado
    await expect(prevButton).toBeEnabled();

    // Voltar para página anterior
    await prevButton.click();
    await page.waitForTimeout(500);

    // Verificar que voltou para a primeira página
    await expect(page.getByText(/1 - 50 de \d+ fornecedores/)).toBeVisible();
  });

  test('deve arquivar fornecedor', async ({ page }) => {
    test.skip(
      true,
      'Implementar quando dados de teste e confirmação estiverem disponíveis.'
    );

    // Contar fornecedores ativos antes de arquivar
    const activeBadgesBefore = page.locator(
      '[data-testid="supplier-status-badge"]:has-text("ATIVO")'
    );
    const activeCountBefore = await activeBadgesBefore.count();

    // Abrir menu de ações
    await page.locator('[data-testid="supplier-actions-menu"]').first().click();

    // Clicar em "Arquivar"
    await page.getByRole('menuitem', { name: /arquivar/i }).click();

    // Confirmar ação (assumindo que há diálogo de confirmação)
    await page.getByRole('button', { name: /confirmar/i }).click();

    // Verificar toast de sucesso
    await expect(
      page.getByText(/fornecedor arquivado com sucesso/i)
    ).toBeVisible({ timeout: 5000 });

    // Verificar que número de fornecedores ativos diminuiu
    const activeBadgesAfter = page.locator(
      '[data-testid="supplier-status-badge"]:has-text("ATIVO")'
    );
    const activeCountAfter = await activeBadgesAfter.count();

    expect(activeCountAfter).toBe(activeCountBefore - 1);
  });

  test('deve mudar status do fornecedor na view de detalhes', async ({
    page,
  }) => {
    test.skip(true, 'Implementar quando dados de teste estiverem disponíveis.');

    // Ir para detalhes de um fornecedor ativo
    await page.locator('[data-testid="supplier-actions-menu"]').first().click();
    await page.getByRole('menuitem', { name: /ver detalhes/i }).click();

    // Verificar status atual (ATIVO)
    await expect(page.getByTestId('supplier-status-badge')).toHaveText('ATIVO');

    // Abrir dropdown de status
    await page.getByRole('button', { name: /alterar status/i }).click();

    // Selecionar "INATIVO"
    await page.getByRole('menuitem', { name: 'INATIVO' }).click();

    // Verificar toast de sucesso
    await expect(page.getByText(/status alterado com sucesso/i)).toBeVisible({
      timeout: 5000,
    });

    // Verificar que badge mudou
    await expect(page.getByTestId('supplier-status-badge')).toHaveText(
      'INATIVO'
    );
  });

  test('deve exibir histórico de compras na view de detalhes', async ({
    page,
  }) => {
    test.skip(
      true,
      'Implementar quando integração com compras estiver disponível.'
    );

    // Ir para detalhes
    await page.locator('[data-testid="supplier-actions-menu"]').first().click();
    await page.getByRole('menuitem', { name: /ver detalhes/i }).click();

    // Verificar seção de histórico
    await expect(page.getByText(/histórico de compras/i)).toBeVisible();

    // Verificar que há pelo menos uma compra listada (ou mensagem de vazio)
    const purchaseItems = page.locator('[data-testid="purchase-history-item"]');
    const count = await purchaseItems.count();

    if (count > 0) {
      // Se há compras, verificar estrutura
      await expect(purchaseItems.first()).toBeVisible();
      await expect(purchaseItems.first().getByText(/data:/i)).toBeVisible();
      await expect(purchaseItems.first().getByText(/total:/i)).toBeVisible();
    } else {
      // Se não há compras, verificar mensagem de vazio
      await expect(page.getByText(/nenhuma compra registrada/i)).toBeVisible();
    }
  });

  test('deve atualizar lista ao clicar no botão refresh', async ({ page }) => {
    test.skip(true, 'Implementar quando dados de teste estiverem disponíveis.');

    // Clicar no botão de refresh
    const refreshButton = page.getByRole('button', { name: /atualizar/i });
    await refreshButton.click();

    // Verificar que houve uma requisição (loading state temporário)
    // Aguardar um pouco para a requisição completar
    await page.waitForTimeout(500);

    // Verificar que a tabela ainda está visível
    await expect(page.getByTestId('suppliers-table')).toBeVisible();
  });

  test('deve exibir empty state quando não há fornecedores', async ({
    page,
  }) => {
    test.skip(
      true,
      'Implementar quando puder simular estado vazio (filtros que não retornam nada).'
    );

    // Aplicar filtro que não retorna resultados
    await page.getByPlaceholder(/buscar por nome ou cnpj/i).fill('XYZABC123');
    await page.waitForTimeout(600);

    // Verificar mensagem de empty state
    await expect(page.getByText(/nenhum fornecedor encontrado/i)).toBeVisible();

    // Verificar que há botão para adicionar novo
    await expect(
      page.getByRole('button', { name: /adicionar fornecedor/i })
    ).toBeVisible();
  });

  test('deve abrir modal de criação ao clicar no botão do empty state', async ({
    page,
  }) => {
    test.skip(true, 'Implementar quando empty state estiver disponível.');

    // Aplicar filtro que não retorna resultados
    await page.getByPlaceholder(/buscar por nome ou cnpj/i).fill('XYZABC123');
    await page.waitForTimeout(600);

    // Clicar no botão de adicionar do empty state
    await page.getByRole('button', { name: /adicionar fornecedor/i }).click();

    // Verificar que modal abriu
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /novo fornecedor/i })
    ).toBeVisible();
  });

  test('deve validar campos obrigatórios ao tentar salvar sem preenchê-los', async ({
    page,
  }) => {
    test.skip(
      true,
      'Implementar quando validação de formulário estiver completa.'
    );

    // Abrir modal
    await page.getByRole('button', { name: /novo fornecedor/i }).click();

    // Tentar salvar sem preencher nada
    await page.getByRole('button', { name: /salvar/i }).click();

    // Verificar mensagem de erro no campo nome (obrigatório)
    await expect(page.getByText(/nome é obrigatório/i)).toBeVisible();

    // Modal deve permanecer aberto
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('deve cancelar criação e fechar modal', async ({ page }) => {
    test.skip(true, 'Implementar quando modal estiver disponível.');

    // Abrir modal
    await page.getByRole('button', { name: /novo fornecedor/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Preencher algum campo
    await page.getByLabel(/nome/i).fill('Fornecedor Teste');

    // Clicar em cancelar
    await page.getByRole('button', { name: /cancelar/i }).click();

    // Verificar que modal fechou
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Verificar que fornecedor não foi criado (não aparece na lista)
    await expect(page.getByText('Fornecedor Teste')).not.toBeVisible();
  });

  test('deve mostrar aviso ao tentar fechar modal com alterações não salvas', async ({
    page,
  }) => {
    test.skip(
      true,
      'Implementar quando sistema de unsaved changes estiver disponível.'
    );

    // Abrir modal
    await page.getByRole('button', { name: /novo fornecedor/i }).click();

    // Preencher campo
    await page.getByLabel(/nome/i).fill('Fornecedor com mudanças');

    // Clicar no X ou fora do modal para fechar
    await page.getByRole('button', { name: /close/i }).click();

    // Verificar diálogo de confirmação
    await expect(
      page.getByText(/você tem alterações não salvas/i)
    ).toBeVisible();

    // Clicar em "Continuar editando"
    await page.getByRole('button', { name: /continuar editando/i }).click();

    // Modal deve permanecer aberto
    await expect(page.getByRole('dialog')).toBeVisible();
  });
});

test.describe('Suppliers - Responsividade', () => {
  test('deve exibir layout de cards em mobile', async ({ page }) => {
    test.skip(true, 'Implementar quando dados de teste estiverem disponíveis.');

    // Configurar viewport mobile
    await page.setViewportSize({ width: 375, height: 667 });

    // Navegar para página
    await page.goto('/fornecedores');

    // Verificar que tabela desktop está oculta
    await expect(page.getByTestId('suppliers-table-desktop')).not.toBeVisible();

    // Verificar que cards mobile estão visíveis
    await expect(page.getByTestId('suppliers-cards-mobile')).toBeVisible();

    // Verificar estrutura do card
    const firstCard = page
      .locator('[data-testid="supplier-card-mobile"]')
      .first();
    await expect(firstCard).toBeVisible();
    await expect(firstCard.getByTestId('supplier-name')).toBeVisible();
    await expect(firstCard.getByTestId('supplier-status-badge')).toBeVisible();
    await expect(firstCard.getByTestId('supplier-cnpj')).toBeVisible();
    await expect(firstCard.getByTestId('supplier-phone')).toBeVisible();
  });

  test('deve exibir tabela em desktop', async ({ page }) => {
    test.skip(true, 'Implementar quando dados de teste estiverem disponíveis.');

    // Configurar viewport desktop
    await page.setViewportSize({ width: 1280, height: 720 });

    // Navegar para página
    await page.goto('/fornecedores');

    // Verificar que tabela desktop está visível
    await expect(page.getByTestId('suppliers-table-desktop')).toBeVisible();

    // Verificar que cards mobile estão ocultos
    await expect(page.getByTestId('suppliers-cards-mobile')).not.toBeVisible();
  });
});
