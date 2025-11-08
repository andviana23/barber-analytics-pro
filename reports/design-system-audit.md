# 📊 Relatório de Auditoria do Design System

**Data:** 08/11/2025, 13:18:24

## 📈 Resumo Geral

- **Total de Arquivos:** 403
- **Arquivos com Violações:** 29
- **Arquivos Limpos:** 374
- **Total de Violações:** 76
- **Taxa de Conformidade:** 92.80%

## 🔴 Violações por Tipo

| Tipo | Severidade | Total | Arquivos |
|------|------------|-------|----------|
| Estilos inline (evitar quando possível) | MEDIUM | 26 | 16 |
| Valores hexadecimais inline (bg-[#...], text-[#...], border-[#...]) | CRITICAL | 14 | 1 |
| Gradientes inline sem tokens (bg-gradient-to-*) | HIGH | 31 | 10 |
| Cores hardcoded (bg-white, bg-gray-*, text-gray-*, border-gray-*) | CRITICAL | 5 | 5 |

## 📁 Top 20 Arquivos com Mais Violações

| # | Arquivo | Violações |
|---|---------|----------|
| 1 | `src/templates/NovaDespesaModal/index.jsx` | 14 |
| 2 | `src/pages/FinanceiroAdvancedPage/ContasBancariasTab.jsx` | 10 |
| 3 | `src/pages/FinanceiroAdvancedPage/DespesasAccrualTabRefactored.jsx` | 6 |
| 4 | `src/pages/FinanceiroAdvancedPage/ReceitasAccrualTab.jsx` | 5 |
| 5 | `src/utils/performance.jsx` | 3 |
| 6 | `src/pages/ListaDaVezPage/ListaDaVezPage.jsx` | 3 |
| 7 | `src/pages/FinanceiroAdvancedPage/FluxoTabRefactored.jsx` | 3 |
| 8 | `src/pages/FinanceiroAdvancedPage/FinanceiroAdvancedPage.jsx` | 3 |
| 9 | `src/pages/DashboardPage/DashboardPage.jsx` | 3 |
| 10 | `src/molecules/FluxoCaixaTimeline.jsx` | 2 |
| 11 | `src/molecules/CategoryHierarchicalDropdown/CategoryHierarchicalDropdown.jsx` | 2 |
| 12 | `src/molecules/CashflowTable/CashflowTable.jsx` | 2 |
| 13 | `src/components/ThemeValidator/ThemeValidator.jsx` | 2 |
| 14 | `src/atoms/PartySelector/PartySelector.jsx` | 2 |
| 15 | `src/components/templates/modals/OrderPaymentModal.jsx` | 2 |
| 16 | `src/organisms/OrderItemsTable.jsx` | 1 |
| 17 | `src/molecules/OrderItemRow.jsx` | 1 |
| 18 | `src/molecules/ChartContainer.jsx` | 1 |
| 19 | `src/atoms/AnimatedComponents.jsx` | 1 |
| 20 | `src/pages/UnitsPage/UnitsComparison.jsx` | 1 |

## ✅ Tokens Disponíveis

- `.card-theme`
- `.text-theme-primary`
- `.text-theme-secondary`
- `.btn-theme-primary`
- `.btn-theme-secondary`
- `.input-theme`
- `bg-light-surface`
- `bg-dark-surface`
