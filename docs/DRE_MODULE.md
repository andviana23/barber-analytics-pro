# 📊 MÓDULO DRE - Demonstração do Resultado do Exercício

> **Sistema completo de DRE automatizado extraindo dados diretamente do banco de dados**
>
> **Criado em:** 2024-10-18  
> **Autor:** AI Agent  
> **Projeto:** BARBER-ANALYTICS-PRO

---

## 🎯 Visão Geral

O Módulo DRE implementa a geração automática da **Demonstração do Resultado do Exercício**, um relatório contábil fundamental que mostra a lucratividade da empresa em um determinado período.

### Características Principais

- ✅ **Cálculo 100% Automatizado** - Extrai dados de `revenues` e `expenses`
- ✅ **Hierarquia Fixada** - Segue o formato contábil padrão da Trato de Barbados
- ✅ **Categorização Inteligente** - Mapeia categorias automaticamente
- ✅ **Indicadores Financeiros** - Calcula margens e percentuais
- ✅ **Exportação** - Permite exportar em formato TXT
- ✅ **Comparação de Períodos** - Analisa variações entre períodos
- ✅ **Multi-Período** - Mês atual, ano, ou customizado
- ✅ **Clean Architecture** - Separação clara de responsabilidades

---

## 🏗️ Arquitetura

### Camadas da Aplicação

```
┌─────────────────────────────────────────────────────┐
│                   PRESENTATION                      │
│                   (DREPage.jsx)                     │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│                   HOOKS LAYER                       │
│                   (useDRE.js)                       │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│                  SERVICE LAYER                      │
│                  (dreService.js)                    │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│                DATABASE FUNCTION                    │
│              (fn_calculate_dre)                     │
└─────────────────────────────────────────────────────┘
```

---

## 📁 Estrutura de Arquivos

```
barber-analytics-pro/
├── src/
│   ├── services/
│   │   └── dreService.js           # Serviço de negócio do DRE
│   ├── hooks/
│   │   └── useDRE.js                # Hook customizado React
│   └── pages/
│       └── DREPage.jsx              # Interface do usuário
└── supabase/
    └── migrations/
        └── create_dre_function.sql  # Função SQL fn_calculate_dre
```

---

## 🗄️ Banco de Dados

### Função SQL: `fn_calculate_dre`

**Assinatura:**

```sql
fn_calculate_dre(
  p_unit_id UUID,
  p_start_date DATE,
  p_end_date DATE
) RETURNS JSON
```

**Descrição:**  
Calcula o DRE completo para uma unidade em um período específico, retornando JSON estruturado.

**Exemplo de Uso:**

```sql
SELECT fn_calculate_dre(
  'uuid-da-unidade',
  '2024-01-01',
  '2024-01-31'
);
```

**Estrutura do JSON Retornado:**

```json
{
  "periodo": {
    "inicio": "2024-01-01",
    "fim": "2024-01-31"
  },
  "receita_bruta": {
    "receita_servico": {
      "assinatura": 50000.0,
      "avulso": 30000.0,
      "total": 80000.0
    },
    "receita_produtos": {
      "cosmeticos": 15000.0,
      "total": 15000.0
    },
    "total": 95000.0
  },
  "custos_operacionais": {
    "bebidas_cortesias": 2000.0,
    "bonificacoes_metas": 3000.0,
    "comissoes": 15000.0,
    "limpeza_lavanderia": 1500.0,
    "produtos_uso_interno": 5000.0,
    "total": 26500.0
  },
  "margem_contribuicao": 68500.0,
  "despesas_administrativas": {
    "aluguel_condominio": 8000.0,
    "contabilidade": 1500.0,
    "contas_fixas": 3000.0,
    "encargos_beneficios": 12000.0,
    "manutencao_seguros": 2000.0,
    "marketing_comercial": 5000.0,
    "salarios_prolabore": 20000.0,
    "sistemas": 1000.0,
    "total": 52500.0
  },
  "ebit": 16000.0,
  "impostos": {
    "simples_nacional": 1280.0,
    "total": 1280.0
  },
  "lucro_liquido": 14720.0,
  "indicadores": {
    "margem_contribuicao_percentual": 72.11,
    "margem_ebit_percentual": 16.84,
    "margem_liquida_percentual": 15.49
  }
}
```

### Categorias Utilizadas

#### Receitas (Revenue)

| Categoria Principal | Subcategoria | Campo DB              |
| ------------------- | ------------ | --------------------- |
| Receita de Serviço  | Assinatura   | `name = 'Assinatura'` |
| Receita de Serviço  | Avulso       | `name = 'Avulso'`     |
| Receita Produtos    | Cosméticos   | `name = 'Cosmeticos'` |

#### Despesas (Expense)

**Custos Operacionais:**

- Bebidas e cortesias
- Bonificações e metas
- Comissões
- Limpeza e lavanderia
- Produtos de uso interno

**Despesas Administrativas:**

- Aluguel e condomínio
- Contabilidade
- Contas fixas (energia, água, internet, telefone)
- Encargos e benefícios
- Manutenção e Seguros
- Marketing e Comercial
- Salários / Pró-labore
- Sistemas

**Impostos:**

- Simples Nacional

---

## 💻 Service Layer

### `dreService.js`

Classe singleton que encapsula toda a lógica de negócio do DRE.

**Métodos Principais:**

#### `calculateDRE({ unitId, startDate, endDate })`

Calcula o DRE para um período customizado.

```javascript
const { data, error } = await dreService.calculateDRE({
  unitId: 'uuid-da-unidade',
  startDate: '2024-01-01',
  endDate: '2024-01-31',
});
```

#### `calculateCurrentMonthDRE(unitId)`

Calcula o DRE do mês atual.

```javascript
const { data, error } = await dreService.calculateCurrentMonthDRE(unitId);
```

#### `calculateMonthDRE(unitId, year, month)`

Calcula o DRE de um mês específico.

```javascript
const { data, error } = await dreService.calculateMonthDRE(
  unitId,
  2024,
  3 // Março
);
```

#### `calculateYearDRE(unitId, year)`

Calcula o DRE acumulado do ano.

```javascript
const { data, error } = await dreService.calculateYearDRE(unitId, 2024);
```

#### `compareDRE({ unitId, period1Start, period1End, period2Start, period2End })`

Compara DREs de dois períodos.

```javascript
const { data, error } = await dreService.compareDRE({
  unitId,
  period1Start: '2024-01-01',
  period1End: '2024-01-31',
  period2Start: '2024-02-01',
  period2End: '2024-02-29',
});
```

#### `exportAsText(dreData)`

Exporta o DRE em formato texto legível.

```javascript
const text = dreService.exportAsText(dre);
console.log(text);
```

---

## ⚛️ Hook Layer

### `useDRE(options)`

Hook customizado React que gerencia estado e operações do DRE.

**Opções:**

```javascript
{
  autoLoad: false,        // Carregar automaticamente ao montar
  initialPeriod: 'month'  // Período inicial: 'month', 'year', 'custom'
}
```

**Retorno:**

```javascript
{
  // Estados
  (dre, // Dados do DRE
    loading, // Estado de carregamento
    error, // Erro (se houver)
    period, // Período atual
    customDates, // Datas customizadas
    comparisonMode, // Modo de comparação ativo
    comparisonData, // Dados da comparação
    // Métodos
    loadDRE, // Carrega DRE
    loadMonthDRE, // Carrega DRE de um mês
    refreshDRE, // Recarrega DRE atual
    comparePeriods, // Compara períodos
    updatePeriod, // Atualiza período
    updateCustomDates, // Atualiza datas customizadas
    exportDRE, // Exporta DRE
    clearDRE, // Limpa DRE
    // Informações derivadas
    hasData, // Tem dados carregados
    isEmpty); // DRE vazio (sem movimentações)
}
```

**Exemplo de Uso:**

```javascript
import { useDRE } from '../hooks/useDRE';

function MyComponent() {
  const { dre, loading, error, loadDRE, exportDRE } = useDRE({
    autoLoad: true,
  });

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error.message}</div>;
  if (!dre) return <div>Sem dados</div>;

  return (
    <div>
      <h1>DRE</h1>
      <p>Receita Bruta: {dre.receita_bruta.total}</p>
      <button onClick={exportDRE}>Exportar</button>
    </div>
  );
}
```

---

## 🎨 Presentation Layer

### `DREPage.jsx`

Componente React que renderiza a interface do DRE.

**Funcionalidades:**

- ✅ Seleção de período (mês atual, ano, customizado)
- ✅ Visualização hierárquica do DRE
- ✅ Indicadores visuais (margem de contribuição, EBIT, lucro líquido)
- ✅ Formatação monetária brasileira
- ✅ Exportação em TXT
- ✅ Estados de loading e erro
- ✅ Empty states para períodos sem dados
- ✅ Design responsivo (mobile-first)
- ✅ Dark mode

**Acesso:**

```
URL: /dre
Permissões: admin, gerente
```

---

## 📊 Formato do DRE

### Estrutura Contábil

```
RECEITA BRUTA
 (+) Receita de Serviço
     Assinatura
     Avulso
 (+) Receita de Produto
     Cosméticos
= RECEITA BRUTA

(-) Custos OPERACIONAIS
    Bebidas e cortesias
    Bonificações e metas
    Comissões
    Limpeza e lavanderia
    Produtos de uso interno
= MARGEM DE CONTRIBUIÇÃO

(-) Despesas ADMINISTRATIVAS
    Aluguel e condomínio
    Contabilidade
    Contas fixas (energia, água, internet, telefone)
    Encargos e benefícios
    Manutenção e Seguros
    Marketing e Comercial
    Salários / Pró-labore
    Sistemas
= RESULTADO ANTES DOS IMPOSTOS (EBIT)

(-) IMPOSTO
    Simples Nacional
= LUCRO LÍQUIDO DO PERÍODO
```

---

## 🧮 Indicadores Calculados

### Margem de Contribuição (%)

```
(Margem de Contribuição / Receita Bruta) × 100
```

Indica quanto sobra da receita após cobrir custos operacionais.

### Margem EBIT (%)

```
(EBIT / Receita Bruta) × 100
```

Indica o resultado operacional antes de impostos.

### Margem Líquida (%)

```
(Lucro Líquido / Receita Bruta) × 100
```

Indica o lucro real após todos os custos e impostos.

---

## 🔧 Configuração e Uso

### 1. Criar Categorias no Banco

As categorias já devem estar criadas conforme especificado. Verifique com:

```sql
SELECT * FROM categories
WHERE category_type IN ('Revenue', 'Expense')
AND is_active = true
ORDER BY category_type, parent_id NULLS FIRST;
```

### 2. Lançar Receitas e Despesas

Ao lançar receitas e despesas, **sempre vincule a categoria correta**:

```javascript
// Exemplo: Lançar receita de assinatura
await revenueService.create({
  unit_id: unitId,
  type: 'service',
  value: 150.0,
  date: '2024-01-15',
  category_id: 'uuid-da-categoria-assinatura', // Importante!
  // ... outros campos
});
```

### 3. Acessar o DRE

```
1. Fazer login como admin ou gerente
2. Navegar para /dre
3. Selecionar período desejado
4. Visualizar relatório
5. Exportar se necessário
```

---

## 🔐 Segurança

### Row Level Security (RLS)

A função `fn_calculate_dre` utiliza `SECURITY DEFINER`, mas os dados são sempre filtrados por `unit_id`, garantindo isolamento multi-tenant.

### Permissões de Acesso

- **Página DRE:** Apenas `admin` e `gerente`
- **Função SQL:** Apenas usuários autenticados (`authenticated`)
- **Dados:** Sempre filtrados por unidade do usuário

---

## 🧪 Testes

### Testar Função SQL

```sql
-- Teste com dados fictícios
SELECT fn_calculate_dre(
  (SELECT id FROM units LIMIT 1),
  CURRENT_DATE - INTERVAL '1 month',
  CURRENT_DATE
);
```

### Testar Service

```javascript
import { dreService } from './services/dreService';

// Testar cálculo mensal
const result = await dreService.calculateCurrentMonthDRE(unitId);
console.log(result);

// Testar exportação
if (result.data) {
  const text = dreService.exportAsText(result.data);
  console.log(text);
}
```

---

## 📈 Exemplo Real

### Cenário: Janeiro 2024 - Unidade Centro

**Receitas:**

- Assinatura: R$ 50.000,00
- Avulso: R$ 30.000,00
- Cosméticos: R$ 15.000,00
- **Total:** R$ 95.000,00

**Custos Operacionais:**

- Comissões: R$ 15.000,00
- Produtos de uso interno: R$ 5.000,00
- Bonificações: R$ 3.000,00
- Bebidas: R$ 2.000,00
- Limpeza: R$ 1.500,00
- **Total:** R$ 26.500,00

**Margem de Contribuição:** R$ 68.500,00 (72,11%)

**Despesas Administrativas:**

- Salários: R$ 20.000,00
- Encargos: R$ 12.000,00
- Aluguel: R$ 8.000,00
- Marketing: R$ 5.000,00
- Contas fixas: R$ 3.000,00
- Manutenção: R$ 2.000,00
- Contabilidade: R$ 1.500,00
- Sistemas: R$ 1.000,00
- **Total:** R$ 52.500,00

**EBIT:** R$ 16.000,00 (16,84%)

**Impostos:**

- Simples Nacional (8%): R$ 1.280,00

**Lucro Líquido:** R$ 14.720,00 (15,49%)

---

## 🎓 Boas Práticas

### 1. Sempre Categorizar

Nunca deixe receitas ou despesas sem categoria. Isso quebra o DRE.

### 2. Revisar Categorias

Periodicamente, revise se as categorias estão sendo usadas corretamente.

### 3. Exportar Mensalmente

Mantenha histórico mensal exportado em TXT para auditoria.

### 4. Comparar Períodos

Use a função de comparação para identificar tendências.

### 5. Validar Margens

- Margem de Contribuição deve ser > 50%
- Margem EBIT deve ser > 10%
- Margem Líquida deve ser positiva

---

## 🔄 Fluxo de Dados

```
1. Usuário seleciona período
   ↓
2. Hook useDRE chama dreService
   ↓
3. dreService valida parâmetros
   ↓
4. dreService chama fn_calculate_dre via RPC
   ↓
5. Função SQL consulta revenues e expenses
   ↓
6. Função SQL agrupa por categoria
   ↓
7. Função SQL calcula totais e indicadores
   ↓
8. JSON retorna para dreService
   ↓
9. dreService enriquece dados
   ↓
10. Hook atualiza estado
   ↓
11. DREPage renderiza interface
```

---

## 📚 Referências

- **Clean Architecture** — Robert C. Martin
- **Patterns of Enterprise Application Architecture** — Martin Fowler
- **Princípios Contábeis** — CPC (Comitê de Pronunciamentos Contábeis)
- **DRE Gerencial** — Sebrae

---

## 🚀 Próximas Melhorias

- [ ] Exportação em PDF
- [ ] Gráficos visuais (Recharts)
- [ ] Comparação multi-períodos (3+ períodos)
- [ ] DRE consolidado (todas as unidades)
- [ ] Projeção de DRE (forecast)
- [ ] Análise vertical e horizontal
- [ ] Integração com metas
- [ ] Alertas de desvio de margens

---

## 📞 Suporte

Para dúvidas ou problemas:

1. Verificar logs do navegador (console)
2. Verificar logs do Supabase
3. Validar categorias no banco
4. Consultar esta documentação

---

**📅 Documento atualizado em:** 2024-10-18  
**✍️ Autor:** AI Agent - BARBER-ANALYTICS-PRO  
**📖 Versão:** 1.0.0
