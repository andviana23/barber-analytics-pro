---
title: 'Barber Analytics Pro - Notifications Module'
author: 'Andrey Viana'
version: '1.0.0'
last_updated: '07/11/2025'
license: 'Proprietary - All Rights Reserved © 2025 Andrey Viana'
---

# 04.06 - Notifications Module (Módulo de Notificações)

Documentação técnica completa do **Módulo de Notificações**, responsável por comunicação multicanal com clientes.

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Canais de Comunicação](#canais-de-comunicação)
- [Tipos de Notificações](#tipos-de-notificações)
- [Arquitetura](#arquitetura)
- [Integrações](#integrações)
- [Regras de Negócio](#regras-de-negócio)

---

## 🎯 Visão Geral

O **Módulo de Notificações** gerencia:

- 🚧 WhatsApp Business API (planejado)
- 🚧 SMS (planejado)
- 🚧 E-mail (planejado)
- 🚧 Push Notifications (planejado)
- 🚧 Notificações in-app

**Status:** 🚧 Planejado (Fase 4)

---

## 📱 Canais de Comunicação

### 1. WhatsApp Business

**Prioridade:** Alta
**Status:** Planejado para Fase 4

**Use Cases:**

- Lembretes de agendamento (24h e 2h antes)
- Confirmação de presença
- Notificações de fidelidade
- Promoções personalizadas
- Pesquisa de satisfação (NPS)
- Confirmação de pagamento

**Integrações:**

- WhatsApp Business API (Meta)
- Twilio WhatsApp
- Zenvia (alternativa nacional)

### 2. SMS

**Prioridade:** Média
**Status:** Planejado para Fase 4

**Use Cases:**

- Fallback para WhatsApp indisponível
- Confirmação de agendamento
- Senha de primeiro acesso
- Código de verificação (2FA)

**Integrações:**

- Twilio SMS
- Zenvia SMS
- Total Voice

### 3. E-mail

**Prioridade:** Baixa
**Status:** Planejado para Fase 4

**Use Cases:**

- Relatórios mensais para gerentes
- Fatura de assinatura
- Newsletter com dicas
- Recuperação de senha

**Integrações:**

- SendGrid
- Amazon SES
- Resend

### 4. Push Notifications

**Prioridade:** Baixa
**Status:** Planejado para Fase 5

**Use Cases:**

- Notificações in-app
- Promoções flash
- Mudança de status (agendamento confirmado)

**Integrações:**

- Firebase Cloud Messaging (FCM)
- OneSignal

---

## 📧 Tipos de Notificações

### 1. Notificações de Agendamento

**Trigger:** Agendamento criado

```javascript
// appointmentNotificationService.js
async sendAppointmentConfirmation(appointment) {
  const client = await getClient(appointment.client_id);
  const professional = await getProfessional(appointment.professional_id);

  const message = `✅ Agendamento Confirmado

Olá, ${client.name}!

Seu horário foi agendado com sucesso:

📅 Data: ${formatDate(appointment.date)}
⏰ Horário: ${appointment.time}
💈 Profissional: ${professional.name}
📍 Unidade: ${appointment.unit.name}

Para cancelar, responda CANCELAR.`;

  await whatsapp.sendMessage(client.phone, message);
}
```

**Lembrete 24h antes:**

```javascript
async sendReminder24h(appointment) {
  const message = `🗓️ Lembrete de Agendamento

Olá! Você tem um horário agendado amanhã:

📅 Data: ${formatDate(appointment.date)}
⏰ Horário: ${appointment.time}
💈 Profissional: ${appointment.professional_name}

Para confirmar, responda SIM.
Para cancelar, responda CANCELAR.`;

  await whatsapp.sendMessage(appointment.client_phone, message);
}
```

### 2. Notificações de Fidelidade

**Trigger:** Pontos acumulados

```javascript
async sendLoyaltyNotification(client, pointsEarned) {
  const message = `🎉 Você ganhou ${pointsEarned} pontos!

Total de pontos: ${client.loyalty_points}
Nível atual: ${client.loyalty_level}

${getLoyaltyBenefit(client.loyalty_level)}

Continue acumulando pontos e ganhe descontos exclusivos!`;

  await whatsapp.sendMessage(client.phone, message);
}

function getLoyaltyBenefit(level) {
  const benefits = {
    'BRONZE': 'Acumule 100 pontos para alcançar Prata e ganhar 5% de desconto!',
    'SILVER': 'Você tem 5% de desconto! Alcance Ouro para 10%!',
    'GOLD': 'Você tem 10% de desconto! Alcance Platina para 15%!',
    'PLATINUM': 'Você tem 15% de desconto + brindes exclusivos!'
  };
  return benefits[level];
}
```

**Trigger:** Mudança de nível

```javascript
async sendLevelUpNotification(client, newLevel) {
  const message = `🎊 Parabéns, ${client.name}!

Você subiu de nível no programa de fidelidade!

Novo nível: ${newLevel} 🏆

${getLoyaltyBenefit(newLevel)}

Obrigado por ser nosso cliente VIP!`;

  await whatsapp.sendMessage(client.phone, message);
}
```

### 3. Notificações de Pagamento

**Trigger:** Assinatura cobrada

```javascript
async sendPaymentConfirmation(subscription, payment) {
  const client = await getClient(subscription.client_id);

  const message = `💳 Pagamento Confirmado

Olá, ${client.name}!

Seu pagamento foi processado com sucesso:

💰 Valor: ${formatCurrency(payment.amount)}
📅 Data: ${formatDate(payment.date)}
📋 Plano: ${subscription.plan_name}
📝 Próximo vencimento: ${formatDate(payment.next_due_date)}

Obrigado por continuar conosco!`;

  await whatsapp.sendMessage(client.phone, message);
}
```

**Trigger:** Falha no pagamento

```javascript
async sendPaymentFailure(subscription, error) {
  const message = `⚠️ Falha no Pagamento

Não conseguimos processar seu pagamento:

💳 Cartão: **** ${subscription.card_last_digits}
📅 Tentativa: ${formatDate(new Date())}
❌ Motivo: ${error.message}

Por favor, atualize seus dados de pagamento em:
${getPaymentUpdateLink(subscription.id)}

Ou responda AJUDA para falar com nosso suporte.`;

  await whatsapp.sendMessage(subscription.client_phone, message);
}
```

### 4. Pesquisa de Satisfação (NPS)

**Trigger:** 2 horas após atendimento

```javascript
async sendNPSSurvey(order) {
  const client = await getClient(order.client_id);
  const professional = await getProfessional(order.professional_id);

  const message = `⭐ Como foi seu atendimento?

Olá, ${client.name}!

Em uma escala de 0 a 10, o quanto você recomendaria nossos serviços?

Profissional: ${professional.name}
Data: ${formatDate(order.closed_at)}

Responda com um número de 0 a 10.`;

  await whatsapp.sendMessage(client.phone, message);
}
```

---

## 🏗️ Arquitetura

### Estrutura de Arquivos

```
src/
├── services/
│   ├── notificationService.js (orquestrador)
│   ├── whatsappService.js
│   ├── smsService.js
│   └── emailService.js
├── templates/
│   ├── whatsapp/
│   │   ├── appointmentConfirmation.js
│   │   ├── appointmentReminder.js
│   │   └── loyaltyNotification.js
│   ├── sms/
│   │   └── appointmentReminder.js
│   └── email/
│       └── monthlyReport.js
└── workers/
    └── notificationWorker.js
```

### Notification Service (Orquestrador)

```javascript
// notificationService.js
class NotificationService {
  constructor() {
    this.channels = {
      whatsapp: new WhatsAppService(),
      sms: new SMSService(),
      email: new EmailService(),
    };
  }

  async send({ type, recipient, data, channel = 'whatsapp' }) {
    const template = this.getTemplate(type, channel);
    const message = template.render(data);

    try {
      const result = await this.channels[channel].send(recipient, message);
      await this.logNotification(type, recipient, channel, 'SENT', result);
      return { success: true, result };
    } catch (error) {
      await this.logNotification(type, recipient, channel, 'FAILED', error);
      return { success: false, error };
    }
  }

  getTemplate(type, channel) {
    const templates = {
      whatsapp: {
        appointment_confirmation: appointmentConfirmationTemplate,
        appointment_reminder: appointmentReminderTemplate,
        loyalty_notification: loyaltyNotificationTemplate,
      },
      sms: {
        appointment_reminder: smsAppointmentReminderTemplate,
      },
      email: {
        monthly_report: monthlyReportTemplate,
      },
    };

    return templates[channel][type];
  }

  async logNotification(type, recipient, channel, status, result) {
    await supabase.from('notification_logs').insert({
      type,
      recipient,
      channel,
      status,
      result: JSON.stringify(result),
      sent_at: new Date(),
    });
  }
}
```

### WhatsApp Service

```javascript
// whatsappService.js
import axios from 'axios';

class WhatsAppService {
  constructor() {
    this.apiUrl = import.meta.env.VITE_WHATSAPP_API_URL;
    this.apiKey = import.meta.env.VITE_WHATSAPP_API_KEY;
  }

  async sendMessage(phone, message) {
    const formattedPhone = this.formatPhone(phone);

    const response = await axios.post(
      `${this.apiUrl}/messages`,
      {
        to: formattedPhone,
        type: 'text',
        text: { body: message },
      },
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  }

  async sendTemplate(phone, templateName, params) {
    const formattedPhone = this.formatPhone(phone);

    const response = await axios.post(
      `${this.apiUrl}/messages`,
      {
        to: formattedPhone,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'pt_BR' },
          components: [
            {
              type: 'body',
              parameters: params.map(p => ({ type: 'text', text: p })),
            },
          ],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  }

  formatPhone(phone) {
    // Remove caracteres não numéricos
    const cleaned = phone.replace(/\D/g, '');

    // Adiciona código do país se não tiver
    if (!cleaned.startsWith('55')) {
      return `55${cleaned}`;
    }

    return cleaned;
  }
}
```

---

## 🔗 Integrações

### 1. Twilio WhatsApp

**Setup:**

```javascript
// .env
VITE_TWILIO_ACCOUNT_SID = your_account_sid;
VITE_TWILIO_AUTH_TOKEN = your_auth_token;
VITE_TWILIO_WHATSAPP_NUMBER = +14155238886;
```

**Envio:**

```javascript
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function sendWhatsAppMessage(to, body) {
  const message = await client.messages.create({
    from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
    to: `whatsapp:+55${to}`,
    body,
  });

  return message;
}
```

### 2. Zenvia (Alternativa Nacional)

```javascript
// zenviaService.js
import axios from 'axios';

class ZenviaService {
  constructor() {
    this.apiKey = import.meta.env.VITE_ZENVIA_API_KEY;
    this.apiUrl = 'https://api.zenvia.com/v2';
  }

  async sendWhatsApp(to, content) {
    const response = await axios.post(
      `${this.apiUrl}/channels/whatsapp/messages`,
      {
        from: 'your-whatsapp-number',
        to,
        contents: [{ type: 'text', text: content }],
      },
      {
        headers: {
          'X-API-TOKEN': this.apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  }
}
```

---

## 📐 Regras de Negócio

### RN-01: Horários de Envio

**Regra:** Notificações só podem ser enviadas entre 8h e 21h.

```javascript
function canSendNotification() {
  const now = new Date();
  const hour = now.getHours();
  return hour >= 8 && hour < 21;
}

async function scheduleNotification(notification, sendAt) {
  if (!canSendNotification()) {
    // Agendar para próximo dia útil às 9h
    const nextDay = new Date(sendAt);
    nextDay.setDate(nextDay.getDate() + 1);
    nextDay.setHours(9, 0, 0, 0);
    sendAt = nextDay;
  }

  await notificationQueue.add(notification, {
    delay: sendAt - Date.now(),
  });
}
```

### RN-02: Opt-out

**Regra:** Respeitar pedido de não receber mensagens.

```javascript
async function shouldSendNotification(clientId, channel) {
  const preferences = await getNotificationPreferences(clientId);
  return preferences[channel] !== false;
}
```

### RN-03: Rate Limiting

**Regra:** Máximo 3 mensagens por cliente por dia.

```javascript
async function checkRateLimit(clientId) {
  const today = startOfDay(new Date());
  const count = await supabase
    .from('notification_logs')
    .select('id', { count: 'exact' })
    .eq('recipient', clientId)
    .gte('sent_at', today.toISOString());

  return count.count < 3;
}
```

---

## 📊 Métricas

### KPIs do Módulo

| Métrica                | Meta      | Descrição                     |
| ---------------------- | --------- | ----------------------------- |
| Taxa de entrega        | > 95%     | % de mensagens entregues      |
| Taxa de abertura       | > 80%     | % de mensagens lidas          |
| Taxa de resposta       | > 30%     | % de clientes que responderam |
| Tempo médio de entrega | < 5s      | Latência de envio             |
| Custo por mensagem     | < R$ 0,15 | Custo médio                   |

---

## 🔗 Navegação

- [← 04.05 - Reports Module](./05_REPORTS.md)
- [→ 05 - Infrastructure](../05_INFRASTRUCTURE.md)
- [📚 Summary](../SUMMARY.md)

---

## 📖 Referências

1. **Twilio WhatsApp API**. https://www.twilio.com/docs/whatsapp
2. **Meta WhatsApp Business API**. https://developers.facebook.com/docs/whatsapp
3. **Zenvia API**. https://zenvia.github.io/zenvia-openapi-spec

---

**Última atualização:** 7 de novembro de 2025
**Versão:** 1.0.0
**Autor:** Andrey Viana
