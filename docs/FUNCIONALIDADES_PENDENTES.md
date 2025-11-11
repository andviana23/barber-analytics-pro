# 📋 Funcionalidades Pendentes - Barber Analytics Pro

**Data:** 8 de novembro de 2025 (Atualizado)
**Baseado em:** Documentação oficial (docs/00-12)

---

## ✅ IMPLEMENTADO (Fase 1 e 2)

### Módulo Financeiro

- ✅ Fluxo de Caixa Acumulado (Demonstrativo diário)
- ✅ DRE (Demonstração do Resultado do Exercício)
- ✅ Receitas (CRUD completo)
- ✅ Despesas (CRUD completo)
- ✅ Conciliação Bancária (Importação Excel/CSV/OFX)
- ✅ Múltiplas Contas Bancárias
- ✅ Ajustes de Saldo
- ✅ Categorias de Receitas e Despesas
- ✅ Formas de Pagamento (Pix, Cartão, Dinheiro)
- ✅ Taxa e Prazo de Recebimento
- ✅ Regime de Competência (Accrual)
- ✅ Timeline de Evolução (Gráficos históricos)

### Módulo de Caixa

- ✅ Abertura de Caixa
- ✅ Fechamento de Caixa
- ✅ Relatório de Caixa
- ✅ Histórico de Caixas

### Módulo de Clientes

- ✅ CRM Completo (Cadastro, edição, exclusão)
- ✅ Histórico de Atendimentos
- ✅ Status (Ativo, Inativo, Bloqueado)

### Módulo de Agendamentos

- ✅ Lista da Vez (Sistema de Rodízio)
- ✅ Reset Automático Mensal (Cron Job)
- ✅ Histórico Mensal

### Infraestrutura

- ✅ Autenticação JWT (Supabase Auth)
- ✅ RLS (Row Level Security)
- ✅ RBAC (4 roles: Admin, Gerente, Barbeiro, Recepcionista)
- ✅ Multi-tenant (1 database, múltiplas unidades)

---

## 🔴 ALTA PRIORIDADE (Fase 3 - Q4 2025)

### ❌ REMOVIDO DO ESCOPO: Funcionalidades Externas via API

As seguintes funcionalidades **NÃO** serão implementadas neste sistema, pois virão através de **integração via API de sistema externo** no futuro:

- ❌ **Calendário de Agendamentos** - Sistema externo
- ❌ **Fidelização (Pontos e Resgates)** - Sistema externo
- ❌ **Assinaturas Recorrentes** - Sistema externo
- ❌ **Lembretes Automáticos (WhatsApp/SMS/E-mail)** - Sistema externo
- ❌ **Integração WhatsApp Business** - Sistema externo
- ❌ **Integração Google Calendar** - Sistema externo

**Justificativa:** Estas funcionalidades serão fornecidas por um sistema de agendamento e CRM especializado que se integrará ao Barber Analytics Pro via API REST.

---

## 🟠 MÉDIA PRIORIDADE (Fase 4 - Q4 2025)

Nenhuma funcionalidade de média prioridade no momento.

---

### Módulo de Comissões (Gestão Manual) ✅

**Complexidade:** Média
**Estimativa:** 8 pontos (1.5 dias)
**Status:** ✅ CONCLUÍDO

**Escopo Ajustado:** Gestão totalmente manual de comissões, sem cálculo automático.

**Critérios de Aceitação:**

- [x] Cadastrar comissão manualmente por profissional
- [x] Vincular comissão a serviço/comanda (opcional)
- [x] Editar valor de comissão
- [x] Marcar comissão como paga/pendente
- [x] Filtrar comissões por período, profissional, status
- [x] Exportar relatório de comissões para PDF
- [x] Exibir totalizadores (total pago, pendente, por profissional)

**Fluxo de Uso:**

1. Gerente/Admin acessa página de comissões
2. Cadastra manualmente comissão (profissional, valor, data, descrição)
3. Marca como "Paga" quando efetuar o pagamento
4. Exporta relatório mensal em PDF para prestação de contas

**Arquivos Criados/Modificados:**

- ✅ `supabase/migrations/create_commissions_table_and_rls_policies.sql` - Tabela e políticas RLS
- ✅ `src/services/commissionService.js` - Serviço de comissões
- ✅ `src/repositories/commissionRepository.js` - Repositório de comissões
- ✅ `src/hooks/useCommissions.js` - Hooks React Query para comissões
- ✅ `src/dtos/CommissionDTO.js` - DTOs e validação com Zod
- ✅ `src/pages/CommissionsPage.jsx` - Página principal de gestão de comissões
- ✅ `src/organisms/CommissionFormModal.jsx` - Modal de criação/edição de comissões
- ✅ `src/utils/exportCommissions.js` - Função de exportação PDF (adaptada)
- ✅ `src/organisms/Sidebar/Sidebar.jsx` - Adicionado item de menu "Comissões"
- ✅ `src/App.jsx` - Adicionada rota `/commissions`

**Banco de Dados:**

```sql
CREATE TABLE commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES units(id) NOT NULL,
  professional_id UUID REFERENCES professionals(id) NOT NULL,
  order_id UUID REFERENCES orders(id), -- Opcional
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  reference_date DATE NOT NULL,
  status VARCHAR(20) CHECK (status IN ('PENDING', 'PAID', 'CANCELLED')) DEFAULT 'PENDING',
  paid_at TIMESTAMPTZ,
  paid_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view_own_unit_commissions"
ON commissions FOR SELECT
USING (unit_id IN (SELECT get_user_unit_ids()));

CREATE POLICY "manage_commissions_admin_gerente"
ON commissions FOR ALL
USING (
  unit_id IN (SELECT get_user_unit_ids())
  AND get_user_role() IN ('administrador', 'gerente')
);
```

**Nota Importante:**

- ❌ **NÃO haverá cálculo automático de comissões**
- ❌ **NÃO haverá regras de comissão por serviço**
- ✅ **Gestão 100% manual pelo gerente/admin**
- ✅ **Foco em simplicidade e flexibilidade**

---

### RF-01.04: Despesas Recorrentes ✅

**Complexidade:** Média
**Estimativa:** 8 pontos (1.5 dias)
**Status:** ✅ CONCLUÍDO

**Critérios de Aceitação:**

- [x] Suportar despesas recorrentes (mensal, trimestral, anual)
- [x] Gerar parcelas automaticamente
- [x] Notificar vencimentos próximos
- [x] Marcar parcelas como pagas
- [x] Filtro "Recorrentes" na lista de despesas
- [x] Visualizar série de parcelas vinculadas
- [x] Pausar/retomar recorrência

**Arquivos Criados/Modificados:**

- ✅ `app/api/cron/gerar-despesas-recorrentes/route.ts` - Cron job para gerar parcelas automaticamente
- ✅ `lib/services/recurringExpenseNotifications.ts` - Serviço de notificações de vencimento
- ✅ `app/api/cron/enviar-alertas/route.ts` - Integração de notificações de vencimento
- ✅ `src/pages/FinanceiroAdvancedPage/DespesasAccrualTabRefactored.jsx` - UI melhorada com filtros e ações
- ✅ `vercel.json` - Configuração do cron job diário

**Banco de Dados:**

```sql
-- Já implementado anteriormente
ALTER TABLE expenses ADD COLUMN is_recurring BOOLEAN DEFAULT false;
ALTER TABLE expenses ADD COLUMN recurring_series_id UUID REFERENCES expenses(id);
ALTER TABLE expenses ADD COLUMN installment_number INTEGER;
ALTER TABLE expenses ADD COLUMN recurrence_metadata JSONB;
```

---

### RF-01.04: Anexar Comprovantes ✅

**Complexidade:** Baixa
**Estimativa:** 5 pontos (1 dia)
**Status:** ✅ CONCLUÍDO

**Critérios de Aceitação:**

- [x] Upload de arquivos (PDF, imagem)
- [x] Armazenar no Supabase Storage
- [x] Exibir preview do comprovante
- [x] Download de comprovante

**Arquivos Criados/Modificados:**

- ✅ `src/services/storageService.js` - Serviço completo de upload/download/delete
- ✅ `src/hooks/useFileUpload.js` - Hook React Query para gerenciar uploads
- ✅ `src/repositories/expenseAttachmentRepository.js` - Repositório de anexos de despesas
- ✅ `src/repositories/revenueAttachmentRepository.js` - Repositório de anexos de receitas
- ✅ `src/components/molecules/AttachmentCard.jsx` - Componente de preview e ações
- ✅ `src/components/molecules/AttachmentUploader.jsx` - Componente de upload com drag & drop
- ✅ `src/templates/NovaDespesaModal/index.jsx` - Integração de upload em despesas
- ✅ `src/components/modals/ExpenseEditModal.jsx` - Integração de upload em edição de despesas
- ✅ `src/templates/NovaReceitaAccrualModal/NovaReceitaAccrualModal.jsx` - Integração de upload em receitas
- ✅ `src/templates/EditarReceitaModal/EditarReceitaModal.jsx` - Integração de upload em edição de receitas

**Funcionalidades Implementadas:**

- ✅ Upload de arquivos (PDF, JPG, PNG, WEBP) até 5MB
- ✅ Armazenamento no Supabase Storage (bucket 'receipts')
- ✅ Preview inline de imagens e PDFs
- ✅ Download de comprovantes via URL assinada
- ✅ Exclusão de anexos
- ✅ Suporte para múltiplos anexos por transação
- ✅ Validação de tipo e tamanho de arquivo
- ✅ Progresso de upload visual
- ✅ Drag & drop para facilitar upload

**Supabase Storage:**

```javascript
// Bucket 'receipts' configurado
// Path: {unit_id}/{expense_id|revenue_id}/{timestamp}-{randomId}.{extension}
// Suporte para: image/jpeg, image/png, image/webp, application/pdf
```

---

## 🟡 BAIXA PRIORIDADE (Fase 5 - Q1 2026)

### Análise Preditiva (BI) - OPCIONAL

**Complexidade:** Muito Alta
**Estimativa:** 34 pontos (5 dias)

**Status:** Funcionalidade opcional para futuro distante

**Critérios de Aceitação:**

- [ ] Prever receita dos próximos 30 dias
- [ ] Identificar tendências de crescimento/queda
- [ ] Recomendar ações baseadas em dados

**Tecnologias:**

- Python + scikit-learn
- Supabase Edge Functions (Deno)

**Nota:** Esta funcionalidade pode ser revisitada após validação de mercado e feedback de usuários

---

## 📊 Resumo Executivo

### Implementado: ~90% das funcionalidades (Escopo Ajustado)

- ✅ Módulo Financeiro: **95%**
- ✅ Módulo de Caixa: **100%**
- ✅ Módulo de Comandas: **100%**
- ✅ Módulo de Clientes: **60%**
- ✅ Módulo de Lista da Vez: **100%**
- ✅ Infraestrutura: **90%**

### Pendente: ~10% das funcionalidades

#### Alta Prioridade (Fase 3 - Sprint Atual)

- ✅ **Módulo de Comissões (Manual)** - 8 pontos (1.5 dias) - **CONCLUÍDO**
- ✅ **Despesas Recorrentes** - 8 pontos (1.5 dias) - **CONCLUÍDO**
- ✅ **Anexar Comprovantes** - 5 pontos (1 dia) - **CONCLUÍDO**

**Estimativa Total Fase 3:** 21 pontos (~4 dias de desenvolvimento) - **100% CONCLUÍDO ✅**

#### Média Prioridade (Fase 4 - Futuro)

Nenhuma funcionalidade de média prioridade no momento.

#### Baixa Prioridade (Fase 5 - Opcional)

- 🟡 Análise Preditiva (BI) - 34 pontos (5 dias) - **OPCIONAL**

**Estimativa Total Fase 5:** 34 pontos (~5 dias de desenvolvimento)

---

### ❌ Removido do Escopo (Virá via API Externa)

As seguintes funcionalidades **NÃO** serão desenvolvidas neste sistema:

- ❌ Calendário de Agendamentos
- ❌ Fidelização (Pontos e Resgates)
- ❌ Assinaturas Recorrentes
- ❌ Lembretes Automáticos
- ❌ Integração WhatsApp Business
- ❌ Integração Google Calendar

**Motivo:** Sistema externo de CRM/Agendamento se integrará via API REST

---

## 🎯 Próximos Passos Recomendados

### Sprint Atual (Fase 3 - Finalização Core) ✅

**Objetivo:** Completar 100% do core do sistema - **CONCLUÍDO ✅**

1. ✅ **Módulo de Comissões (Manual)** - 1.5 dias - **CONCLUÍDO**
   - ✅ Cadastro manual de comissões
   - ✅ Gestão de pagamentos
   - ✅ Exportação de relatório PDF
   - ✅ Filtros por período, profissional e status
   - ✅ Totalizadores (pago, pendente, cancelado)

2. ✅ **Despesas Recorrentes** - 1.5 dias - **CONCLUÍDO**
   - ✅ Configurar despesas recorrentes
   - ✅ Geração automática de parcelas (cron job diário)
   - ✅ Notificações de vencimento (integração Telegram)
   - ✅ Filtro "Recorrentes" na lista
   - ✅ Visualização de série de parcelas
   - ✅ Pausar/retomar recorrência

3. ✅ **Anexar Comprovantes** - 1 dia - **CONCLUÍDO**
   - ✅ Upload de PDF/imagens (com drag & drop)
   - ✅ Vincular a receitas/despesas
   - ✅ Preview inline de imagens e PDFs
   - ✅ Download de comprovantes
   - ✅ Exclusão de anexos
   - ✅ Suporte para múltiplos anexos por transação

**Total:** 4 dias de desenvolvimento (4 dias concluídos ✅)

**Status da Fase 3:** ✅ **100% CONCLUÍDA**

---

### Sprint Futuro (Opcional)

1. **Análise Preditiva (BI)** - 5 dias (se houver demanda de mercado)

---

**Última atualização:** 8 de novembro de 2025
**Baseado em:** docs/00_OVERVIEW.md, docs/01_REQUIREMENTS.md

**Notas Importantes:**

- ❌ Gateway Asaas removido do escopo
- ❌ Calendário, Fidelização, Assinaturas → Sistema externo via API
- ✅ Comissões: Modelo manual simplificado
- ✅ Foco em core financeiro e operacional
