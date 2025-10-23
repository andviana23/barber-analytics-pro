# 📚 Barber Analytics Pro — Documentação Técnica

> **Hub central com políticas arquiteturais, guias de módulos, contratos de dados, testes e deploy do Barber Analytics Pro.**
>
> **Criado em:** 2025-10-22  
> **Autor:** Codex (IA)  
> **Projeto:** BARBER-ANALYTICS-PRO

---

## 🧭 Mapa Geral

| Categoria | Documentos |
|-----------|------------|
| 🧱 Arquitetura | [`ARQUITETURA.md`](ARQUITETURA.md) • [`ARCHITECTURE.md`](ARCHITECTURE.md) |
| 🔗 Contratos & Dados | [`CONTRATOS.md`](CONTRATOS.md) • [`DATABASE_SCHEMA.md`](DATABASE_SCHEMA.md) |
| 💼 Módulos de Negócio | [`FINANCIAL_MODULE.md`](FINANCIAL_MODULE.md) • [`DRE_MODULE.md`](DRE_MODULE.md) • [`LISTA_DA_VEZ_MODULE.md`](LISTA_DA_VEZ_MODULE.md) • [`IMPORT_REVENUES_FROM_STATEMENT.md`](IMPORT_REVENUES_FROM_STATEMENT.md) • [`RESET_MENSAL_CONTADORES.md`](RESET_MENSAL_CONTADORES.md) |
| 🎨 Design & Experiência | [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) |
| 🧪 Qualidade | [`TESTING.md`](TESTING.md) |
| 🚀 Operações | [`DEPLOY.md`](DEPLOY.md) |
| 🗞️ Histórico | [`CHANGELOG.md`](CHANGELOG.md) |

---

## 🧱 Convenções Globais

- 🧭 Estrutura hierárquica H1 → H2 → H3 com ícones.
- 🎨 Paleta e tipografia definidas em [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md).
- 🧪 Testes documentados e rastreados via [`TESTING.md`](TESTING.md).
- 🔐 Segurança baseada em Supabase RLS, documentada em [`ARQUITETURA.md`](ARQUITETURA.md).

---

## 🛠️ Como usar este diretório

1. **Leitura inicial:** comece por `ARQUITETURA.md` para entender camadas e fluxos.  
2. **Negócio:** consulte os módulos específicos conforme a área funcional.  
3. **Execução:** siga `TESTING.md` e `DEPLOY.md` para validar e publicar alterações.  
4. **Histórico:** acompanhe evolução pelo `CHANGELOG.md`.

---

## 📌 Referências rápidas

- 🔗 Repositório: pasta raiz do projeto (`README.md`).
- 🗄️ Migrações: `supabase/migrations/*`.
- 🛰️ Edge Functions: `supabase/functions/*`.
- 🧪 Suite de testes: `src/__tests__` e `src/test`.

