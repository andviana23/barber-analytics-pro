---
title: 'Barber Analytics Pro - Clients Module'
author: 'Andrey Viana'
version: '1.0.0'
last_updated: '07/11/2025'
license: 'Proprietary - All Rights Reserved © 2025 Andrey Viana'
---

# 04.03 - Clients Module (Módulo de Clientes)

Documentação técnica completa do **Módulo de Clientes**, responsável pelo CRM, fidelização e assinaturas.

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Funcionalidades](#funcionalidades)
- [Arquitetura do Módulo](#arquitetura-do-módulo)
- [Entidades](#entidades)
- [Use Cases](#use-cases)
- [Regras de Negócio](#regras-de-negócio)

---

## 🎯 Visão Geral

O **Módulo de Clientes** gerencia:

- ✅ Cadastro de clientes (CRM básico)
- 🚧 Programa de fidelização (planejado)
- 🚧 Assinaturas mensais (planejado)
- 🚧 Histórico de atendimentos
- 🚧 Preferências e anotações

**Status:** 🚧 Em desenvolvimento (Fase 3)

---

## ⚙️ Funcionalidades

### 1. CRM Básico

**RF-03.01: Cadastro de Clientes**

- Nome, CPF, telefone, e-mail
- Data de nascimento
- Endereço completo
- Foto de perfil (opcional)
- Anotações do profissional

### 2. Programa de Fidelização

**RF-03.02: Sistema de Pontos** (Planejado)

- Acumular pontos por valor gasto
- Regras configuráveis (ex: R$ 10 = 1 ponto)
- Resgatar pontos por descontos
- Níveis de fidelidade (Bronze, Prata, Ouro)

### 3. Assinaturas

**RF-03.03: Planos Mensais** (Planejado)

- Plano Básico: X cortes/mês
- Plano Premium: ilimitado + benefícios
- Cobrança recorrente via Asaas
- Cancelamento e reativação

---

## 🏗️ Arquitetura do Módulo

### Estrutura de Arquivos

```
src/
├── pages/
│   ├── ClientsPage.jsx
│   ├── ClientDetailPage.jsx
│   └── LoyaltyPage.jsx (planejado)
├── hooks/
│   ├── useClients.js
│   └── useLoyalty.js (planejado)
├── services/
│   ├── clientService.js
│   └── loyaltyService.js (planejado)
└── repositories/
    ├── clientRepository.js
    └── loyaltyRepository.js (planejado)
```

---

## 📦 Entidades

### Client (Cliente)

```typescript
interface Client {
  id: string;
  unit_id: string;
  name: string;
  cpf?: string;
  phone: string;
  email?: string;
  birth_date?: Date;
  address?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zip_code: string;
  };
  photo_url?: string;
  notes?: string;
  loyalty_points: number;
  loyalty_level: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
```

### LoyaltyTransaction (Planejado)

```typescript
interface LoyaltyTransaction {
  id: string;
  client_id: string;
  type: 'EARN' | 'REDEEM';
  points: number;
  order_id?: string;
  description: string;
  created_at: Date;
}
```

### Subscription (Planejado)

```typescript
interface Subscription {
  id: string;
  client_id: string;
  plan_id: string;
  status: 'ACTIVE' | 'CANCELLED' | 'SUSPENDED';
  start_date: Date;
  end_date?: Date;
  payment_method_id: string;
  asaas_subscription_id?: string;
  created_at: Date;
}
```

---

## 🔄 Use Cases

### UC-01: Cadastrar Cliente

**Ator:** Recepcionista, Gerente, Admin
**Pré-condições:** Usuário autenticado

**Fluxo Principal:**

1. Usuário acessa "Clientes"
2. Clica em "Novo Cliente"
3. Preenche formulário mínimo:
   - Nome (obrigatório)
   - Telefone (obrigatório)
4. Opcionalmente preenche:
   - CPF
   - E-mail
   - Data de nascimento
   - Endereço
5. Sistema valida CPF (se fornecido)
6. Sistema valida telefone (formato brasileiro)
7. Sistema salva cliente
8. Sistema exibe toast de sucesso

**Validações:**

```javascript
// CreateClientDTO.js
class CreateClientDTO {
  validate() {
    if (!this.name || this.name.length < 3) {
      throw new Error('Nome deve ter no mínimo 3 caracteres');
    }

    if (!this.phone || !/^\(\d{2}\) \d{4,5}-\d{4}$/.test(this.phone)) {
      throw new Error('Telefone inválido');
    }

    if (this.cpf && !CPF.isValid(this.cpf)) {
      throw new Error('CPF inválido');
    }

    if (this.email && !Email.isValid(this.email)) {
      throw new Error('E-mail inválido');
    }
  }
}
```

---

### UC-02: Buscar Cliente (Planejado)

**Ator:** Todos os usuários
**Funcionalidade:** Busca rápida por nome, CPF ou telefone

**Fluxo:**

1. Usuário digita no campo de busca
2. Sistema busca em tempo real (debounce 300ms)
3. Sistema exibe resultados em dropdown
4. Usuário seleciona cliente
5. Sistema carrega detalhes do cliente

**Implementação:**

```javascript
// useClientSearch.js
export function useClientSearch() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients-search', debouncedSearch],
    queryFn: () => clientService.search(debouncedSearch),
    enabled: debouncedSearch.length >= 3,
  });

  return { clients, isLoading, search, setSearch };
}
```

---

### UC-03: Acumular Pontos de Fidelidade (Planejado)

**Trigger:** Ao fechar comanda
**Regra:** R$ 10 gastos = 1 ponto

**Fluxo:**

1. Sistema detecta fechamento de comanda
2. Sistema calcula pontos: `Math.floor(total / 10)`
3. Sistema adiciona pontos ao cliente
4. Sistema registra transação de fidelidade
5. Sistema verifica mudança de nível
6. Sistema notifica cliente (WhatsApp)

---

## 📐 Regras de Negócio

### RN-01: Validação de CPF

**Regra:** CPF opcional, mas se fornecido deve ser válido.

```javascript
// cpf.utils.js
export function validateCPF(cpf) {
  const cleaned = cpf.replace(/\D/g, '');

  if (cleaned.length !== 11) return false;

  // Verifica CPFs inválidos conhecidos
  if (/^(\d)\1+$/.test(cleaned)) return false;

  // Valida dígitos verificadores
  // ... algoritmo completo

  return true;
}
```

---

### RN-02: Telefone Brasileiro

**Formato:** (XX) XXXXX-XXXX ou (XX) XXXX-XXXX

```javascript
// phone.utils.js
export function formatPhone(phone) {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }

  return phone;
}
```

---

### RN-03: Programa de Fidelidade (Planejado)

**Níveis:**

| Nível   | Pontos Necessários | Benefícios             |
| ------- | ------------------ | ---------------------- |
| Bronze  | 0 - 99             | Nenhum                 |
| Prata   | 100 - 299          | 5% desconto            |
| Ouro    | 300 - 599          | 10% desconto           |
| Platina | 600+               | 15% desconto + brindes |

**Regra de Acúmulo:**

```javascript
// loyaltyService.js
calculatePoints(orderTotal) {
  // R$ 10 = 1 ponto
  return Math.floor(orderTotal / 10);
}

determineLoyaltyLevel(totalPoints) {
  if (totalPoints >= 600) return 'PLATINUM';
  if (totalPoints >= 300) return 'GOLD';
  if (totalPoints >= 100) return 'SILVER';
  return 'BRONZE';
}
```

---

### RN-04: Assinaturas (Planejado)

**Planos:**

| Plano   | Preço  | Cortes/Mês | Benefícios              |
| ------- | ------ | ---------- | ----------------------- |
| Básico  | R$ 99  | 2          | Agendamento prioritário |
| Premium | R$ 189 | Ilimitado  | + Produtos com 20% off  |
| VIP     | R$ 299 | Ilimitado  | + Barba ilimitada       |

**Regras:**

- Cobrança no mesmo dia de cada mês
- Cancelamento: válido até fim do período pago
- Reativação: sem carência
- Débito automático via Asaas

---

## 📊 Métricas

### KPIs do Módulo (Planejado)

| Métrica           | Meta  | Descrição                  |
| ----------------- | ----- | -------------------------- |
| Taxa de cadastro  | > 80% | % de clientes com cadastro |
| NPS               | > 70  | Net Promoter Score         |
| Retenção mensal   | > 85% | % de clientes que retornam |
| Assinantes        | 100   | Total de assinantes ativos |
| Taxa de conversão | > 15% | % que viram assinantes     |

---

## 🔗 Integrações

### 1. WhatsApp Business API (Planejado)

**Notificações:**

- Confirmação de cadastro
- Pontos acumulados
- Mudança de nível
- Lembrete de assinatura
- Promoções personalizadas

```javascript
// whatsappService.js
async sendLoyaltyNotification(client, points) {
  const message = `🎉 Parabéns, ${client.name}!
Você acumulou ${points} pontos.
Total: ${client.loyalty_points} pontos (Nível ${client.loyalty_level})`;

  await whatsapp.sendMessage(client.phone, message);
}
```

---

### 2. Asaas (Assinaturas - Planejado)

**Criar assinatura:**

```javascript
// subscriptionService.js
async createSubscription(clientId, planId) {
  const client = await clientRepository.findById(clientId);
  const plan = await planRepository.findById(planId);

  // Criar no Asaas
  const asaasResponse = await asaas.post('/v3/subscriptions', {
    customer: client.asaas_customer_id,
    billingType: 'CREDIT_CARD',
    value: plan.price,
    cycle: 'MONTHLY',
    description: plan.name
  });

  // Salvar localmente
  return await subscriptionRepository.create({
    client_id: clientId,
    plan_id: planId,
    status: 'ACTIVE',
    start_date: new Date(),
    asaas_subscription_id: asaasResponse.data.id
  });
}
```

---

## 🔗 Navegação

- [← 04.02 - Payments Module](./02_PAYMENTS.md)
- [→ 04.04 - Scheduler Module](./04_SCHEDULER.md)
- [📚 Summary](../SUMMARY.md)

---

## 📖 Referências

1. **Reichheld, Frederick F.**. _The Ultimate Question 2.0_. Harvard Business Review Press, 2011. (NPS)
2. **Kotler, Philip**. _Marketing 4.0_. Wiley, 2016.
3. **WhatsApp Business API**. https://developers.facebook.com/docs/whatsapp

---

**Última atualização:** 7 de novembro de 2025
**Versão:** 1.0.0
**Autor:** Andrey Viana
