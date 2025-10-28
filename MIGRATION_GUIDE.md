# 🔧 Guia de Execução da Migration

## Erro PGRST205 - Solução

O erro `PGRST205` indica problema com relações/foreign keys. Por isso, criei 2 versões da migration:

---

## ✅ OPÇÃO 1: Migration Completa (Tente primeiro)

**Arquivo:** `create_professional_service_commissions.sql`

**SQL já copiado no clipboard!** Cole no Supabase SQL Editor e execute.

### Se der erro, vá para Opção 2.

---

## ✅ OPÇÃO 2: Migration Minimalista (Se Opção 1 falhar)

**Arquivo:** `create_professional_service_commissions_MINIMAL.sql`

Execute este comando para copiar:

```powershell
Get-Content .\supabase\migrations\create_professional_service_commissions_MINIMAL.sql | Set-Clipboard
```

Depois cole no Supabase SQL Editor.

---

## 📋 Passo a Passo

1. **Abra o Supabase Dashboard**
   - https://supabase.com/dashboard
   - Selecione seu projeto

2. **Vá no SQL Editor**
   - Menu lateral → SQL Editor
   - Ou: Table Editor → New Query

3. **Cole o SQL**
   - Ctrl+V (já está no clipboard)

4. **Execute**
   - Botão "Run" ou Ctrl+Enter

5. **Confirme sucesso**
   - Deve aparecer: "Success. No rows returned"
   - Ou: "CREATE TABLE" / "CREATE INDEX"

6. **Verifique a tabela**
   - Table Editor → Procure por "professional_service_commissions"
   - Deve aparecer na lista

---

## 🧪 Testar na Aplicação

Após executar a migration:

1. **Recarregue a aplicação** (F5)
2. **Abra o modal de edição** de um profissional
3. **Vá na aba "Comissões por Serviço"**
4. **Edite uma comissão** (ex: mude de 50% para 55%)
5. **Clique em Salvar** (ícone check verde)
6. **Verifique:**
   - ✅ Toast de sucesso aparece
   - ✅ Sem erro 404 no console
   - ✅ Valor salvo e persiste ao recarregar

---

## 🐛 Troubleshooting

### Se ainda der erro 404:

- Verifique se a tabela foi criada: Table Editor → Procure "professional_service_commissions"
- Confirme que RLS está habilitado
- Teste a query manual no SQL Editor:
  ```sql
  SELECT * FROM professional_service_commissions;
  ```

### Se der erro de permissão:

- Execute a migration MINIMAL (Opção 2) que tem policy permissiva

---

## 📞 Próximos Passos

Após executar a migration, cole aqui:

1. Mensagem de sucesso do Supabase
2. Screenshot ou log do console (sem erros 404)
3. Confirmação de que salvou a comissão

Aí continuamos com os testes e documentação! 🚀
