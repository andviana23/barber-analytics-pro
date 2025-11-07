# 📋 Funcionalidades Pendentes - Barber Analytics Pro

**Data:** 7 de novembro de 2025 (Atualizado)
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

---

---

### RF-01.04: Despesas Recorrentes

**Complexidade:** Média
**Estimativa:** 8 pontos (1.5 dias)

---

### Módulo de Comissões (Gestão Manual)

**Complexidade:** Média
**Estimativa:** 8 pontos (1.5 dias)

**Escopo Ajustado:** Gestão totalmente manual de comissões, sem cálculo automático.

**Critérios de Aceitação:**

- [ ] Cadastrar comissão manualmente por profissional
- [ ] Vincular comissão a serviço/comanda (opcional)
- [ ] Editar valor de comissão
- [ ] Marcar comissão como paga/pendente
- [ ] Filtrar comissões por período, profissional, status
- [ ] **Exportar relatório de comissões para PDF**
- [ ] Exibir totalizadores (total pago, pendente, por profissional)

**Fluxo de Uso:**
1. Gerente/Admin acessa página de comissões
2. Cadastra manualmente comissão (profissional, valor, data, descrição)
3. Marca como "Paga" quando efetuar o pagamento
4. Exporta relatório mensal em PDF para prestação de contas

**Arquivos a Criar:**

- `src/services/commissionService.js`
- `src/repositories/commissionRepository.js`
- `src/hooks/useCommissions.js`
- `src/dtos/CommissionDTO.js`
- `src/pages/CommissionsPage.jsx`
- `src/organisms/CommissionFormModal.jsx`
- `src/organisms/CommissionReportPDF.jsx`

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

### RF-01.04: Despesas Recorrentes

**Complexidade:** Média
**Estimativa:** 8 pontos (1.5 dias)

**Critérios de Aceitação:**

- [ ] Suportar despesas recorrentes (mensal, trimestral, anual)
- [ ] Gerar parcelas automaticamente
- [ ] Notificar vencimentos próximos
- [ ] Marcar parcelas como pagas

**Arquivos a Modificar:**

- `src/services/expenseService.js`
- `src/dtos/ExpenseDTO.js`
- `supabase/functions/process-recurring-expenses/index.ts`

**Banco de Dados:**

```sql
ALTER TABLE expenses ADD COLUMN is_recurring BOOLEAN DEFAULT false;
ALTER TABLE expenses ADD COLUMN recurrence_type VARCHAR(20) CHECK (recurrence_type IN ('MONTHLY', 'QUARTERLY', 'YEARLY'));
ALTER TABLE expenses ADD COLUMN parent_expense_id UUID REFERENCES expenses(id);
ALTER TABLE expenses ADD COLUMN installment_number INTEGER;
ALTER TABLE expenses ADD COLUMN total_installments INTEGER;
```

---

### RF-01.04: Anexar Comprovantes

**Complexidade:** Baixa
**Estimativa:** 5 pontos (1 dia)

**Critérios de Aceitação:**

- [ ] Upload de arquivos (PDF, imagem)
- [ ] Armazenar no Supabase Storage
- [ ] Exibir preview do comprovante
- [ ] Download de comprovante

**Arquivos a Criar:**

- `src/services/storageService.js`
- `src/hooks/useFileUpload.js`

**Supabase Storage:**

```javascript
// Criar bucket 'receipts'
const { data, error } = await supabase.storage.createBucket('receipts', {
  public: false,
  fileSizeLimit: 5242880, // 5MB
  allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
});
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

### Implementado: ~85% das funcionalidades (Escopo Ajustado)

- ✅ Módulo Financeiro: **92%**
- ✅ Módulo de Caixa: **100%**
- ✅ Módulo de Comandas: **100%**
- ✅ Módulo de Clientes: **60%**
- ✅ Módulo de Lista da Vez: **100%**
- ✅ Infraestrutura: **90%**

### Pendente: ~15% das funcionalidades

#### Alta Prioridade (Fase 3 - Sprint Atual)

- 🔴 **Módulo de Comissões (Manual)** - 8 pontos (1.5 dias)
- 🔴 **Despesas Recorrentes** - 8 pontos (1.5 dias)
- 🔴 **Anexar Comprovantes** - 5 pontos (1 dia)

**Estimativa Total Fase 3:** 21 pontos (~4 dias de desenvolvimento)

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

### Sprint Atual (Fase 3 - Finalização Core)

**Objetivo:** Completar 100% do core do sistema

1. **Módulo de Comissões (Manual)** - 1.5 dias
   - Cadastro manual de comissões
   - Gestão de pagamentos
   - Exportação de relatório PDF

2. **Despesas Recorrentes** - 1.5 dias
   - Configurar despesas recorrentes
   - Geração automática de parcelas
   - Notificações de vencimento

3. **Anexar Comprovantes** - 1 dia
   - Upload de PDF/imagens
   - Vincular a receitas/despesas
   - Preview e download

**Total:** 4 dias de desenvolvimento

---

### Sprint Futuro (Opcional)

1. **Análise Preditiva (BI)** - 5 dias (se houver demanda de mercado)

---

**Última atualização:** 7 de novembro de 2025
**Baseado em:** docs/00_OVERVIEW.md, docs/01_REQUIREMENTS.md

**Notas Importantes:**
- ❌ Gateway Asaas removido do escopo
- ❌ Calendário, Fidelização, Assinaturas → Sistema externo via API
- ✅ Comissões: Modelo manual simplificado
- ✅ Foco em core financeiro e operacional
