# 📊 Relatório de Auditoria do Design System

**Data:** 01/11/2025, 14:21:05

## 📈 Resumo Geral

- **Total de Arquivos:** 367
- **Arquivos com Violações:** 21
- **Arquivos Limpos:** 346
- **Total de Violações:** 31
- **Taxa de Conformidade:** 94.28%

## 🔴 Violações por Tipo

| Tipo | Severidade | Total | Arquivos |
|------|------------|-------|----------|
| Estilos inline (evitar quando possível) | MEDIUM | 22 | 14 |
| Gradientes inline sem tokens (bg-gradient-to-*) | HIGH | 5 | 5 |
| Cores hardcoded (bg-white, bg-gray-*, text-gray-*, border-gray-*) | CRITICAL | 4 | 4 |

## 📁 Top 20 Arquivos com Mais Violações

| # | Arquivo | Violações |
|---|---------|----------|
| 1 | `src/utils/performance.jsx` | 3 |
| 2 | `src/pages/ListaDaVezPage/ListaDaVezPage.jsx` | 3 |
| 3 | `src/pages/DashboardPage/DashboardPage.jsx` | 3 |
| 4 | `src/molecules/CategoryHierarchicalDropdown/CategoryHierarchicalDropdown.jsx` | 2 |
| 5 | `src/components/ThemeValidator/ThemeValidator.jsx` | 2 |
| 6 | `src/atoms/PartySelector/PartySelector.jsx` | 2 |
| 7 | `src/components/templates/modals/OrderPaymentModal.jsx` | 2 |
| 8 | `src/organisms/OrderItemsTable.jsx` | 1 |
| 9 | `src/molecules/OrderItemRow.jsx` | 1 |
| 10 | `src/atoms/AnimatedComponents.jsx` | 1 |
| 11 | `src/pages/UnitsPage/UnitsComparison.jsx` | 1 |
| 12 | `src/pages/LoginPage/LoginPage.jsx` | 1 |
| 13 | `src/pages/GoalsPage/GoalsPage.jsx` | 1 |
| 14 | `src/pages/FinanceiroAdvancedPage/ContasBancariasTab.jsx` | 1 |
| 15 | `src/organisms/PalettePreview/PalettePreview.jsx` | 1 |
| 16 | `src/organisms/ConciliacaoPanel/ConciliacaoPanel.jsx` | 1 |
| 17 | `src/organisms/BarbeiroHeader/BarbeiroHeader.jsx` | 1 |
| 18 | `src/molecules/SupplierModals/SupplierInfoModal.jsx` | 1 |
| 19 | `src/molecules/ChartComponent/ChartComponent.jsx` | 1 |
| 20 | `src/molecules/CashflowChartCard/CashflowChartCard.jsx` | 1 |

## ✅ Tokens Disponíveis

- `.card-theme`
- `.text-theme-primary`
- `.text-theme-secondary`
- `.btn-theme-primary`
- `.btn-theme-secondary`
- `.input-theme`
- `bg-light-surface`
- `bg-dark-surface`
