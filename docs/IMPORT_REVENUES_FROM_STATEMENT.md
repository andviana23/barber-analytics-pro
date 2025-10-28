# 🧾 Importação de Receitas via Extrato Bancário

> **Pipeline para transformar arquivos OFX/CSV/Excel em receitas aprovadas no módulo financeiro.**
>
> **Criado em:** 2024-10-20  
> **Atualizado em:** 2025-10-22  
> **Autor:** Codex (IA)

---

## 🎯 Objetivo

Automatizar a entrada de receitas a partir de extratos bancários, reduzindo trabalho manual e garantindo consistência com o módulo financeiro (contabilidade por competência, reconciliação e DRE).

---

## 🔄 Fluxo End-to-End

1. **Upload** — usuário seleciona arquivo e conta bancária no modal (`ImportStatementModal`).
2. **Leitura e Validação** — `importRevenueFromStatement.js` utiliza `xlsx` para ler o arquivo e validar cabeçalhos.
3. **Normalização** — campos convertidos para formato padrão (`date`, `amount`, `description`, `type`).
4. **Dedupe** — geração de `hash_unique` para evitar duplicidade (`duplicateDetector`).
5. **Revisão** — UI apresenta tabela com status, permitindo excluir/ajustar manualmente.
6. **Persistência** — registros aprovados são enviados ao `revenueRepository.create()`.
7. **Conciliação** — integração automática com `bankStatementRepository` e `reconciliationService`.

---

## 🧱 Arquitetura

| Camada      | Componentes                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------ |
| 🎨 UI       | `ImportStatementModal`, `ImportReviewModal`, `ReconciliationMatchCard`                           |
| 🤖 Services | `importRevenueFromStatement.js`, `reconciliationService.js`, `bankFileParser.js`                 |
| 🧠 Domain   | DTOs (`revenueDTO`, `bankStatementDTO`) + `duplicateDetector.js`                                 |
| 🗄️ Infra    | `revenueRepository`, `bankStatementRepository`, Supabase (tabelas `revenues`, `bank_statements`) |

---

## 📥 Upload & Validação

- Formatos aceitos: `.xlsx`, `.xls`, `.csv`, `.ofx`.
- Colunas obrigatórias: **Data**, **Descrição**, **Valor**, **Tipo** (C/D).
- Colunas opcionais: **Item**, **Documento**.
- Funções chave: `readExcelFile`, `validateHeaders`, `normalizeData`.

```javascript
const mapping = {
  date: ['Data', 'DATE', 'Data Lançamento'],
  description: ['Descrição', 'Histórico'],
  value: ['Valor', 'VALUE', 'Valor R$'],
  type: ['Tipo', 'C/D'],
};
```

---

## 🧮 Normalização & Enriquecimento

- Conversão de datas (`date-fns`), parsing monetário e remoção de sinais.
- `hash_unique = md5(date + value + description)` para deduplicação.
- Enriquecimento opcional: categorias, profissionais, métodos de pagamento (quando identificados).
- Apenas lançamentos do tipo **Crédito (C)** seguem para aprovação como receita.

---

## ✅ Aprovação & Persitência

- UI permite aprovar/rejeitar registros individualmente.
- Payload final respeita a whitelist do `revenueDTO`.
- Persitência via `revenueRepository.create()` com logs de campos bloqueados/ignorados.
- Atualização do status do extrato (`bank_statements.status = reconciled`) quando conciliado.

---

## 🧪 Qualidade

- Fixtures em `tests/__fixtures__/financial.ts` suportam simulações.
- Recomendações:
  - Testes de importação com datasets grandes (>10k linhas) para checar performance.
  - Casos de borda: formatos mistos de data/valor, duplicidade, registros negativos.
  - E2E Playwright: upload → revisão → aprovação → verificação na UI financeira.

---

## 📌 Próximos Passos

1. Suporte a importação de débitos para automatizar despesas.
2. Integração com APIs bancárias para sincronização contínua.
3. Relatórios de auditoria (importações aprovadas, rejeitadas, pendentes).
