# 🔧 Migração: Adicionar account_id à tabela revenues

## ✅ STATUS: MIGRAÇÃO CONCLUÍDA COM SUCESSO!

## 📋 Contexto
Esta migração adiciona o campo `account_id` à tabela `revenues` para vincular receitas a contas bancárias específicas.

## ✅ O que será feito:
1. Adicionar coluna `account_id` do tipo UUID
2. Criar foreign key para `bank_accounts(id)`
3. Criar índice para melhor performance
4. Adicionar comentário documentando a coluna

## 🚀 Como executar:

### Passo 1: Acessar Supabase Dashboard
1. Acesse: https://supabase.com/dashboard/project
2. Selecione seu projeto
3. Navegue até **SQL Editor** no menu lateral

### Passo 2: Executar a migração
1. Clique em **New Query**
2. Copie e cole o SQL abaixo:

```sql
-- ========================================
-- Add account_id field to revenues table
-- ========================================

-- Check if column exists before adding
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'revenues' 
        AND column_name = 'account_id'
    ) THEN
        -- Add account_id column
        ALTER TABLE revenues 
        ADD COLUMN account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL;
        
        -- Add index for better query performance
        CREATE INDEX idx_revenues_account_id ON revenues(account_id);
        
        -- Add comment to document the column
        COMMENT ON COLUMN revenues.account_id IS 'Bank account associated with this revenue entry';
        
        RAISE NOTICE 'Column account_id added to revenues table successfully';
    ELSE
        RAISE NOTICE 'Column account_id already exists in revenues table';
    END IF;
END $$;

-- Verify the change
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'revenues'
    AND column_name = 'account_id';
```

### Passo 3: Executar
1. Clique em **Run** ou pressione `Ctrl + Enter`
2. Aguarde a execução
3. Verifique se aparece a mensagem: `"Column account_id added to revenues table successfully"`

### Passo 4: Verificar resultado
Você deverá ver um resultado como:
```
column_name | data_type | is_nullable | column_default
------------|-----------|-------------|---------------
account_id  | uuid      | YES         | null
```

## ✨ Próximos passos

Após executar a migração:
1. ✅ O modal `NovaReceitaModal` já está atualizado para usar o campo
2. ✅ O serviço `financeiroService` já está preparado
3. 🔄 Testar a criação de uma nova receita com conta bancária

## 🐛 Troubleshooting

### Se der erro "relation 'bank_accounts' does not exist":
Execute primeiro a migração da tabela bank_accounts.

### Se der erro "permission denied":
Certifique-se de estar usando uma conta com permissões de administrador no Supabase.

### Se a coluna já existir:
A migração é idempotente - pode executar múltiplas vezes sem problemas.

---

📝 **Arquivo SQL completo**: `db/sql/12-add-account-id-to-revenues.sql`
