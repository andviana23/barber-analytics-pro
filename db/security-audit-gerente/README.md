# 🔐 AUDITORIA DE SEGURANÇA E PERMISSÕES - PAPEL GERENTE

## 📋 Resumo Executivo

Este diretório contém a **auditoria completa de segurança** e **implementação de permissões mínimas** para o papel **gerente** no sistema Barber Analytics Pro.

**Autor:** Andrey Viana  
**Data:** 23 de outubro de 2025  
**Banco de Dados:** Supabase PostgreSQL (RLS-based)  
**Status:** ✅ Pronto para deploy

---

## 🎯 Objetivo

Garantir que usuários com papel **gerente** tenham acesso **mínimo e seguro** apenas às funcionalidades necessárias:

### ✅ PERMISSÕES CONCEDIDAS

| Funcionalidade                        | Ações Permitidas       | Restrições             |
| ------------------------------------- | ---------------------- | ---------------------- |
| **Receitas** (Financeiro Avançado)    | SELECT, INSERT, UPDATE | Somente da sua unidade |
| **Despesas** (Financeiro Avançado)    | SELECT, INSERT, UPDATE | Somente da sua unidade |
| **Baixas de Despesas**                | SELECT, INSERT, UPDATE | Somente da sua unidade |
| **Categorias** (Cadastros)            | SELECT, INSERT         | Somente da sua unidade |
| **Clientes/Fornecedores** (Cadastros) | SELECT, INSERT, UPDATE | Somente da sua unidade |
| **Profissionais** (Cadastros)         | SELECT                 | Somente da sua unidade |
| **Formas de Pagamento**               | SELECT                 | Somente da sua unidade |
| **Contas Bancárias**                  | SELECT                 | Somente da sua unidade |
| **Lista da Vez**                      | SELECT, UPDATE         | Somente da sua unidade |
| **Metas**                             | SELECT, INSERT, UPDATE | Somente da sua unidade |
| **Unidades**                          | SELECT                 | Todas (para seletor)   |
| **Dashboard/Views**                   | SELECT                 | Dados da sua unidade   |

### ❌ PERMISSÕES NEGADAS

- **DELETE** em todas as tabelas críticas (receitas, despesas, metas, etc.)
- Acesso a **subscriptions** (assinaturas)
- Acesso a **products** (controle de estoque)
- Acesso a **bank_statements** (extratos bancários)
- Acesso a **reconciliations** (conciliação bancária)
- Acesso a **logs administrativos** (access_logs, asaas_webhook_logs)
- Modificação de **units**, **professionals**, **bank_accounts**
- Acesso a dados de **outras unidades**

---

## 📂 Estrutura dos Scripts

```
db/security-audit-gerente/
├── README.md                           # Este arquivo
├── 01_mapear_objetos.sql              # Mapeamento completo (SOMENTE LEITURA)
├── 02_backup_permissoes.sql           # Backup das policies atuais (SOMENTE LEITURA)
├── 04_aplicar_permissoes_gerente.sql  # Aplicação das novas policies (MODIFICAÇÃO)
├── 05_testes_verificacao.sql          # Testes de validação (LEITURA + TESTES)
└── 99_rollback.sql                    # Reverter mudanças (MODIFICAÇÃO)
```

---

## 🚀 Plano de Deploy em Produção

### ⚠️ PRÉ-REQUISITOS

- [ ] Backup completo do banco de dados
- [ ] Janela de manutenção agendada (recomendado: fora do horário comercial)
- [ ] Acesso ao Supabase Dashboard com permissões de Admin
- [ ] Ferramenta SQL Client conectada (ex: psql, DBeaver, Supabase SQL Editor)
- [ ] Confirmação de que NÃO há gerentes ativos no momento do deploy

### 📝 PASSO A PASSO

#### **1. PRÉ-DEPLOY: Mapeamento e Backup** (30 minutos)

```sql
-- 1.1 Executar mapeamento completo
\i 01_mapear_objetos.sql

-- 1.2 Salvar output em arquivo
\o 01_mapear_objetos_OUTPUT.txt

-- 1.3 Executar backup de policies
\i 02_backup_permissoes.sql

-- 1.4 Salvar output em arquivo
\o 02_backup_permissoes_BACKUP_<data>.sql

-- 1.5 Verificar se backup está completo
\i 02_backup_permissoes_BACKUP_<data>.sql -- Deve executar sem erros
```

**✅ Checkpoint:** Backup salvo e validado.

---

#### **2. DEPLOY: Aplicar Permissões** (20 minutos)

```sql
-- 2.1 Iniciar transação manual (segurança extra)
BEGIN;

-- 2.2 Executar script de aplicação
\i 04_aplicar_permissoes_gerente.sql

-- 2.3 Verificar se não houve erros
-- Se houver erros: ROLLBACK; e investigar
-- Se tudo OK: COMMIT;

COMMIT;
```

**⚠️ SE HOUVER ERRO:**

```sql
ROLLBACK;
-- Investigar erro
-- Ajustar script
-- Tentar novamente
```

**✅ Checkpoint:** Policies aplicadas com sucesso.

---

#### **3. PÓS-DEPLOY: Testes de Validação** (40 minutos)

```sql
-- 3.1 Criar usuário gerente de teste
INSERT INTO auth.users (email, encrypted_password, raw_user_meta_data)
VALUES (
    'gerente.teste@barberanalytics.com',
    crypt('senha_temporaria', gen_salt('bf')),
    '{"role": "gerente"}'::JSONB
);

-- 3.2 Vincular a um professional de uma unidade de teste
INSERT INTO professionals (unit_id, user_id, name, role, is_active)
VALUES (
    '<UUID_UNIT_TESTE>',
    (SELECT id FROM auth.users WHERE email = 'gerente.teste@barberanalytics.com'),
    'Gerente Teste',
    'Gerente',
    true
);

-- 3.3 Conectar como gerente teste e executar testes
-- IMPORTANTE: Usar sessão separada com auth do gerente
\i 05_testes_verificacao.sql

-- 3.4 Verificar resultado dos 9 testes
-- Esperado:
-- - 3 PASS (inserir, ver, atualizar)
-- - 6 FAIL/PASS (bloquear acessos indevidos)
```

**✅ Checkpoint:** Todos os testes passaram.

---

#### **4. VALIDAÇÃO FINAL** (30 minutos)

```sql
-- 4.1 Verificar que policies foram criadas
SELECT
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE schemaname = 'public'
  AND policyname LIKE 'gerente%'
ORDER BY tablename, policyname;

-- Esperado: ~30 policies com prefixo "gerente_"

-- 4.2 Verificar que policies antigas foram removidas
SELECT
    tablename,
    policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND policyname LIKE 'authenticated_%'
  AND tablename IN ('revenues', 'expenses', 'categories', 'parties');

-- Esperado: 0 registros

-- 4.3 Testar login de gerente real (se possível)
-- Verificar acesso às páginas:
-- - ✅ Financeiro Avançado > Receitas (pode adicionar/editar)
-- - ✅ Financeiro Avançado > Despesas (pode adicionar/editar)
-- - ✅ Cadastros (pode visualizar/criar)
-- - ✅ Lista da Vez (pode visualizar/editar)
-- - ✅ Dashboard (pode visualizar KPIs)
-- - ❌ Configurações Administrativas (bloqueado)
```

**✅ Checkpoint:** Validação completa bem-sucedida.

---

#### **5. LIMPEZA** (10 minutos)

```sql
-- 5.1 Remover usuário de teste
DELETE FROM professionals
WHERE user_id IN (
    SELECT id FROM auth.users
    WHERE email = 'gerente.teste@barberanalytics.com'
);

DELETE FROM auth.users
WHERE email = 'gerente.teste@barberanalytics.com';

-- 5.2 Documentar mudanças
-- Atualizar CHANGELOG.md com:
-- - Data do deploy
-- - Permissões aplicadas
-- - Testes executados
-- - Responsável pelo deploy
```

---

### 🔄 Plano de Rollback

**SE ALGO DER ERRADO:**

```sql
-- OPÇÃO 1: Rollback imediato (dentro da transação)
ROLLBACK;

-- OPÇÃO 2: Rollback após commit (executar script)
\i 99_rollback.sql

-- OPÇÃO 3: Restaurar do backup
\i 02_backup_permissoes_BACKUP_<data>.sql
```

**Tempo estimado de rollback:** 5-10 minutos

---

## ✅ Checklist de Segurança

### Antes do Deploy

- [ ] Backup do banco de dados completo
- [ ] Backup das policies atuais (script 02)
- [ ] Janela de manutenção confirmada
- [ ] Usuários gerentes notificados (se houver)
- [ ] Equipe técnica de prontidão

### Durante o Deploy

- [ ] Executar em transação (BEGIN/COMMIT)
- [ ] Monitorar logs de erro
- [ ] Validar cada bloco antes de prosseguir
- [ ] Manter canal de comunicação aberto

### Após o Deploy

- [ ] Executar todos os testes de validação
- [ ] Verificar que policies antigas foram removidas
- [ ] Verificar que policies novas foram criadas
- [ ] Testar login de gerente real
- [ ] Testar funcionalidades permitidas
- [ ] Testar funcionalidades bloqueadas
- [ ] Remover usuário de teste
- [ ] Atualizar documentação (CHANGELOG)
- [ ] Notificar equipe que deploy foi concluído

---

## 📊 Métricas de Segurança

### Antes (Estado Atual)

- ❌ Gerente tem acesso `authenticated` genérico
- ❌ Pode deletar registros críticos
- ❌ Pode acessar subscriptions, products, bank_statements
- ❌ Pode modificar units, professionals, bank_accounts
- ❌ Acessa dados de todas as unidades

**Risco:** 🔴 CRÍTICO

### Depois (Estado Desejado)

- ✅ Gerente tem acesso restrito por unidade
- ✅ NÃO pode deletar registros críticos
- ✅ NÃO pode acessar tabelas administrativas
- ✅ NÃO pode modificar configurações sensíveis
- ✅ Acessa APENAS dados da sua unidade

**Risco:** 🟢 BAIXO

---

## 🧪 Testes de Segurança

### Testes Positivos (DEVEM FUNCIONAR)

1. ✅ Gerente consegue visualizar receitas da sua unidade
2. ✅ Gerente consegue inserir receita na sua unidade
3. ✅ Gerente consegue atualizar receita da sua unidade
4. ✅ Gerente consegue visualizar despesas da sua unidade
5. ✅ Gerente consegue inserir despesa na sua unidade
6. ✅ Gerente consegue visualizar clientes da sua unidade
7. ✅ Gerente consegue criar cliente na sua unidade
8. ✅ Gerente consegue atualizar lista da vez da sua unidade
9. ✅ Gerente consegue visualizar metas da sua unidade
10. ✅ Gerente consegue criar meta na sua unidade
11. ✅ Gerente consegue visualizar dashboard/views

### Testes Negativos (DEVEM SER BLOQUEADOS)

1. ❌ Gerente NÃO consegue deletar receitas
2. ❌ Gerente NÃO consegue deletar despesas
3. ❌ Gerente NÃO consegue visualizar subscriptions
4. ❌ Gerente NÃO consegue visualizar products
5. ❌ Gerente NÃO consegue modificar bank_accounts
6. ❌ Gerente NÃO consegue modificar professionals
7. ❌ Gerente NÃO consegue modificar units
8. ❌ Gerente NÃO consegue visualizar access_logs
9. ❌ Gerente NÃO consegue visualizar receitas de outras unidades
10. ❌ Gerente NÃO consegue visualizar despesas de outras unidades

---

## 🔍 Troubleshooting

### Erro: "permission denied for table revenues"

**Causa:** Policy não foi aplicada corretamente.

**Solução:**

```sql
-- Verificar se RLS está habilitado
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'revenues';

-- Se false, habilitar
ALTER TABLE revenues ENABLE ROW LEVEL SECURITY;

-- Recriar policy
\i 04_aplicar_permissoes_gerente.sql
```

### Erro: "policy already exists"

**Causa:** Tentativa de recriar policy existente.

**Solução:**

```sql
-- Remover policies antigas primeiro
DROP POLICY IF EXISTS "gerente_select_revenues" ON revenues;
-- Depois recriar
\i 04_aplicar_permissoes_gerente.sql
```

### Erro: Gerente ainda vê dados de outras unidades

**Causa:** Policy usando condição errada ou usuário não tem professional vinculado.

**Solução:**

```sql
-- Verificar vinculação do gerente
SELECT
    u.id AS user_id,
    u.email,
    u.raw_user_meta_data->>'role' AS role,
    p.id AS professional_id,
    p.unit_id,
    unit.name AS unit_name
FROM auth.users u
LEFT JOIN professionals p ON p.user_id = u.id
LEFT JOIN units unit ON unit.id = p.unit_id
WHERE u.id = '<user_id_gerente>';

-- Se professional_id estiver NULL, criar vinculação:
INSERT INTO professionals (unit_id, user_id, name, role, is_active)
VALUES ('<unit_id>', '<user_id>', 'Nome do Gerente', 'Gerente', true);
```

---

## 📚 Referências

- [Supabase Row Level Security Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Policies Documentation](https://www.postgresql.org/docs/current/sql-createpolicy.html)
- `docs/ARCHITECTURE.md` - Arquitetura do sistema
- `docs/DATABASE_SCHEMA.md` - Schema completo do banco

---

## 📞 Suporte

**Em caso de dúvidas ou problemas:**

1. Verificar logs do Supabase Dashboard
2. Executar script `01_mapear_objetos.sql` para diagnóstico
3. Consultar seção Troubleshooting deste README
4. Contatar: Andrey Viana (desenvolvedor responsável)

---

## ✅ Aprovação e Sign-off

| Ação                 | Responsável  | Data       | Assinatura |
| -------------------- | ------------ | ---------- | ---------- |
| Criação dos Scripts  | Andrey Viana | 2025-10-23 | ✅         |
| Revisão Técnica      | -            | -          | ⏳         |
| Aprovação Segurança  | -            | -          | ⏳         |
| Deploy em Produção   | -            | -          | ⏳         |
| Validação Pós-Deploy | -            | -          | ⏳         |

---

**Última atualização:** 23 de outubro de 2025  
**Versão:** 1.0.0  
**Status:** 🟢 Pronto para deploy
