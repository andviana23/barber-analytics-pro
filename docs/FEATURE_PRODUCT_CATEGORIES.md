# 📦 Feature: Gestão de Categorias de Produtos

**Data:** 14/11/2025
**Versão:** 2.0.0
**Autor:** Andrey Viana

---

## 🎯 Objetivo

Implementar sistema completo de gestão de **Categorias de Produtos** com capacidade de vinculação com **Categorias de Receita** (Revenue), permitindo melhor organização e controle financeiro.

---

## ✅ Implementação Completa

### 1. 🗄️ Banco de Dados

**Migration executada:**

```sql
-- Adicionar coluna parent_category_id
ALTER TABLE product_categories
  ADD COLUMN parent_category_id uuid REFERENCES categories(id) ON DELETE SET NULL;

-- Índice para performance
CREATE INDEX idx_product_categories_parent_id
  ON product_categories(parent_category_id)
  WHERE parent_category_id IS NOT NULL;
```

**Estrutura final da tabela `product_categories`:**

- `id` (uuid, PK)
- `name` (varchar, NOT NULL)
- `description` (text, nullable)
- `is_active` (boolean, default true)
- `parent_category_id` (uuid, FK → categories.id, nullable)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

---

### 2. 📂 Camadas Implementadas

#### **Repository Layer**

`src/repositories/productCategoryRepository.js`

Métodos:

- `findAll()` - Buscar todas categorias ativas
- `findById(id)` - Buscar por ID
- `create(data)` - Criar nova categoria
- `update(id, data)` - Atualizar categoria
- `delete(id)` - Soft delete
- `getRevenueCategories(unitId)` - Buscar categorias de receita (Revenue)

**Integração:** Supabase client com queries SQL

---

#### **Service Layer**

`src/services/productCategoryService.js`

Funcionalidades:

- ✅ Validação de dados (nome mínimo 2 caracteres)
- ✅ Normalização de inputs (trim, normalizeCase)
- ✅ Suporte a `parent_category_id` (vinculação com Revenue)
- ✅ Logging de operações
- ✅ Retorno padrão `{ data, error }`

Métodos:

- `findAll()`
- `findById(id)`
- `create(data)`
- `update(id, data)`
- `delete(id)` - Soft delete
- `getRevenueCategories(unitId)` - Buscar categorias de receita

---

#### **Hooks Layer**

`src/hooks/useProductCategories.js`

Custom hooks com **TanStack Query**:

| Hook                           | Tipo        | Descrição                                  |
| ------------------------------ | ----------- | ------------------------------------------ |
| `useProductCategories()`       | useQuery    | Buscar todas categorias (5min stale)       |
| `useProductCategory(id)`       | useQuery    | Buscar categoria específica                |
| `useRevenueCategories(unitId)` | useQuery    | Buscar categorias Revenue (10min stale)    |
| `useCreateProductCategory()`   | useMutation | Criar categoria + invalidate cache + toast |
| `useUpdateProductCategory()`   | useMutation | Atualizar com optimistic update            |
| `useDeleteProductCategory()`   | useMutation | Soft delete + invalidate cache             |

**Features:**

- ✅ Cache automático
- ✅ Refetch on demand
- ✅ Toast notifications (sucesso/erro)
- ✅ Invalidação de cache após mutations

---

#### **UI Layer**

**1. Modal Component**
`src/molecules/ProductCategoryModal/ProductCategoryModal.jsx`

Features:

- ✅ Form validado (nome obrigatório, mínimo 2 chars)
- ✅ Campo descrição (opcional, max 500 chars)
- ✅ Dropdown de categorias de receita (parent_category_id)
- ✅ Loading states
- ✅ Error handling
- ✅ Responsive (mobile-first)
- ✅ Design System tokens (`.card-theme`, `.input-theme`, `.text-theme-*`)
- ✅ Suporta criação e edição

**Props:**

```jsx
<ProductCategoryModal
  isOpen={boolean}
  onClose={() => void}
  category={object | null}  // Para edição
/>
```

---

**2. Integração na Products Page**
`src/pages/ProductsPage/ProductsPage.jsx`

Mudanças:

- ✅ Import do `ProductCategoryModal`
- ✅ Estado `isCategoryModalOpen`
- ✅ Botão "Nova Categoria" no header (ao lado de "Novo Produto")
- ✅ Ícone `FolderPlus` do lucide-react
- ✅ Apenas visível para `admin` e `gerente`
- ✅ Responsive (texto oculto em mobile)

```jsx
<button
  onClick={() => setIsCategoryModalOpen(true)}
  className="flex items-center gap-2 rounded-xl border border-primary px-4 py-2.5 text-primary transition-all hover:bg-primary/10"
>
  <FolderPlus className="h-5 w-5" />
  <span className="hidden sm:inline">Nova Categoria</span>
</button>
```

---

## 🚀 Como Usar

### 1. Criar Categoria de Produto

1. Ir para `/produtos`
2. Clicar em **"Nova Categoria"** (header)
3. Preencher:
   - **Nome:** Ex: "Produtos de Revenda"
   - **Descrição:** (Opcional) Ex: "Produtos para venda ao cliente"
   - **Categoria de Receita:** Selecionar Revenue parent (opcional)
4. Clicar em **"Criar Categoria"**

### 2. Vincular com Categoria de Receita

Exemplo prático:

- **Categoria de Produto:** "Pomadas e Cremes"
- **Vinculada com:** Categoria Revenue "Produtos" ou "Revenda"
- **Benefício:** Relatórios financeiros mostram produtos vinculados à receita

### 3. Usar em Produtos

Ao criar/editar produto, a categoria de produto aparecerá no dropdown de categorias.

---

## 🔒 Permissões

| Role            | Criar | Editar | Deletar |
| --------------- | ----- | ------ | ------- |
| `admin`         | ✅    | ✅     | ✅      |
| `gerente`       | ✅    | ✅     | ✅      |
| `barbeiro`      | ❌    | ❌     | ❌      |
| `recepcionista` | ❌    | ❌     | ❌      |

**RLS (Row Level Security):** Aplicado automaticamente pela service layer

---

## 📊 Exemplo de Uso Real

### Cenário: Barbearia com Revenda de Produtos

**Categorias de Receita (categories):**

- Serviços → cortes, barba, etc.
- Produtos → revenda de pomadas, shampoos
- Assinatura → planos mensais

**Categorias de Produto (product_categories):**

1. **Pomadas e Cremes**
   - parent_category_id → "Produtos" (Revenue)
   - Descrição: "Produtos para cabelo e barba"

2. **Uso Interno**
   - parent_category_id → NULL
   - Descrição: "Produtos para uso no salão"

3. **Revenda**
   - parent_category_id → "Produtos" (Revenue)
   - Descrição: "Produtos para venda ao cliente"

**Produtos:**

- "Pomada Matte" → Categoria: "Pomadas e Cremes" (vinculada a Revenue "Produtos")
- "Shampoo Anti-Resíduo" → Categoria: "Uso Interno" (sem vínculo Revenue)

**Benefício:**

- Relatório DRE mostra que receita "Produtos" vem de vendas de "Pomadas" e "Revenda"
- Melhor controle de margem por categoria
- Separação clara entre uso interno e revenda

---

## 🧪 Testando a Feature

### 1. Teste Manual

```bash
# 1. Iniciar dev server
npm run dev

# 2. Acessar localhost:5173/produtos
# 3. Clicar em "Nova Categoria"
# 4. Preencher form e salvar
# 5. Verificar toast de sucesso
# 6. Categoria aparece no dropdown de produtos
```

### 2. Teste via Supabase

```sql
-- Listar categorias de produto
SELECT
  pc.id,
  pc.name,
  pc.description,
  c.name as parent_category_name,
  pc.is_active
FROM product_categories pc
LEFT JOIN categories c ON c.id = pc.parent_category_id
WHERE pc.is_active = true;
```

### 3. Teste de Permissões

```javascript
// Como barbeiro (deve falhar)
const { data, error } = await productCategoryService.create(
  {
    name: 'Teste',
  },
  { role: 'barbeiro' }
);
// Esperado: error = "Sem permissão"

// Como admin (deve funcionar)
const { data, error } = await productCategoryService.create(
  {
    name: 'Teste',
  },
  { role: 'admin' }
);
// Esperado: data = { id, name: 'Teste', ... }
```

---

## 🐛 Troubleshooting

### Erro: "parent_category_id não existe"

**Solução:** Rodar migration:

```sql
ALTER TABLE product_categories
  ADD COLUMN parent_category_id uuid REFERENCES categories(id);
```

### Erro: "useRevenueCategories retorna vazio"

**Causa:** Não há categorias Revenue cadastradas na unidade
**Solução:** Criar categoria Revenue em `/categorias`

### Modal não abre

**Verificar:**

1. `isCategoryModalOpen` está definido no estado?
2. Import do modal está correto?
3. Console do navegador tem erros?

---

## 📈 Próximos Passos

### Melhorias Futuras:

1. **Página dedicada de categorias**
   - Listar/editar/deletar categorias
   - Tree view com hierarquia
   - Drag & drop para reordenar

2. **Bulk import de categorias**
   - CSV/Excel com mapeamento automático

3. **Dashboard de categorias**
   - Produtos por categoria
   - Valor total em estoque por categoria
   - Top categorias mais vendidas

4. **Subcategorias**
   - Hierarquia `product_categories` → `product_subcategories`
   - Ex: "Pomadas" → "Matte", "Brilho", "Forte"

5. **Relatórios avançados**
   - DRE por categoria de produto
   - Margem por categoria
   - Comparativo mensal

---

## 📚 Referências

- [Clean Architecture](../docs/02_ARCHITECTURE.md)
- [Domain Model](../docs/03_DOMAIN_MODEL.md)
- [Design System](../docs/DESIGN_SYSTEM.md)
- [Testing Strategy](../docs/08_TESTING_STRATEGY.md)

---

## ✅ Checklist de Implementação

- [x] Migration: Adicionar `parent_category_id` a `product_categories`
- [x] Repository: CRUD + `getRevenueCategories()`
- [x] Service: Validação + lógica de negócio
- [x] Hooks: TanStack Query com cache e mutations
- [x] Modal: UI completa com form validado
- [x] ProductsPage: Botão "Nova Categoria" integrado
- [x] Permissões: Admin e Gerente apenas
- [x] Design System: Classes utilitárias aplicadas
- [x] Logging: Logger integrado no service
- [x] Error handling: Toast notifications
- [x] Soft delete: `is_active = false`
- [x] Documentação: Este arquivo

---

**Status:** ✅ **Implementação Completa**
**Pronto para:** Testes + Deploy

---

**Última atualização:** 14/11/2025
**Versão:** 1.0.0
**Autor:** Andrey Viana
