# 🎯 MÓDULO LISTA DA VEZ - DOCUMENTAÇÃO COMPLETA

## 📋 Visão Geral

O módulo **Lista da Vez** é um sistema completo de gestão da ordem de atendimento dos barbeiros em cada unidade da Trato de Barbados. O sistema utiliza um método de pontuação automática que garante justiça e transparência na distribuição dos atendimentos.

### 🎯 Objetivos Principais

- ✅ **Listar todos os barbeiros ativos** de cada unidade
- ✅ **Atribuir pontos manualmente** (um por vez)
- ✅ **Reordenar automaticamente** conforme pontuação
- ✅ **Reset mensal automático** às 23:59 do último dia do mês
- ✅ **Histórico mensal completo** com backup automático
- ✅ **Relatórios e exportação** por unidade e período

---

## 🏗️ Arquitetura do Sistema

### 📊 Estrutura de Camadas

```
┌─────────────────────────────────────┐
│           PRESENTATION              │
│     (ListaDaVezPage.jsx)            │
├─────────────────────────────────────┤
│             HOOKS                   │
│        (useListaDaVez.js)           │
├─────────────────────────────────────┤
│             SERVICE                  │
│      (listaDaVezService.js)         │
├─────────────────────────────────────┤
│            REPOSITORY               │
│    (listaDaVezRepository.js)        │
├─────────────────────────────────────┤
│              DATABASE               │
│    (Supabase + PostgreSQL)         │
└─────────────────────────────────────┘
```

### 🔧 Componentes Implementados

#### 1. **Banco de Dados (Supabase)**

- **`barbers_turn_list`** - Lista atual da vez
- **`barbers_turn_history`** - Histórico mensal
- **Funções SQL** para operações complexas
- **Políticas RLS** para segurança por unidade

#### 2. **Repository Layer**

- **`listaDaVezRepository.js`** - Operações de persistência
- Métodos para CRUD completo
- Integração com Supabase RPC

#### 3. **Service Layer**

- **`listaDaVezService.js`** - Lógica de negócio
- Validações e transformações
- Orquestração de operações

#### 4. **DTO Layer**

- **`listaDaVezDTO.js`** - Validação e transformação
- 8 DTOs especializados
- Sanitização de dados

#### 5. **Hook Layer**

- **`useListaDaVez.js`** - Gerenciamento de estado
- Interface reativa para React
- Integração com contexto

#### 6. **Presentation Layer**

- **`ListaDaVezPage.jsx`** - Interface principal
- Componentes responsivos
- Feedback visual em tempo real

---

## 🗄️ Estrutura do Banco de Dados

### 📋 Tabela `barbers_turn_list`

```sql
CREATE TABLE barbers_turn_list (
    id UUID PRIMARY KEY,
    unit_id UUID REFERENCES units(id),
    professional_id UUID REFERENCES professionals(id),
    points INTEGER DEFAULT 0,
    position INTEGER NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,

    UNIQUE(unit_id, professional_id),
    UNIQUE(unit_id, position)
);
```

### 📋 Tabela `barbers_turn_history`

```sql
CREATE TABLE barbers_turn_history (
    id UUID PRIMARY KEY,
    unit_id UUID REFERENCES units(id),
    professional_id UUID REFERENCES professionals(id),
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    total_points INTEGER DEFAULT 0,
    final_position INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE,

    UNIQUE(unit_id, professional_id, month, year)
);
```

### 🔧 Funções SQL Principais

#### `fn_initialize_turn_list(unit_id)`

- Inicializa lista para uma unidade
- Ordena por data de cadastro
- Todos começam com 0 pontos

#### `fn_add_point_to_barber(unit_id, professional_id)`

- Adiciona 1 ponto a um barbeiro
- Reordena lista automaticamente
- Atualiza timestamp

#### `fn_reorder_turn_list(unit_id)`

- Reordena por pontos (menor primeiro)
- Desempate por data de cadastro
- Atualiza posições

#### `fn_monthly_reset_turn_list()`

- Salva histórico do mês
- Zera todas as pontuações
- Reinicia ordem original

---

## 🎮 Funcionalidades Implementadas

### 🏠 Página Principal (`/queue`)

#### **Dashboard de Estatísticas**

- 📊 Total de barbeiros cadastrados
- 🎯 Total de pontos acumulados
- 📈 Média de pontos por barbeiro
- ⏰ Última atualização

#### **Lista da Vez Interativa**

- 👥 Lista ordenada por pontuação
- 🥇 Destaque para próximo da vez
- ➕ Botão "+1 Ponto" para cada barbeiro
- 🔄 Atualização em tempo real

#### **Controles de Gestão**

- 🏢 Seletor de unidade
- 🔄 Botão de atualização
- 📊 Visualização de histórico
- 📤 Exportação para CSV

### 📊 Sistema de Histórico

#### **Relatórios Mensais**

- 📅 Filtro por mês e ano
- 📋 Tabela com posições finais
- 📊 Total de pontos por barbeiro
- 📅 Data de fechamento do mês

#### **Exportação de Dados**

- 📄 Formato CSV
- 📊 Dados completos da lista
- 📅 Timestamp de geração
- 💾 Download automático

---

## 🔐 Segurança e Permissões

### 🛡️ Row Level Security (RLS)

#### **Políticas Implementadas**

- **Visualização**: Usuários veem apenas sua unidade
- **Edição**: Gerentes podem adicionar pontos
- **Administração**: Admins têm acesso total

#### **Isolamento por Unidade**

- Cada unidade tem lista independente
- Dados não vazam entre unidades
- Controle granular de acesso

### 👥 Níveis de Acesso

| Função       | Visualizar         | Adicionar Pontos   | Reset Manual | Histórico          |
| ------------ | ------------------ | ------------------ | ------------ | ------------------ |
| **Barbeiro** | ✅ Própria unidade | ❌                 | ❌           | ✅ Própria unidade |
| **Gerente**  | ✅ Própria unidade | ✅ Própria unidade | ❌           | ✅ Própria unidade |
| **Admin**    | ✅ Todas unidades  | ✅ Todas unidades  | ✅           | ✅ Todas unidades  |

---

## ⚙️ Automação e Agendamento

### 🤖 Edge Function para Reset Mensal

#### **Arquivo**: `supabase/functions/monthly-reset/index.ts`

```typescript
// Executa automaticamente às 23:59 do último dia do mês
// Salva histórico completo
// Zera todas as pontuações
// Reinicia ordem original
```

#### **Configuração de Cron Job**

```bash
# Executar no último dia de cada mês às 23:59
0 23 28-31 * * [ $(date -d tomorrow +\%d) -eq 1 ] && curl -X POST "https://your-project.supabase.co/functions/v1/monthly-reset"
```

### 🔄 Processo de Reset Automático

1. **23:59 do último dia do mês**
2. **Salvar snapshot** da lista atual
3. **Gravar histórico** na tabela `barbers_turn_history`
4. **Zerar pontuações** de todos os barbeiros
5. **Reordenar** por data de cadastro original
6. **Log de auditoria** da operação

---

## 📱 Interface do Usuário

### 🎨 Design System

#### **Cores e Estados**

- 🟢 **Próximo da vez**: Verde (posição 1)
- 🔵 **Posições normais**: Azul/Cinza
- 🟡 **Loading**: Spinner azul
- 🔴 **Erro**: Vermelho com ícone

#### **Componentes Reutilizáveis**

- **Cards** para estatísticas
- **Tabelas** responsivas
- **Botões** com estados
- **Modais** para confirmações

### 📱 Responsividade

#### **Breakpoints**

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

#### **Adaptações Mobile**

- Lista em cards verticais
- Botões maiores para touch
- Navegação simplificada
- Textos legíveis

---

## 🚀 Como Usar o Sistema

### 👤 Para Gerentes

1. **Acesse** `/queue`
2. **Selecione** sua unidade
3. **Visualize** a lista atual
4. **Adicione pontos** clicando em "+1 Ponto"
5. **Monitore** estatísticas em tempo real

### 👑 Para Administradores

1. **Acesse** `/queue`
2. **Visualize** todas as unidades
3. **Execute reset manual** se necessário
4. **Exporte** relatórios mensais
5. **Monitore** histórico completo

### 📊 Para Consulta de Histórico

1. **Clique** em "Ver Histórico"
2. **Selecione** mês e ano
3. **Visualize** posições finais
4. **Exporte** dados se necessário

---

## 🔧 Configuração e Instalação

### 📋 Pré-requisitos

- ✅ Supabase configurado
- ✅ Tabelas criadas via migration
- ✅ Políticas RLS ativadas
- ✅ Edge Function deployada
- ✅ Cron job configurado

### 🚀 Passos de Instalação

1. **Execute a migration**:

   ```sql
   -- Executar: supabase/migrations/create_lista_da_vez_tables.sql
   ```

2. **Deploy da Edge Function**:

   ```bash
   supabase functions deploy monthly-reset
   ```

3. **Configure o cron job**:

   ```bash
   # Adicionar ao crontab
   0 23 28-31 * * [ $(date -d tomorrow +\%d) -eq 1 ] && curl -X POST "https://your-project.supabase.co/functions/v1/monthly-reset" -H "Authorization: Bearer YOUR_SERVICE_KEY"
   ```

4. **Teste a funcionalidade**:
   - Acesse `/queue`
   - Selecione uma unidade
   - Inicialize a lista
   - Adicione pontos

---

## 📊 Métricas e Monitoramento

### 📈 KPIs do Sistema

#### **Operacionais**

- Total de barbeiros por unidade
- Pontos médios por barbeiro
- Frequência de atualizações
- Tempo de resposta da interface

#### **Qualidade**

- Distribuição justa de atendimentos
- Satisfação dos barbeiros
- Redução de conflitos
- Transparência do processo

### 🔍 Logs e Auditoria

#### **Eventos Rastreados**

- Inicialização de listas
- Adição de pontos
- Resets mensais
- Acessos ao histórico
- Exportações de dados

#### **Logs Estruturados**

```json
{
  "timestamp": "2024-10-18T23:59:00Z",
  "action": "monthly_reset_executed",
  "unit_id": "uuid",
  "total_barbers": 5,
  "total_points_reset": 25,
  "function": "monthly-reset"
}
```

---

## 🐛 Troubleshooting

### ❌ Problemas Comuns

#### **Lista não aparece**

- ✅ Verificar se unidade está selecionada
- ✅ Confirmar se existem barbeiros ativos
- ✅ Executar inicialização manual

#### **Pontos não são adicionados**

- ✅ Verificar permissões do usuário
- ✅ Confirmar conexão com Supabase
- ✅ Verificar políticas RLS

#### **Reset mensal não executa**

- ✅ Verificar cron job configurado
- ✅ Confirmar Edge Function deployada
- ✅ Verificar logs da função

#### **Histórico não carrega**

- ✅ Verificar se existem dados históricos
- ✅ Confirmar filtros de mês/ano
- ✅ Verificar permissões de acesso

### 🔧 Comandos de Diagnóstico

```sql
-- Verificar lista atual
SELECT * FROM vw_turn_list_complete WHERE unit_id = 'uuid';

-- Verificar histórico
SELECT * FROM vw_turn_history_complete WHERE unit_id = 'uuid';

-- Verificar políticas RLS
SELECT * FROM pg_policies WHERE tablename = 'barbers_turn_list';
```

---

## 🔮 Melhorias Futuras

### 🚀 Funcionalidades Planejadas

#### **Versão 2.0**

- 📱 **App mobile** nativo
- 🔔 **Notificações push** para mudanças
- 📊 **Dashboard avançado** com gráficos
- 🤖 **IA para otimização** de horários

#### **Versão 3.0**

- 🌐 **API pública** para integrações
- 📈 **Analytics avançados** de performance
- 🎯 **Metas personalizadas** por barbeiro
- 🔄 **Sincronização** com sistema de agendamento

### 🛠️ Melhorias Técnicas

#### **Performance**

- ⚡ **Cache Redis** para listas frequentes
- 🔄 **WebSockets** para atualizações em tempo real
- 📊 **Índices otimizados** para consultas rápidas

#### **Segurança**

- 🔐 **2FA** para operações críticas
- 📝 **Auditoria completa** de ações
- 🛡️ **Rate limiting** para APIs

---

## 📚 Referências e Documentação

### 📖 Documentação Técnica

- **Clean Architecture** - Robert C. Martin
- **Supabase Documentation** - https://supabase.com/docs
- **React Hooks** - https://reactjs.org/docs/hooks-intro.html
- **PostgreSQL Functions** - https://www.postgresql.org/docs/

### 🔗 Links Úteis

- **Supabase Dashboard**: https://app.supabase.com
- **Edge Functions**: https://supabase.com/docs/guides/functions
- **RLS Policies**: https://supabase.com/docs/guides/auth/row-level-security
- **Cron Jobs**: https://crontab.guru/

---

## ✅ Checklist de Implementação

### 🗄️ Banco de Dados

- ✅ Tabelas criadas (`barbers_turn_list`, `barbers_turn_history`)
- ✅ Índices otimizados
- ✅ Triggers configurados
- ✅ Funções SQL implementadas
- ✅ Políticas RLS ativadas
- ✅ Views criadas para consultas

### 🔧 Backend

- ✅ Repository layer implementado
- ✅ Service layer implementado
- ✅ DTOs para validação
- ✅ Edge Function para reset automático
- ✅ Logs e auditoria configurados

### 🎨 Frontend

- ✅ Hook customizado (`useListaDaVez`)
- ✅ Página principal (`ListaDaVezPage`)
- ✅ Componentes responsivos
- ✅ Estados de loading/error
- ✅ Feedback visual em tempo real

### 🚀 Deploy

- ✅ Migration executada
- ✅ Edge Function deployada
- ✅ Cron job configurado
- ✅ Build executada com sucesso
- ✅ Testes de funcionalidade

---

## 🎉 Conclusão

O módulo **Lista da Vez** foi implementado com sucesso seguindo todos os princípios da arquitetura Clean Architecture do Barber Analytics Pro. O sistema oferece:

- ✅ **Gestão justa** da ordem de atendimento
- ✅ **Transparência total** do processo
- ✅ **Automação completa** do reset mensal
- ✅ **Histórico permanente** de todos os meses
- ✅ **Interface intuitiva** e responsiva
- ✅ **Segurança robusta** com RLS
- ✅ **Escalabilidade** para múltiplas unidades

O sistema está **100% funcional** e pronto para uso em produção! 🚀
