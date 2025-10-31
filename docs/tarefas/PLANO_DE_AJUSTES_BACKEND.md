# Plano de Ajustes e Melhorias — Backend Barber Analytics Pro

**Data de Geração:** 30 de outubro de 2025
**Autor:** GitHub Copilot (Análise Automatizada)
**Última Atualização:** 30 de outubro de 2025
**Status:** Proposta Técnica Reorganizada

## 1. Resumo da Análise

Após uma análise completa da estrutura de backend (serviços, repositórios, DTOs, migrações e documentação), o sistema se mostra funcional e robusto em seus módulos principais (Financeiro, DRE, Lista da Vez). A arquitetura `Repository → Service → DTO` está sendo implementada, mas de forma inconsistente.

O principal débito técnico identificado é a **falta de padronização na camada de acesso a dados**. Muitos serviços ainda acessam o Supabase diretamente, sem passar por um `Repository`, o que dificulta a manutenção, aumenta o acoplamento e espalha a lógica de consulta.

Este documento detalha um plano de ação para corrigir essas inconsistências, fortalecer a segurança com RLS e melhorar a manutenibilidade geral do backend.

---

## 2. Resumo Quantitativo

- **Total de Tarefas:** 18
- **Categoria SQL:** 9 tarefas (✅ 9 concluídas, 0 pendentes)
- **Categoria Backend:** 9 tarefas (✅ 9 concluídas, 0 pendentes)
- **Prioridade Crítica:** ✅ 4/4 tarefas concluídas (100%)
- **Prioridade Alta:** ✅ 1/1 tarefa concluída (100%)
- **Prioridade Média:** ✅ 2/2 tarefas concluídas (100%)
- **Prioridade Baixa:** ✅ 2/2 tarefas concluídas (100%)

**Última Execução:** 31 de outubro de 2025 - **PLANO 100% CONCLUÍDO** 🎉

**✅ Conquista Final:** SQL-08 e SQL-09 finalizadas! Todas as 18 tarefas do plano de ajustes backend foram concluídas com sucesso.

---

## 3. Recomendação de Agentes IA

| Categoria               | Agente Principal  | Agente Alternativo | Justificativa                        |
| ----------------------- | ----------------- | ------------------ | ------------------------------------ |
| **SQL/RLS (Crítico)**   | Claude Sonnet 4.5 | GPT-4o             | Melhor para segurança e SQL complexo |
| **SQL/Migrations**      | GPT-4o            | Claude Sonnet 4    | Ótimo para schemas e migrações       |
| **Backend/Refatoração** | Gemini 2.5 Pro    | Claude Sonnet 4.5  | Excelente para refatoração de código |
| **Backend/DTOs**        | Claude Sonnet 4.5 | Gemini 2.5 Pro     | Ótimo para validação e padrões       |
| **Tarefas Rápidas**     | Grok Code Fast 1  | Claude Haiku 4.5   | Renomeações e ajustes simples        |

---

## 4. Ordem de Execução Recomendada

1. **Fase 1 - Segurança (SQL):** RLS em todas as tabelas críticas - **Agente: Claude Sonnet 4.5**
2. **Fase 2 - Backend Crítico:** Módulo Parties (Repository + DTO + Service) - **Agente: Gemini 2.5 Pro**
3. **Fase 3 - Padronização SQL:** ENUMs e remoções de colunas legadas - **Agente: GPT-4o**
4. **Fase 4 - Backend RH:** Módulo Professionals (Repository + DTO + Service) - **Agente: Gemini 2.5 Pro**
5. **Fase 5 - Finalizações:** Units e ajustes finais - **Agente: Grok Code Fast 1**

---

## 5. Análise Detalhada do Banco de Dados

Após uma varredura completa no esquema do banco de dados, foram identificadas as seguintes inconsistências e débitos técnicos que precisam ser endereçados.

| Tabela          | Problema Identificado                                               | Solução Proposta                                                                  | Prioridade  |
| :-------------- | :------------------------------------------------------------------ | :-------------------------------------------------------------------------------- | :---------: |
| **(Geral)**     | **RLS Desabilitada em Múltiplas Tabelas**                           | Habilitar RLS e criar policies para TODAS as tabelas com `unit_id`.               | **Crítica** |
| `units`         | RLS Desabilitada.                                                   | Criar migração para habilitar RLS e restringir acesso por `user_id` (dono).       | **Crítica** |
| `units`         | Coluna `status` legada e redundante com `is_active`.                | Criar migração para remover a coluna `status`.                                    |    Média    |
| `professionals` | Campo `role` é `varchar` (texto livre).                             | Criar um `ENUM TYPE` para `role` e migrar a coluna.                               |    Alta     |
| `bank_accounts` | Colunas `current_balance` e `saldo_disponivel` parecem redundantes. | Investigar o uso. Se confirmado, unificar em `current_balance` e remover a outra. |    Baixa    |
| `services`      | Nome da coluna `active` foge do padrão `is_active`.                 | Criar migração para renomear `active` para `is_active`.                           |    Baixa    |
| `expenses`      | Campo `forma_pagamento` é `varchar`.                                | Criar um `ENUM TYPE` para `forma_pagamento` (PIX, Cartão, etc.).                  |    Média    |

---

## 6. CATEGORIA: SQL/DATABASE (Supabase)

**Agente Recomendado:** Claude Sonnet 4.5 (tarefas críticas) | GPT-4o (migrations)

### Prioridade CRÍTICA

| Status |   ID   | Tarefa                                                        | Módulo                | Arquivo                   |
| :----: | :----: | :------------------------------------------------------------ | :-------------------- | :------------------------ |
| `[x]`  | SQL-01 | Habilitar RLS e criar Policies para `units`                   | Segurança, Core       | ✅ Aplicado em 30/10/2025 |
| `[x]`  | SQL-02 | Habilitar RLS e criar Policies para `professionals`           | Segurança, RH         | ✅ Aplicado em 30/10/2025 |
| `[x]`  | SQL-03 | Habilitar RLS e criar Policies para `parties`                 | Segurança, Clientes   | ✅ Aplicado em 30/10/2025 |
| `[x]`  | SQL-04 | Habilitar RLS e criar Policies para `expenses` e `categories` | Segurança, Financeiro | ✅ Aplicado em 30/10/2025 |

### Prioridade ALTA

| Status |   ID   | Tarefa                                                     | Módulo           | Arquivo                                            |
| :----: | :----: | :--------------------------------------------------------- | :--------------- | :------------------------------------------------- |
| `[x]`  | SQL-05 | Criar `ENUM TYPE` para `professionals.role` e migrar dados | Padronização, RH | ✅ COMPLETO: Migração final aplicada em 31/10/2025 |

### Prioridade MÉDIA

| Status |   ID   | Tarefa                                            | Módulo                   | Arquivo                                            |
| :----: | :----: | :------------------------------------------------ | :----------------------- | :------------------------------------------------- |
| `[x]`  | SQL-06 | Remover coluna legada `status` da tabela `units`  | Padronização, Core       | ✅ Aplicado + view atualizada em 30/10/2025        |
| `[x]`  | SQL-07 | Criar `ENUM TYPE` para `expenses.forma_pagamento` | Padronização, Financeiro | ✅ COMPLETO: Migração final aplicada em 31/10/2025 |

### Prioridade BAIXA

| Status |   ID   | Tarefa                                                       | Módulo                   | Arquivo                                                        |
| :----: | :----: | :----------------------------------------------------------- | :----------------------- | :------------------------------------------------------------- |
| `[x]`  | SQL-08 | Renomear `services.active` para `services.is_active`         | Padronização             | ✅ Aplicado em 31/10/2025                                      |
| `[x]`  | SQL-09 | Investigar e unificar colunas redundantes em `bank_accounts` | Padronização, Financeiro | ✅ Aplicado em 31/10/2025 (decisão: manter ambas documentadas) |

---

## 7. CATEGORIA: BACKEND (Node.js/JavaScript)

**Agente Recomendado:** Gemini 2.5 Pro (refatoração) | Claude Sonnet 4.5 (DTOs)

### Prioridade MÉDIA - Módulo Parties (Clientes/Fornecedores)

| Status |  ID   | Tarefa                                                   | Arquivo                    |
| :----: | :---: | :------------------------------------------------------- | :------------------------- |
| `[x]`  | BE-01 | Criar `partiesRepository.js`                             | ✅ Concluído em 31/10/2025 |
| `[x]`  | BE-02 | Criar `partiesDTO.js`                                    | ✅ Concluído em 31/10/2025 |
| `[x]`  | BE-03 | Refatorar `partiesService.js` para usar Repository + DTO | ✅ Concluído em 31/10/2025 |

### Prioridade MÉDIA - Módulo Professionals (RH/Comissões)

| Status |  ID   | Tarefa                                                        | Arquivo                    |
| :----: | :---: | :------------------------------------------------------------ | :------------------------- |
| `[x]`  | BE-04 | Criar `professionalRepository.js`                             | ✅ Concluído em 31/10/2025 |
| `[x]`  | BE-05 | Criar `professionalDTO.js`                                    | ✅ Concluído em 31/10/2025 |
| `[x]`  | BE-06 | Refatorar `professionalService.js` para usar Repository + DTO | ✅ Concluído em 31/10/2025 |

### Prioridade BAIXA - Módulo Units (Core/Unidades)

| Status |  ID   | Tarefa                                                 | Arquivo                    |
| :----: | :---: | :----------------------------------------------------- | :------------------------- |
| `[x]`  | BE-07 | Criar `unitsRepository.js`                             | ✅ Concluído em 31/10/2025 |
| `[x]`  | BE-08 | Criar `unitsDTO.js`                                    | ✅ Concluído em 31/10/2025 |
| `[x]`  | BE-09 | Refatorar `unitsService.js` para usar Repository + DTO | ✅ Concluído em 31/10/2025 |

---

## 8. Detalhamento das Tarefas SQL

### [SQL-01] Habilitar RLS em `units` (Prioridade Crítica)

**Agente:** Claude Sonnet 4.5

**Problema:** A tabela `units`, que é a base do sistema multi-tenant, está com RLS desabilitado.

**Solução:** Criar uma migração para habilitar RLS e garantir que um usuário só possa ver e gerenciar as unidades que lhe pertencem.

**Arquivo Sugerido:** `supabase/migrations/YYYYMMDD_add_rls_to_units.sql`

```sql
-- Tarefa 1: Habilitar RLS na tabela units
BEGIN;

ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

-- Admins podem ver todas as unidades.
-- Usuários comuns podem ver apenas as unidades que possuem (units.user_id).
CREATE POLICY "units_select_policy"
ON public.units
FOR SELECT
TO authenticated
USING (
  (get_user_role() = 'admin') OR
  (user_id = auth.uid())
);

-- Apenas donos podem atualizar suas próprias unidades. Admins podem atualizar qualquer uma.
CREATE POLICY "units_update_policy"
ON public.units
FOR UPDATE
TO authenticated
USING (
  (get_user_role() = 'admin') OR
  (user_id = auth.uid())
);

-- Apenas o dono pode deletar sua unidade (soft delete).
CREATE POLICY "units_delete_policy"
ON public.units
FOR DELETE
TO authenticated
USING (
  (get_user_role() = 'admin') OR
  (user_id = auth.uid())
);

-- INSERT é permitido para qualquer usuário autenticado, pois é o primeiro passo para criar uma barbearia.
CREATE POLICY "units_insert_policy"
ON public.units
FOR INSERT
TO authenticated
WITH CHECK (true);

COMMIT;
```

### [SQL-02] Habilitar RLS e Criar Policies para `professionals` (Prioridade Crítica)

**Agente:** Claude Sonnet 4.5

**Problema:** A tabela `professionals` contém dados de usuários e comissões, mas não possui RLS, permitindo que um usuário autenticado possa, teoricamente, visualizar dados de profissionais de outras unidades.

**Solução:** Criar uma nova migração para habilitar RLS e adicionar políticas que restrinjam o acesso.

**Arquivo Sugerido:** `supabase/migrations/YYYYMMDD_add_rls_to_professionals.sql`

```sql
-- Tarefa 1: Habilitar RLS e Criar Policies para a tabela professionals

BEGIN;

-- Habilita Row Level Security na tabela
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;

-- Policy de SELECT:
-- Permite que usuários vejam profissionais da(s) sua(s) própria(s) unidade(s).
-- Admins podem ver todos.
CREATE POLICY "professionals_select_policy"
ON public.professionals
FOR SELECT
TO authenticated
USING (
  (get_user_role() = 'admin') OR
  (unit_id IN (
    SELECT p.unit_id
    FROM public.professionals p
    WHERE p.user_id = auth.uid()
  ))
);

-- Policy de INSERT:
-- Apenas Admins ou donos da unidade podem criar novos profissionais.
CREATE POLICY "professionals_insert_policy"
ON public.professionals
FOR INSERT
TO authenticated
WITH CHECK (
  (get_user_role() = 'admin') OR
  (unit_id IN (
    SELECT u.id
    FROM public.units u
    WHERE u.user_id = auth.uid()
  ))
);

-- Policy de UPDATE:
-- Apenas Admins ou donos da unidade podem atualizar profissionais.
CREATE POLICY "professionals_update_policy"
ON public.professionals
FOR UPDATE
TO authenticated
USING (
  (get_user_role() = 'admin') OR
  (unit_id IN (
    SELECT u.id
    FROM public.units u
    WHERE u.user_id = auth.uid()
  ))
);

-- Policy de DELETE:
-- Apenas Admins ou donos da unidade podem deletar profissionais.
CREATE POLICY "professionals_delete_policy"
ON public.professionals
FOR DELETE
TO authenticated
USING (
  (get_user_role() = 'admin') OR
  (unit_id IN (
    SELECT u.id
    FROM public.units u
    WHERE u.user_id = auth.uid()
  ))
);

COMMIT;
```

---

## 9. Detalhamento das Tarefas Backend

### [BE-01, BE-02, BE-03] Módulo Parties - Criar Repositório, DTOs e Refatorar Service (Prioridade Média)

**Agente:** Gemini 2.5 Pro

**Problema:** O `partiesService.js` acessa o Supabase diretamente. É necessário abstrair essa lógica para um repositório e validar os dados com DTOs.

**Solução:** Criar os arquivos `partiesRepository.js` e `partiesDTO.js` e, em seguida, refatorar o serviço.

#### **Passo A: Criar `src/dtos/partiesDTO.js`**

```javascript
// src/dtos/partiesDTO.js

import { z } from 'zod';

const partySchema = z.object({
  unit_id: z.string().uuid({ message: 'ID da unidade inválido' }),
  nome: z.string().min(3, { message: 'Nome deve ter no mínimo 3 caracteres' }),
  tipo: z.enum(['Cliente', 'Fornecedor'], {
    message: 'Tipo deve ser Cliente ou Fornecedor',
  }),
  cpf_cnpj: z.string().refine(doc => /^\d{11}$|^\d{14}$/.test(doc), {
    message: 'CPF/CNPJ inválido',
  }),
  telefone: z.string().optional(),
  email: z.string().email({ message: 'Email inválido' }).optional(),
  is_active: z.boolean().default(true),
});

export class CreatePartyDTO {
  constructor(data) {
    this.data = data;
    this.validation = partySchema.safeParse(data);
  }

  isValid() {
    return this.validation.success;
  }

  getErrors() {
    return this.validation.error?.flatten().fieldErrors;
  }

  toDatabase() {
    if (!this.isValid()) {
      throw new Error('Dados inválidos para criação de parte.');
    }
    return this.validation.data;
  }
}

export class UpdatePartyDTO {
  constructor(data) {
    this.data = data;
    this.validation = partySchema.partial().safeParse(data);
  }

  isValid() {
    return this.validation.success;
  }

  getErrors() {
    return this.validation.error?.flatten().fieldErrors;
  }

  toDatabase() {
    if (!this.isValid()) {
      throw new Error('Dados inválidos para atualização de parte.');
    }
    return this.validation.data;
  }
}
```

#### **Passo B: Criar `src/repositories/partiesRepository.js`**

```javascript
// src/repositories/partiesRepository.js

import { supabase } from '../services/supabase';

export const partiesRepository = {
  async findAllByUnit(unitId) {
    const { data, error } = await supabase
      .from('parties')
      .select('*')
      .eq('unit_id', unitId)
      .order('nome', { ascending: true });
    return { data, error };
  },

  async findById(id) {
    const { data, error } = await supabase
      .from('parties')
      .select('*')
      .eq('id', id)
      .single();
    return { data, error };
  },

  async create(partyData) {
    const { data, error } = await supabase
      .from('parties')
      .insert(partyData)
      .select()
      .single();
    return { data, error };
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('parties')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  async softDelete(id) {
    return this.update(id, { is_active: false });
  },
};
```

#### **Passo C: Refatorar `src/services/partiesService.js`**

O serviço `partiesService.js` deve ser modificado para importar e utilizar `partiesRepository` e os DTOs, removendo as chamadas diretas ao `supabase`.

**Exemplo de refatoração da função `createParty`:**

```javascript
// Em src/services/partiesService.js

import { partiesRepository } from '../repositories/partiesRepository';
import { CreatePartyDTO } from '../dtos/partiesDTO';

// ...

async function createParty(partyData) {
  const dto = new CreatePartyDTO(partyData);
  if (!dto.isValid()) {
    return {
      data: null,
      error: { message: 'Dados inválidos', details: dto.getErrors() },
    };
  }

  try {
    const databasePayload = dto.toDatabase();
    const { data, error } = await partiesRepository.create(databasePayload);

    if (error) {
      // Log do erro aqui (usando um serviço de log, não console.log)
      return { data: null, error };
    }

    return { data, error: null };
  } catch (e) {
    return { data: null, error: e };
  }
}

// ... (aplicar o mesmo padrão para as outras funções do serviço)
```

---

## 10. Próximos Passos e Validação

### Fase de Implementação

1. **Executar as Migrações SQL (Fase 1 - Crítica)**
   - Aplicar migrações SQL-01 a SQL-04 no ambiente de desenvolvimento
   - Validar RLS com testes de acesso multi-tenant
   - Aplicar em staging antes de produção

2. **Implementar Backend Parties (Fase 2)**
   - Executar tarefas BE-01, BE-02, BE-03 sequencialmente
   - Validar com testes de integração existentes

3. **Padronização SQL (Fase 3)**
   - Executar SQL-05 a SQL-07
   - Validar integridade dos dados após ENUMs

4. **Implementar Backend Professionals (Fase 4)**
   - Executar tarefas BE-04, BE-05, BE-06 sequencialmente
   - Validar módulo de comissões

5. **Finalizações (Fase 5)**
   - Executar SQL-08, SQL-09
   - Executar BE-07, BE-08, BE-09
   - Testes E2E completos

### Checklist de Validação

- [ ] Todas as migrações SQL aplicadas sem erros
- [ ] RLS testado em todas as tabelas críticas
- [ ] Testes de integração passando
- [ ] Testes E2E passando
- [ ] Performance das queries monitorada
- [ ] Documentação atualizada
- [ ] Code review completo
