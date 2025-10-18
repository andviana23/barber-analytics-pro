# 🎯 INSTRUÇÕES: CORREÇÃO DA LISTA DA VEZ

## 📋 DIAGNÓSTICO DO PROBLEMA

O sistema possui **DOIS sistemas de fila** coexistindo:

### 🔴 Sistema ANTIGO (Causando o erro)

- **Arquivos**:
  - `src/hooks/useFilaRealtime.js`
  - `src/services/filaService.js`
  - `src/pages/ListaDaVezPage/components/BarbeiroCard.jsx`
- **Funções SQL esperadas**: `get_fila_ordenada`, `entrar_na_fila`, etc.
- **Status**: ❌ **Funções SQL NÃO EXISTEM no banco de dados**

### 🟢 Sistema NOVO (Implementado corretamente)

- **Arquivos**:
  - `src/hooks/useListaDaVez.js`
  - `src/services/listaDaVezService.js`
  - `src/repositories/listaDaVezRepository.js`
  - `src/dtos/listaDaVezDTO.js`
  - `src/pages/ListaDaVezPage/ListaDaVezPage.jsx`
- **Funções SQL**: `fn_initialize_turn_list`, `fn_add_point_to_barber`, etc.
- **Migration**: `supabase/migrations/create_lista_da_vez_tables.sql`
- **Status**: ✅ **Código implementado**, ❌ **Migration NÃO executada**

---

## 🎯 SOLUÇÃO

### OPÇÃO 1: Executar Migration no Supabase (RECOMENDADO)

#### 📌 Passos:

1. **Acesse o Supabase Dashboard**:

   ```
   https://supabase.com/dashboard
   ```

2. **Selecione seu projeto**: `barber-analytics-pro`

3. **Vá até**: `SQL Editor` (menu lateral esquerdo)

4. **Abra o arquivo de migration**:

   ```
   supabase/migrations/create_lista_da_vez_tables.sql
   ```

5. **Copie TODO o conteúdo** do arquivo SQL

6. **Cole no SQL Editor** do Supabase

7. **Clique em "Run"** para executar

8. **Aguarde** a confirmação de sucesso

9. **Teste** acessando `/queue` no sistema

---

### OPÇÃO 2: Executar via Script PowerShell

#### 📌 Passos:

1. **Abra o PowerShell** como Administrador

2. **Navegue até a pasta do projeto**:

   ```powershell
   cd C:\Users\Andrey\Desktop\Sistema\barber-analytics-pro
   ```

3. **Execute o script**:

   ```powershell
   .\execute-lista-da-vez-migration.ps1
   ```

4. **Forneça suas credenciais** quando solicitado:
   - `SUPABASE_URL`: Ex: https://xxx.supabase.co
   - `SUPABASE_SERVICE_ROLE_KEY`: Service Role Key do projeto

5. **Aguarde** a execução

---

## ✅ O QUE A MIGRATION CRIA

### 📋 Tabelas:

- ✅ `barbers_turn_list` - Lista atual da vez
- ✅ `barbers_turn_history` - Histórico mensal

### 🔧 Funções SQL:

- ✅ `fn_initialize_turn_list(unit_id)` - Inicializa lista para uma unidade
- ✅ `fn_add_point_to_barber(unit_id, professional_id)` - Adiciona 1 ponto
- ✅ `fn_reorder_turn_list(unit_id)` - Reordena lista por pontuação
- ✅ `fn_monthly_reset_turn_list()` - Reset mensal automático

### 📊 Views:

- ✅ `vw_turn_list_complete` - Lista da vez com dados completos
- ✅ `vw_turn_history_complete` - Histórico com dados completos

### 🔐 Políticas RLS:

- ✅ Políticas de segurança por unidade
- ✅ Controle de acesso por role (admin, gerente, barbeiro)

---

## 🧹 OPCIONAL: Limpar Sistema Antigo

Após executar a migration e testar o sistema, você pode **opcionalmente** remover os arquivos do sistema antigo:

### Arquivos que podem ser removidos:

```
src/hooks/useFilaRealtime.js
src/pages/ListaDaVezPage/components/BarbeiroCard.jsx
src/pages/ListaDaVezPage/components/index.js
```

### Atualizar exports:

```javascript
// src/hooks/index.js
// Remover linha:
export { default as useFilaRealtime } from './useFilaRealtime';
```

**⚠️ ATENÇÃO**: Só remova após confirmar que tudo está funcionando!

---

## 🧪 COMO TESTAR

### 1. Acesse a página:

```
http://localhost:5173/queue
```

### 2. Verifique se aparece:

- ✅ **Seletor de unidade**
- ✅ **Estatísticas** (Total de Barbeiros, Pontos, etc.)
- ✅ **Botão "Inicializar Lista"** (se lista não existe)
- ✅ **Lista de barbeiros** ordenada por pontos
- ✅ **Botão "+1 Ponto"** para cada barbeiro

### 3. Teste o fluxo:

1. **Selecione uma unidade**
2. **Clique em "Inicializar Lista"**
3. **Adicione pontos** a um barbeiro
4. **Verifique se a lista reordena** automaticamente
5. **Clique em "Ver Histórico"** para ver relatórios

---

## 🆘 TROUBLESHOOTING

### Erro: "Could not find the function public.get_fila_ordenada"

**Causa**: Migration não foi executada  
**Solução**: Execute a migration conforme instruções acima

### Erro: "relation barbers_turn_list does not exist"

**Causa**: Tabelas não foram criadas  
**Solução**: Execute a migration completa

### Erro: "permission denied for function fn_initialize_turn_list"

**Causa**: Políticas RLS não foram aplicadas  
**Solução**: Execute a migration completa novamente

### Lista não aparece após inicializar

**Causa Possível 1**: Não existem barbeiros ativos na unidade  
**Solução 1**: Cadastre barbeiros com role='barbeiro' e is_active=true

**Causa Possível 2**: Erro nas permissões  
**Solução 2**: Verifique se usuário tem acesso à unidade

---

## 📚 DOCUMENTAÇÃO COMPLETA

Para documentação técnica completa do módulo, consulte:

```
docs/LISTA_DA_VEZ_MODULE.md
```

---

## 🎉 PRÓXIMOS PASSOS

Após executar a migration e testar:

1. ✅ **Sistema funcionando** - Lista da Vez operacional
2. 🔄 **Reset mensal** - Configurar Edge Function (opcional)
3. 📱 **Notificações** - Adicionar realtime notifications (futuro)
4. 📊 **Relatórios avançados** - Gráficos e analytics (futuro)

---

## 📞 SUPORTE

Para dúvidas ou problemas:

1. Consulte `docs/LISTA_DA_VEZ_MODULE.md`
2. Verifique logs do Supabase
3. Execute `npm run dev` e verifique console do navegador

---

**Autor**: AI Agent  
**Data**: 2024-10-18  
**Versão**: 1.0
