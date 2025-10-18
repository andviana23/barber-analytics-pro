# 🚀 DRE - Quick Start Guide

> **Guia rápido para usar o módulo DRE no BARBER-ANALYTICS-PRO**

---

## ✅ O que foi implementado?

Um sistema completo de **DRE (Demonstração do Resultado do Exercício)** que:

- 📊 Calcula automaticamente receitas e despesas
- 🏷️ Agrupa por categorias predefinidas
- 📈 Gera indicadores financeiros (margens)
- 💾 Permite exportar em formato TXT
- 🔄 Compara períodos diferentes
- 🎨 Interface visual moderna e responsiva

---

## 🎯 Como usar?

### 1️⃣ Acessar o DRE

```
1. Faça login como admin ou gerente
2. Navegue para: /dre
3. O sistema carregará o DRE do mês atual automaticamente
```

### 2️⃣ Filtrar por Período

Você pode visualizar o DRE de 3 formas:

- **Mês Atual** - Clique no botão "Mês Atual"
- **Ano Atual** - Clique no botão "Ano Atual" (acumulado)
- **Período Customizado** - Selecione datas específicas

### 3️⃣ Interpretar os Resultados

O DRE mostra:

```
RECEITA BRUTA (todas as entradas)
  ↓
(-) CUSTOS OPERACIONAIS (gastos diretos)
  ↓
= MARGEM DE CONTRIBUIÇÃO (quanto sobra)
  ↓
(-) DESPESAS ADMINISTRATIVAS (gastos fixos)
  ↓
= EBIT (resultado operacional)
  ↓
(-) IMPOSTOS
  ↓
= LUCRO LÍQUIDO (resultado final)
```

### 4️⃣ Indicadores Importantes

| Indicador                  | O que significa                  | Ideal    |
| -------------------------- | -------------------------------- | -------- |
| **Margem de Contribuição** | Quanto sobra após custos diretos | > 50%    |
| **Margem EBIT**            | Resultado operacional            | > 10%    |
| **Margem Líquida**         | Lucro final                      | Positivo |

### 5️⃣ Exportar Relatório

1. Clique no botão "Exportar TXT"
2. Arquivo será baixado automaticamente
3. Nome: `DRE_NomeDaUnidade_DataInicio_DataFim.txt`

---

## ⚙️ Configuração Inicial

### Passo 1: Verificar Categorias

As categorias já estão criadas no banco. Para verificar:

```sql
SELECT name, category_type, parent_id
FROM categories
WHERE is_active = true
ORDER BY category_type, parent_id NULLS FIRST;
```

### Passo 2: Lançar Receitas e Despesas

**⚠️ IMPORTANTE:** Sempre vincule a categoria correta!

**Exemplo de Receita:**

```javascript
{
  type: 'service',
  value: 150.00,
  date: '2024-01-15',
  category_id: 'uuid-da-categoria-assinatura', // ← Obrigatório
  unit_id: 'uuid-da-unidade'
}
```

**Exemplo de Despesa:**

```javascript
{
  type: 'other',
  value: 5000.00,
  date: '2024-01-20',
  category_id: 'uuid-da-categoria-comissoes', // ← Obrigatório
  unit_id: 'uuid-da-unidade'
}
```

---

## 🏷️ Mapeamento de Categorias

### Receitas

| Lançar como                   | Categoria      |
| ----------------------------- | -------------- |
| Mensalidade de cliente        | **Assinatura** |
| Serviço avulso (corte, barba) | **Avulso**     |
| Venda de produto              | **Cosméticos** |

### Despesas Operacionais

| Lançar como                  | Categoria                   |
| ---------------------------- | --------------------------- |
| Café, cerveja, água          | **Bebidas e cortesias**     |
| Bônus de meta                | **Bonificações e metas**    |
| Pagamento de comissão        | **Comissões**               |
| Lavanderia, produtos limpeza | **Limpeza e lavanderia**    |
| Lâminas, cremes, shampoos    | **Produtos de uso interno** |

### Despesas Administrativas

| Lançar como              | Categoria                 |
| ------------------------ | ------------------------- |
| Aluguel do ponto         | **Aluguel e condomínio**  |
| Contador                 | **Contabilidade**         |
| Luz, água, internet      | **Contas fixas**          |
| INSS, FGTS, benefícios   | **Encargos e benefícios** |
| Manutenção, seguros      | **Manutenção e Seguros**  |
| Facebook Ads, Google Ads | **Marketing e Comercial** |
| Salários fixos           | **Salários / Pró-labore** |
| Assinaturas de software  | **Sistemas**              |

### Impostos

| Lançar como    | Categoria            |
| -------------- | -------------------- |
| Imposto mensal | **Simples Nacional** |

---

## 🔍 Troubleshooting

### ❌ "Sem movimentações no período"

**Solução:**

- Verifique se há receitas/despesas lançadas no período
- Confirme que `is_active = true`
- Confirme que a unidade está correta

### ❌ "Valores zerados em algumas categorias"

**Solução:**

- Certifique-se de que as movimentações têm `category_id` preenchido
- Verifique se o nome da categoria está exatamente igual ao esperado
- Execute a query de verificação de categorias

### ❌ "Erro ao calcular DRE"

**Solução:**

1. Abra o Console do navegador (F12)
2. Verifique erros de JavaScript
3. Confirme que a função `fn_calculate_dre` existe no banco:
   ```sql
   SELECT proname FROM pg_proc WHERE proname = 'fn_calculate_dre';
   ```

---

## 📊 Exemplo Prático

### Cenário: Janeiro 2024

**Você lançou:**

- 50 assinaturas de R$ 150 = R$ 7.500
- 30 cortes avulsos de R$ 50 = R$ 1.500
- 10 produtos vendidos de R$ 80 = R$ 800
- Comissões pagas: R$ 2.000
- Aluguel: R$ 3.000
- Impostos: 8% sobre EBIT

**DRE resultante:**

```
RECEITA BRUTA ..................... R$ 9.800,00

(-) CUSTOS OPERACIONAIS
    Comissões ..................... (R$ 2.000,00)

= MARGEM DE CONTRIBUIÇÃO .......... R$ 7.800,00 (79,59%)

(-) DESPESAS ADMINISTRATIVAS
    Aluguel ....................... (R$ 3.000,00)

= EBIT ............................ R$ 4.800,00 (48,98%)

(-) IMPOSTOS
    Simples Nacional (8%) ......... (R$ 384,00)

= LUCRO LÍQUIDO ................... R$ 4.416,00 (45,06%)
```

✅ **Resultado:** Excelente! Margem líquida de 45%.

---

## 🎓 Boas Práticas

### ✅ Faça

- Lance todas as movimentações com categoria
- Exporte o DRE mensalmente
- Compare com o mês anterior
- Acompanhe as margens

### ❌ Não Faça

- Não deixe lançamentos sem categoria
- Não altere nomes das categorias manualmente
- Não exclua categorias em uso

---

## 📞 Suporte Técnico

### Arquivos de Referência

- **Documentação completa:** `docs/DRE_MODULE.md`
- **Código-fonte:**
  - `src/services/dreService.js`
  - `src/hooks/useDRE.js`
  - `src/pages/DREPage.jsx`
- **Banco de dados:**
  - Migration: `create_dre_function.sql`

### Comandos Úteis

```sql
-- Ver todas as categorias
SELECT * FROM categories WHERE is_active = true;

-- Testar função DRE
SELECT fn_calculate_dre(
  (SELECT id FROM units LIMIT 1),
  '2024-01-01',
  '2024-01-31'
);

-- Ver receitas do mês
SELECT date, value, category_id
FROM revenues
WHERE date >= '2024-01-01' AND date <= '2024-01-31'
AND is_active = true;

-- Ver despesas do mês
SELECT date, value, category_id
FROM expenses
WHERE date >= '2024-01-01' AND date <= '2024-01-31'
AND is_active = true;
```

---

## 🎉 Pronto!

Agora você está pronto para usar o módulo DRE.

**Dúvidas?** Consulte a documentação completa em `docs/DRE_MODULE.md`

---

**📅 Criado em:** 2024-10-18  
**✍️ Por:** AI Agent - BARBER-ANALYTICS-PRO  
**🚀 Versão:** 1.0.0
