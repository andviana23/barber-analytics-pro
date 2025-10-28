# 📊 Módulo DRE (Demonstração do Resultado do Exercício)

> **Geração automática da DRE consolidando receitas e despesas diretamente do Supabase.**
>
> **Criado em:** 2024-10-18  
> **Atualizado em:** 2025-10-22  
> **Autor:** Codex (IA)

---

## 🎯 Visão Geral

O módulo DRE calcula automaticamente a **Demonstração do Resultado do Exercício**, apresentando lucratividade por período (mês, ano, intervalo customizado). A solução utiliza funções SQL para consolidar dados e expõe o resultado via serviços e hooks React.

---

## 🔑 Características

- ✅ **Cálculo 100% automatizado** — extrai dados das tabelas `revenues` e `expenses`.
- ✅ **Hierarquia contábil fixa** — demonstração em níveis (Receita Bruta → Deduções → Resultado Operacional → Resultado Líquido).
- ✅ **Indicadores derivados** — margens, percentuais e comparativo com períodos anteriores.
- ✅ **Exportação** — suporte a exportação textual (ex.: TXT/CSV) direto da UI.

---

## 🧱 Arquitetura

| Camada   | Artefatos                                          | Papel                                        |
| -------- | -------------------------------------------------- | -------------------------------------------- |
| UI       | `src/pages/DREPage.jsx`                            | Interface e filtros de período               |
| Hooks    | `src/hooks/useDRE.js`                              | Busca/estado do relatório com TanStack Query |
| Services | `src/services/dreService.js`                       | Orquestra chamadas, normaliza respostas      |
| Domain   | DTOs em `src/dtos/revenueDTO.js` / `expenseDTO.js` | Garantem consistência e labels               |
| Infra    | Função SQL `fn_calculate_dre` (Supabase)           | Cálculo agregado no banco                    |

---

## 🧮 Função SQL `fn_calculate_dre`

- **Arquivo:** `supabase/migrations/create_dre_function.sql`
- **Assinatura:**
  ```sql
  fn_calculate_dre(p_unit_id uuid, p_start_date date, p_end_date date) returns json
  ```
- **Responsabilidades:**
  - Classificar receitas e despesas em categorias contábeis.
  - Calcular totais e subtotais (bruta, líquida, custos, despesas operacionais, impostos).
  - Retornar JSON estruturado com metadados de período e resultados.

### Exemplo de Chamada

```sql
SELECT fn_calculate_dre('uuid-da-unidade', '2025-01-01', '2025-01-31');
```

---

## 🔄 Fluxo de Geração

1. Usuário seleciona período/unidade em `DREPage`.
2. Hook `useDRE` aciona `dreService.fetchDRE(periodo)`.
3. `dreService` chama Supabase RPC (`fn_calculate_dre`) com parâmetros.
4. Resposta JSON é normalizada (labels PT-BR, percentuais, formatação monetária).
5. UI exibe tabela hierárquica e indicadores.

---

## 🎨 UI & Experiência

- Tabela hierárquica com níveis recolhíveis.
- Destaque para Resultado Bruto e Resultado Líquido.
- Possibilidade de comparar com período anterior (variação %).

Componentes relevantes:

- `src/molecules/KPICard.jsx`
- `src/organisms/ConciliacaoPanel.jsx` (compartilha padrões)
- `src/templates/ManualReconciliationModal.jsx` (exportações e ajustes)

---

## 🧪 Qualidade

- Recomendações de teste:
  - Mock da RPC `fn_calculate_dre` com cenários de receitas/despesas distintas.
  - Garantir arredondamento consistente (`Intl.NumberFormat('pt-BR')`).
  - Validar UI em diferentes períodos (mês atual, YTD, customizado).

---

## 📌 Próximos Passos

1. Adicionar botão de exportação em PDF/CSV com template padronizado.
2. Implementar histórico comparativo multi-período (colunas adicionais).
3. Automatizar testes Playwright para geração da DRE.
