# 📊 Relatório de Auditoria do Design System

**Data:** 31/10/2025, 00:21:08

## 📈 Resumo Geral

- **Total de Arquivos:** 367
- **Arquivos com Violações:** 128
- **Arquivos Limpos:** 239
- **Total de Violações:** 2129
- **Taxa de Conformidade:** 65.12%

## 🔴 Violações por Tipo

| Tipo | Severidade | Total | Arquivos |
|------|------------|-------|----------|
| Estilos inline (evitar quando possível) | MEDIUM | 28 | 16 |
| Cores hardcoded (bg-white, bg-gray-*, text-gray-*, border-gray-*) | CRITICAL | 1854 | 116 |
| Gradientes inline sem tokens (bg-gradient-to-*) | HIGH | 161 | 35 |
| Elementos sem suporte a dark mode | HIGH | 83 | 32 |
| Valores hexadecimais inline (bg-[#...], text-[#...], border-[#...]) | CRITICAL | 3 | 1 |

## 📁 Top 20 Arquivos com Mais Violações

| # | Arquivo | Violações |
|---|---------|----------|
| 1 | `src\pages\FinanceiroAdvancedPage\DespesasAccrualTab.jsx` | 84 |
| 2 | `src\templates\ImportStatementModal.jsx` | 73 |
| 3 | `src\pages\GoalsPage\GoalsPage.jsx` | 72 |
| 4 | `src\pages\FinanceiroAdvancedPage\ContasBancariasTab.jsx` | 70 |
| 5 | `src\pages\CommissionReportPage.jsx` | 58 |
| 6 | `src\templates\NovaDespesaModal.jsx` | 56 |
| 7 | `src\templates\ImportExpensesFromOFXModal.jsx` | 42 |
| 8 | `src\pages\ClientsPage\ClientsPage.jsx` | 42 |
| 9 | `src\molecules\ProductModals\EditProductModal.jsx` | 41 |
| 10 | `src\molecules\ProductModals\CreateProductModal.jsx` | 41 |
| 11 | `src\pages\UserManagementPage\UserManagementPage.jsx` | 37 |
| 12 | `src\pages\RelatoriosPage\RelatoriosPage.jsx` | 37 |
| 13 | `src\pages\SuppliersPage\SuppliersPage.jsx` | 35 |
| 14 | `src\pages\PaymentMethodsPage\PaymentMethodsPage.jsx` | 35 |
| 15 | `src\organisms\FluxoSummaryPanel\FluxoSummaryPanel.jsx` | 35 |
| 16 | `src\components\finance\ImportExpensesFromOFXModal.jsx` | 34 |
| 17 | `src\components\finance\DREDynamicView.jsx` | 34 |
| 18 | `src\pages\RelatoriosPage\components\RelatorioDREMensal.old.jsx` | 33 |
| 19 | `src\pages\FinanceiroAdvancedPage\DespesasAccrualTabRefactored.jsx` | 32 |
| 20 | `src\pages\RelatoriosPage\components\RankingTable.jsx` | 32 |

## ✅ Tokens Disponíveis

- `.card-theme`
- `.text-theme-primary`
- `.text-theme-secondary`
- `.btn-theme-primary`
- `.btn-theme-secondary`
- `.input-theme`
- `bg-light-surface`
- `bg-dark-surface`
