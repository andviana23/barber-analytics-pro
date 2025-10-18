# 🏗️ ARQUITETURA DO SISTEMA

> **Clean Architecture + Domain-Driven Design + CQRS + Event Sourcing**
> 
> **Atualizado em:** 2024-10-17 via Supabase MCP

---

## 🎯 Visão Arquitetural

O **BARBER-ANALYTICS-PRO** implementa **Clean Architecture** com separação clara de responsabilidades, seguindo princípios **SOLID** e **DDD**.

### **Princípios Arquiteturais**
- ✅ **Independence of UI** - Business logic independente da interface
- ✅ **Independence of Database** - Regras de negócio não conhecem detalhes do BD
- ✅ **Independence of External Agency** - Core isolado de frameworks
- ✅ **Testability** - Regras de negócio testáveis sem dependências externas

### **Estrutura Atual do Banco (Supabase)**
- **10 Tabelas** com RLS ativo
- **4 Views** otimizadas para relatórios
- **5 ENUMs** para integridade de dados
- **Multi-tenant** por `unit_id`
- **Soft delete** com `is_active`

---

## 🎂 Camadas da Arquitetura

### **1. Presentation Layer** (`src/pages/`, `src/organisms/`)
```
Responsabilidades:
- Renderização de UI
- Captura de eventos do usuário
- Formatação de dados para exibição
- Roteamento e navegação
```

### **2. Application Layer** (`src/services/`)
```
Responsabilidades:
- Orquestração de fluxos de negócio
- Coordenação entre entidades
- Aplicação de regras de negócio
- Transformação de dados (DTOs)
```

### **3. Domain Layer** (`src/dtos/`, Business Rules)
```
Responsabilidades:
- Entidades de domínio
- Value Objects
- Domain Services
- Regras de negócio puras
```

### **4. Infrastructure Layer** (`src/repositories/`, `src/services/supabase.js`)
```
Responsabilidades:
- Acesso a dados
- Integração com APIs externas
- Implementação de interfaces
- Detalhes de infraestrutura
```

---

## 📊 Diagrama de Dependências

```
┌─────────────────────────────────────────────────────────┐
│                    PRESENTATION                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │    Pages    │ │ Organisms   │ │ Templates   │      │
│  └─────────────┘ └─────────────┘ └─────────────┘      │
└─────────────────────┬───────────────────────────────────┘
                      │ ⬇️ Dependency Inversion
┌─────────────────────┴───────────────────────────────────┐
│                  APPLICATION                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │  Services   │ │    Hooks    │ │   Context   │      │
│  └─────────────┘ └─────────────┘ └─────────────┘      │
└─────────────────────┬───────────────────────────────────┘
                      │ ⬇️ Business Rules
┌─────────────────────┴───────────────────────────────────┐
│                    DOMAIN                               │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │    DTOs     │ │ Validators  │ │Business Rules│      │
│  └─────────────┘ └─────────────┘ └─────────────┘      │
└─────────────────────┬───────────────────────────────────┘
                      │ ⬇️ Data Contracts
┌─────────────────────┴───────────────────────────────────┐
│                INFRASTRUCTURE                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │Repositories │ │   Supabase  │ │External APIs│      │
│  └─────────────┘ └─────────────┘ └─────────────┘      │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 Fluxo de Dados (CQRS Pattern)

### **Command Flow (Escrita)**
```
UI Component 
    ↓
Service Layer (Command Handler)
    ↓  
Domain Layer (Business Rules)
    ↓
Repository Layer (Persistence)
    ↓
Database (Supabase PostgreSQL)
```

### **Query Flow (Leitura)**
```
UI Component
    ↓
Custom Hook (Query Handler)
    ↓
Service Layer (Data Transformation)
    ↓
Repository/Views (Optimized Queries)
    ↓
Database Views (Pre-computed Data)
```

---

## 🎨 Atomic Design Implementation

### **Hierarquia de Componentes**

```
🔹 ATOMS (Elementos Básicos)
├── Button.jsx           # Botões do sistema
├── Input.jsx            # Campos de entrada
├── Card.jsx             # Cards básicos
├── Badge.jsx            # Labels e badges
└── Icon.jsx             # Ícones (Lucide React)

🔸 MOLECULES (Composições Simples)  
├── KPICard.jsx          # Cards de métricas
├── SearchBar.jsx        # Barra de busca
├── FormField.jsx        # Campo de formulário completo
├── TableRow.jsx         # Linha de tabela
└── ActionButtons.jsx    # Grupo de botões de ação

🔶 ORGANISMS (Estruturas Complexas)
├── Navbar.jsx           # Barra de navegação
├── Sidebar.jsx          # Menu lateral
├── DataTable.jsx        # Tabelas completas
├── Chart.jsx            # Gráficos (Recharts)
└── Modal.jsx            # Modais do sistema

🔷 TEMPLATES (Layouts)
├── MainLayout.jsx       # Layout principal
├── AuthLayout.jsx       # Layout de autenticação
├── DashboardTemplate.jsx # Template do dashboard
└── ReportTemplate.jsx   # Template de relatórios

🔵 PAGES (Páginas Completas)
├── DashboardPage.jsx    # Dashboard principal
├── FinanceiroAdvancedPage.jsx # Módulo financeiro
├── ProfessionalsPage.jsx     # Gestão de profissionais
└── ReportsPage.jsx      # Relatórios
```

---

## 📦 Módulos Principais

### **🏦 Financial Module**
```
Services:
├── financeiroService.js      # CRUD receitas/despesas
├── cashflowService.js        # Fluxo de caixa  
├── calendarService.js        # Calendário financeiro
├── reconciliationService.js  # Conciliação bancária
└── partiesService.js         # Clientes/Fornecedores

Repositories:
└── revenueRepository.js      # Data access para receitas

DTOs:
└── revenueDTO.js            # Validação e transformação
```

### **👥 Professionals Module**
```
Services:
├── profissionaisService.js   # CRUD profissionais
├── filaService.js           # Sistema de filas
└── auditService.js          # Logs de auditoria

Database:
├── professionals            # Tabela de profissionais
├── fila_atendimento        # Fila de atendimento
└── historico_atendimentos  # Histórico de atendimentos
```

### **🏢 Units Module**
```
Services:
├── unitsService.js          # CRUD unidades
└── dashboardService.js      # Métricas por unidade

Multi-Tenancy:
├── RLS Policies             # Isolamento por unidade
└── User-Unit Mapping       # Profissionais → Unidades
```

---

## 🔐 Segurança e Isolamento

### **Row Level Security (RLS)**
```sql
-- Exemplo: Isolamento por Unidade
CREATE POLICY "unit_isolation" ON revenues
  FOR ALL USING (
    unit_id IN (
      SELECT unit_id 
      FROM professionals 
      WHERE user_id = auth.uid()
    )
  );
```

### **Níveis de Permissão**
```javascript
// Context de Autenticação
const AuthContext = {
  user: {
    id: "uuid",
    role: "admin" | "gerente" | "barbeiro",
    unit_id: "uuid",
    permissions: ["read:all", "write:own_unit"]
  }
};
```

### **Middleware de Autorização**
```javascript
// Higher-Order Component para Proteção
const withRoleProtection = (Component, requiredRoles) => {
  return (props) => {
    const { user } = useAuth();
    if (!requiredRoles.includes(user.role)) {
      return <UnauthorizedPage />;
    }
    return <Component {...props} />;
  };
};
```

---

## 🔧 Patterns Implementados

### **1. Repository Pattern**
```javascript
// Abstração de acesso a dados
class RevenueRepository {
  async findAll(filters, page, limit) {
    // Implementação específica do Supabase
    const query = supabase.from('revenues');
    // Aplicar filtros, paginação, etc.
    return { data, error, count };
  }
}
```

### **2. Service Layer Pattern**
```javascript
// Orquestração de negócio
class FinanceiroService {
  async createReceita(data) {
    // 1. Validar com DTO
    const validation = CreateRevenueDTO.validate(data);
    // 2. Aplicar regras de negócio
    const businessData = this.applyBusinessRules(data);
    // 3. Delegar ao Repository
    return await revenueRepository.create(businessData);
  }
}
```

### **3. DTO Pattern**
```javascript
// Validação e transformação de dados
export class CreateRevenueDTO {
  static validate(data) {
    // Validações de negócio
    if (!data.value || data.value <= 0) {
      throw new Error('Value must be positive');
    }
    return this.sanitize(data);
  }
}
```

### **4. Custom Hooks Pattern**
```javascript
// Encapsulamento de estado e lógica
export const useReceitas = (filters) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const fetchReceitas = useCallback(async () => {
    setLoading(true);
    const result = await financeiroService.getReceitas(filters);
    setData(result.data);
    setLoading(false);
  }, [filters]);

  return { data, loading, refetch: fetchReceitas };
};
```

---

## 📊 Performance e Otimização

### **Database Layer**
```sql
-- Views Otimizadas para Relatórios
CREATE VIEW vw_dashboard_financials AS
SELECT 
  month,
  SUM(revenues) as total_revenues,
  SUM(expenses) as total_expenses,
  SUM(revenues) - SUM(expenses) as net_profit
FROM monthly_summaries
GROUP BY month
ORDER BY month DESC;

-- Índices Estratégicos
CREATE INDEX idx_revenues_unit_date 
ON revenues(unit_id, date) 
WHERE is_active = true;
```

### **Frontend Layer**
```javascript
// Memoização de Componentes
const ExpensiveComponent = React.memo(({ data }) => {
  return <ComplexVisualization data={data} />;
}, (prevProps, nextProps) => {
  return prevProps.data.id === nextProps.data.id;
});

// Lazy Loading de Rotas
const FinanceiroPage = lazy(() => 
  import('./pages/FinanceiroAdvancedPage')
);
```

### **Caching Strategy**
```javascript
// Service Layer Caching
class CacheService {
  static cache = new Map();
  
  static async getWithCache(key, fetcher, ttl = 300000) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }
    
    const data = await fetcher();
    this.cache.set(key, { data, timestamp: Date.now() });
    return data;
  }
}
```

---

## 🧪 Testability

### **Unit Tests Structure**
```javascript
// Service Layer Testing
describe('FinanceiroService', () => {
  let mockRepository;
  
  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      findAll: jest.fn()
    };
  });
  
  it('should create receita with validation', async () => {
    // Given
    const receitaData = { value: 100, type: 'service' };
    mockRepository.create.mockResolvedValue({ data: { id: '123' } });
    
    // When
    const result = await financeiroService.createReceita(receitaData);
    
    // Then
    expect(mockRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ value: 100 })
    );
    expect(result.data.id).toBe('123');
  });
});
```

### **Integration Tests**
```javascript
// End-to-End Testing with Database
describe('Financial Module Integration', () => {
  it('should complete full revenue creation flow', async () => {
    // Test real database interaction
    const result = await request(app)
      .post('/api/receitas')
      .send({ value: 150, type: 'product' })
      .expect(201);
    
    expect(result.body.id).toBeDefined();
  });
});
```

---

## 🔄 Event-Driven Architecture

### **Domain Events**
```javascript
// Evento de Negócio
class RevenueCreatedEvent {
  constructor(revenue) {
    this.type = 'REVENUE_CREATED';
    this.payload = revenue;
    this.timestamp = new Date();
  }
}

// Event Handler
class MonthlyReportHandler {
  handle(event) {
    if (event.type === 'REVENUE_CREATED') {
      // Atualizar sumário mensal
      this.updateMonthlySummary(event.payload);
    }
  }
}
```

### **Realtime Updates**
```javascript
// Supabase Realtime Integration
useEffect(() => {
  const subscription = supabase
    .channel('revenues')
    .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'revenues' },
        (payload) => {
          // Atualizar estado em tempo real
          setReceitas(prev => [...prev, payload.new]);
        })
    .subscribe();

  return () => subscription.unsubscribe();
}, []);
```

---

## 📈 Escalabilidade

### **Horizontal Scaling**
- **Database Sharding** por unidade
- **CDN** para assets estáticos  
- **Edge Functions** para computação distribuída

### **Vertical Scaling**
- **Database Views** para queries complexas
- **Computed Fields** para cálculos pré-processados
- **Índices Compostos** para queries frequentes

### **Caching Layers**
- **Browser Cache** (Service Workers)
- **Application Cache** (React Query/SWR)
- **Database Cache** (Supabase Edge Cache)

---

## 🧠 Automação IA do Sistema

O **BARBER-ANALYTICS-PRO** possui **comandos Cursor** automatizados para acelerar o desenvolvimento e manter a qualidade arquitetural.

### **Comandos Disponíveis** (`.cursor/commands/`)

| Comando | Descrição | Uso |
|---------|-----------|-----|
| **create-module** | Gera módulo completo (DTO → Service → Repository → Hook → Page) | Cria nova funcionalidade seguindo Clean Architecture |
| **generate-dto** | Cria DTO validado a partir da tabela do banco via @pgsql | Analisa schema e gera validações automáticas |
| **generate-sql-rls** | Cria tabela com RLS automático (isolamento multi-tenant) | Garante segurança desde o início |
| **document-endpoint** | Gera documentação técnica em Markdown | Documenta endpoints e payloads automaticamente |
| **audit-architecture** | Audita violações de Clean Architecture e SOLID | Identifica acoplamento, duplicação, etc. |
| **generate-tests** | Cria testes unitários e de integração (cobertura 80%+) | Gera suíte de testes completa |
| **sync-schema** | Sincroniza DATABASE_SCHEMA.md com banco real via @pgsql | Mantém documentação sempre atualizada |

### **Como Usar os Comandos**

#### **1. Via Paleta do Cursor**
```
Ctrl+Shift+P → Digite o nome do comando → Enter
```

#### **2. Via Prompt Direto**
```
> /create-module clients
> /generate-dto revenues
> /audit-architecture
```

### **Exemplo de Fluxo Completo**

```bash
# 1. Criar tabela no banco com RLS
> /generate-sql-rls clients

# 2. Gerar DTO a partir da tabela
> /generate-dto clients

# 3. Criar módulo completo
> /create-module clients

# 4. Gerar testes
> /generate-tests clientsService

# 5. Documentar endpoints
> /document-endpoint clientsService

# 6. Auditar arquitetura
> /audit-architecture

# 7. Sincronizar schema
> /sync-schema
```

### **Integração com MCP (@pgsql)**

Todos os comandos que interagem com o banco usam o conector **@pgsql** configurado no Cursor:

```json
// .cursor/mcp.json
{
  "mcpServers": {
    "supabase-mcp": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "POSTGRES_CONNECTION_URL": "postgresql://..."
      }
    }
  }
}
```

### **Benefícios da Automação**

✅ **Consistência Arquitetural:** Todos os módulos seguem o mesmo padrão
✅ **Velocidade:** Cria módulos completos em minutos
✅ **Qualidade:** Validações, RLS e testes gerados automaticamente
✅ **Documentação Sincronizada:** Schema sempre atualizado
✅ **Auditoria Contínua:** Detecta violações arquiteturais cedo

---

**🔗 Links Relacionados:**
- [Financial Module Documentation](./FINANCIAL_MODULE.md)
- [API Reference](./API_REFERENCE.md)
- [Database Schema](./DATABASE_SCHEMA.md)
- [Cursor Commands](.cursor/commands/)

---

*Última atualização: 18/10/2025*