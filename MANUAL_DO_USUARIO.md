# 📖 BARBER ANALYTICS PRO - MANUAL DO USUÁRIO
## Sistema Completo de Gestão para Barbearias

### 🏢 **Versão:** 1.0.0 | **Data:** Janeiro 2025

---

## 🚀 PRIMEIROS PASSOS

### 1. **Acesso ao Sistema**
1. Acesse o sistema através do link fornecido pela administração
2. Na tela de login, insira seu **email** e **senha**
3. Clique em **"Entrar"** para acessar o dashboard

**💡 Primeira vez?**
- Clique em **"Cadastre-se"** se ainda não possui conta
- Use **"Esqueceu a senha?"** para recuperar acesso

### 2. **Interface Principal**
Após o login, você verá:
- **🏠 Dashboard:** Visão geral dos KPIs e métricas
- **💰 Financeiro:** Gestão de receitas, despesas e DRE
- **🪒 Lista da Vez:** Gerenciamento da fila de atendimento
- **📊 Relatórios:** Análises e exportações detalhadas
- **👥 Usuários:** Gestão de perfis (apenas administradores)

### 3. **Seleção de Unidade**
- No canto superior direito, selecione sua unidade:
  - **Mangabeiras**
  - **Nova Lima**
- Todos os dados serão filtrados pela unidade selecionada

---

## 📊 DASHBOARD - VISÃO GERAL

### **KPIs Principais**
O dashboard exibe 4 indicadores essenciais:

#### 💵 **Faturamento Total**
- Receitas do mês atual
- Comparativo com mês anterior (% de crescimento)
- Meta mensal (se configurada)

#### 💰 **Lucro Líquido**
- Resultado após dedução de todas as despesas
- Margem percentual sobre o faturamento
- Tendência de crescimento/declínio

#### 🎯 **Ticket Médio**
- Valor médio por atendimento
- Calculado automaticamente: Faturamento ÷ Atendimentos
- Comparativo com período anterior

#### 👥 **Número de Atendimentos**
- Total de clientes atendidos no mês
- Média diária de atendimentos
- Crescimento comparado ao mês anterior

### **Gráficos Interativos**
- **📈 Evolução do Faturamento:** Linha temporal mensal
- **📊 Comparativo Unidades:** Barras lado a lado
- **🥧 Distribuição de Receitas:** Pizza por tipo de serviço
- **📋 Ranking de Profissionais:** Top performers do mês

### **Filtros Disponíveis**
- **📅 Período:** Últimos 7/30/90 dias ou personalizado
- **🏢 Unidade:** Mangabeiras, Nova Lima ou ambas
- **👤 Profissional:** Filtro por barbeiro específico

---

## 💰 MÓDULO FINANCEIRO

### **📥 RECEITAS**

#### **Cadastrar Nova Receita**
1. Acesse **Financeiro > Receitas**
2. Clique em **"+ Nova Receita"**
3. Preencha os campos obrigatórios:
   - **Tipo:** Serviço, Produto, Assinatura, Outros
   - **Valor:** Quantia em reais (R$)
   - **Data:** Quando foi realizada
   - **Profissional:** Quem executou o serviço
   - **Origem:** Cliente, loja física, online, etc.
   - **Observações:** Detalhes adicionais (opcional)
4. Clique em **"Salvar"**

#### **Gerenciar Receitas Existentes**
- **✏️ Editar:** Clique no ícone de lápis na linha da receita
- **🗑️ Excluir:** Clique no ícone de lixeira (requer confirmação)
- **🔍 Filtrar:** Use os filtros por data, tipo, profissional
- **📄 Exportar:** Botão no topo para CSV/PDF

### **📤 DESPESAS**

#### **Cadastrar Nova Despesa**
1. Acesse **Financeiro > Despesas**
2. Clique em **"+ Nova Despesa"**
3. Selecione o **Tipo de Despesa:**
   - **Fixa:** Aluguel, salários, seguros (valor constante)
   - **Variável:** Produtos, comissões, marketing (valor oscila)
4. Escolha a **Categoria:**
   - Aluguel e condomínio
   - Energia elétrica
   - Água e saneamento
   - Internet e telefone
   - Produtos e materiais
   - Marketing e publicidade
   - Manutenção e limpeza
   - Impostos e taxas
   - Outros
5. Preencha **Valor** e **Data**
6. Marque **Recorrente** se é uma despesa mensal fixa
7. Adicione **Observações** se necessário
8. Clique em **"Salvar"**

### **📊 DRE - DEMONSTRAÇÃO DE RESULTADO**

O DRE segue a estrutura contábil brasileira:

```
(+) RECEITA BRUTA
    Todos os valores faturados no período

(-) DEDUÇÕES
    Taxas de cartão, cancelamentos, devoluções

(=) RECEITA LÍQUIDA
    Receita efetivamente recebida

(-) CUSTOS VARIÁVEIS
    Despesas que variam com o volume (comissões, produtos)

(=) MARGEM DE CONTRIBUIÇÃO
    Quanto sobra após custos diretos

(-) DESPESAS FIXAS
    Custos fixos mensais (aluguel, salários, luz)

(=) LUCRO LÍQUIDO
    Resultado final do período
```

#### **Como Usar o DRE**
1. Acesse **Financeiro > DRE**
2. Selecione o **período** desejado
3. Escolha a **unidade** (ou "Todas")
4. O cálculo é automático baseado em receitas e despesas cadastradas
5. Compare com **período anterior** usando as setas
6. Exporte o relatório em **PDF** ou **Excel**

### **📈 ANÁLISES COMPARATIVAS**

Visualize tendências e compare períodos:
- **Evolução Mensal:** Gráfico de linha dos últimos 12 meses
- **Comparativo Unidades:** Performance lado a lado
- **Distribuição de Despesas:** Onde o dinheiro está sendo gasto
- **Sazonalidade:** Identifique meses de alta/baixa
- **Projeções:** Tendências para os próximos meses

---

## 🪒 LISTA DA VEZ - GERENCIAMENTO DA FILA

### **Visão Geral**
A Lista da Vez organiza automaticamente os barbeiros por:
1. **Menor número de atendimentos** do mês
2. **Tempo na fila** (em caso de empate)

### **Status dos Barbeiros**
- 🟢 **Ativo (Verde):** Disponível para atender
- 🔵 **Atendendo (Azul):** Executando um serviço
- ⚫ **Pausado (Cinza):** Temporariamente indisponível

### **Ações por Perfil**

#### **👤 BARBEIRO (Próprias Ações)**
- **Entrar na Fila:** Ficar disponível para atendimentos
- **Pausar:** Sair temporariamente da fila
- **Iniciar Atendimento:** Marcar início do serviço
- **Finalizar Atendimento:** Concluir e voltar ao final da fila

#### **👔 GERENTE/ADMIN (Ações de Supervisão)**
- Todas as ações do barbeiro +
- **Pular Barbeiro:** Mover temporariamente para baixo
- **Ver Estatísticas:** Relatórios de performance individual
- **Gerenciar Pausas:** Controlar disponibilidade da equipe

### **Como Usar**

#### **Para Barbeiros:**
1. **Chegada ao trabalho:**
   - Clique em **"Entrar na Fila"**
   - Seu status muda para "Ativo" 🟢

2. **Atender um cliente:**
   - Clique em **"Iniciar Atendimento"**
   - Status muda para "Atendendo" 🔵
   - Contador de tempo inicia automaticamente

3. **Finalizar atendimento:**
   - Clique em **"Finalizar Atendimento"**
   - Você vai automaticamente para o **final da fila**
   - Contador de atendimentos do mês **aumenta +1**

4. **Fazer uma pausa:**
   - Clique em **"Pausar"**
   - Status muda para "Pausado" ⚫
   - Você **não aparece na fila** até voltar

#### **Para Gerentes:**
- Use **"Pular Barbeiro"** apenas em situações especiais
- Monitore a **distribuição equitativa** de atendimentos
- Acompanhe as **estatísticas por profissional**

### **Sincronização em Tempo Real**
- Mudanças aparecem **instantaneamente** em todos os dispositivos
- Sem necessidade de atualizar a página
- **Backup automático** a cada 30 segundos

---

## 📊 SISTEMA DE RELATÓRIOS

### **Tipos Disponíveis**

#### **📈 DRE Mensal**
- Demonstração completa de resultado
- Estrutura contábil profissional
- Comparativo com mês anterior
- Gráficos de composição de receitas e despesas

#### **🏢 Comparativo entre Unidades**
- KPIs lado a lado (Mangabeiras vs Nova Lima)
- Identificação da unidade com melhor performance
- Análise de rentabilidade por localização
- Ranking de indicadores

#### **💰 Receita x Despesa**
- Evolução temporal dos valores
- Ponto de equilíbrio mensal
- Margem de lucro por período
- Projeções baseadas em tendências

#### **👥 Performance de Profissionais**
- Ranking de faturamento por barbeiro
- Número de atendimentos por profissional
- Ticket médio individual
- Análise de comissões

#### **📊 Análise de Atendimentos**
- Distribuição por dias da semana
- Horários de maior movimento
- Tempo médio de atendimento
- Sazonalidade mensal

### **Como Gerar Relatórios**

1. **Acesse Relatórios**
   - Menu lateral > **"Relatórios"**

2. **Escolha o Tipo**
   - Clique na categoria desejada

3. **Configure os Filtros**
   - **📅 Período:** Selecione o intervalo de análise
   - **🏢 Unidade:** Mangabeiras, Nova Lima ou Todas
   - **👤 Profissional:** Específico ou todos

4. **Gere o Relatório**
   - Clique em **"Gerar Relatório"**
   - Aguarde o carregamento dos dados

5. **Exporte (Opcional)**
   - **PDF:** Para impressão ou apresentação
   - **Excel:** Para análises complementares
   - **Email:** Envio automático (em breve)

### **Dicas para Análises**
- Compare sempre **períodos similares** (mês com mês)
- Use **relatórios mensais** para acompanhamento regular
- Gere **relatórios trimestrais** para planejamento
- **Combine diferentes tipos** para visão completa

---

## 👥 GESTÃO DE USUÁRIOS (Apenas Administradores)

### **Perfis Disponíveis**

#### **🔧 ADMINISTRADOR**
- Acesso total ao sistema
- Gestão de usuários e permissões
- Configurações globais
- Relatórios consolidados

#### **👔 GERENTE**
- Acesso à sua unidade
- Gestão da equipe local
- Relatórios da unidade
- Supervisão da fila

#### **👤 BARBEIRO**
- Acesso aos próprios dados
- Gestão da fila (próprias ações)
- Visualização de relatórios pessoais
- Atualização de perfil

### **Cadastrar Novo Usuário**
1. Acesse **"Usuários"** no menu
2. Clique em **"+ Novo Usuário"**
3. Preencha:
   - **Nome completo**
   - **Email** (será o login)
   - **Perfil** (Admin/Gerente/Barbeiro)
   - **Unidade** (se aplicável)
   - **Senha temporária**
4. Clique em **"Criar Usuário"**
5. **Senha será enviada por email** (ou informe pessoalmente)

### **Gerenciar Usuários Existentes**
- **✏️ Editar:** Alterar dados, perfil ou unidade
- **🔒 Resetar Senha:** Gerar nova senha temporária
- **🚫 Desativar:** Bloquear acesso (sem excluir dados)
- **📊 Relatórios:** Ver atividade do usuário

---

## ⚙️ CONFIGURAÇÕES E PERSONALIZAÇÃO

### **Perfil Pessoal**
1. Clique no **avatar** no canto superior direito
2. Selecione **"Meu Perfil"**
3. Atualize:
   - Foto de perfil
   - Nome de exibição
   - Email de contato
   - Telefone
4. **Alterar Senha:**
   - Senha atual
   - Nova senha
   - Confirmar nova senha

### **Preferências do Sistema**
- **🌓 Tema:** Claro ou escuro (botão no topo)
- **🏢 Unidade Padrão:** Definir unidade inicial
- **📊 Dashboard:** Personalizar widgets exibidos
- **🔔 Notificações:** Configurar alertas

### **Configurações da Unidade** (Gerentes/Admin)
- **Horário de funcionamento**
- **Metas mensais** de faturamento
- **Valores padrão** de serviços
- **Categorias personalizadas** de despesas

---

## 🆘 SOLUÇÃO DE PROBLEMAS

### **Problemas de Acesso**

#### **❌ "Email ou senha incorretos"**
- Verifique se digitou corretamente
- Teste sem espaços extras
- Use "Esqueceu a senha?" se necessário
- Entre em contato com administrador

#### **⏳ "Sessão expirada"**
- Faça login novamente
- Sessão expira após 24h de inatividade
- Marque "Lembrar-me" para sessões mais longas

### **Problemas de Sincronização**

#### **🔄 "Dados não atualizando"**
- Recarregue a página (F5 ou Ctrl+R)
- Verifique conexão com internet
- Aguarde alguns segundos para sincronização
- Se persistir, contate suporte técnico

#### **📱 "Fila não sincroniza em tempo real"**
- Sistema possui backup automático a cada 30s
- Em redes lentas, pode haver delay de alguns segundos
- Recarregue se necessário

### **Problemas de Performance**

#### **🐌 "Sistema lento"**
- Feche abas desnecessárias do navegador
- Teste em modo anônimo/privado
- Limpe cache do navegador
- Reinicie o navegador

#### **📊 "Relatórios demoram para carregar"**
- Normal para períodos longos (>12 meses)
- Use filtros para reduzir volume de dados
- Gere por períodos menores

### **Problemas de Dados**

#### **❓ "KPIs zerados ou incorretos"**
- Verifique se há receitas/despesas cadastradas
- Confirme período selecionado nos filtros
- Verifique unidade selecionada
- Aguarde alguns minutos para recálculo

#### **📉 "Gráficos não aparecem"**
- Necessário ter dados no período selecionado
- Experimente expandir o período de análise
- Recarregue a página

---

## 📞 SUPORTE E CONTATO

### **Canais de Atendimento**
- **📧 Email:** suporte@barberanalyticspro.com
- **📱 WhatsApp:** (31) 99999-9999
- **🕐 Horário:** Segunda a sexta, 8h às 18h

### **Informações Técnicas**
- **Versão do Sistema:** 1.0.0
- **Última Atualização:** Janeiro 2025
- **Navegadores Suportados:** Chrome, Firefox, Safari, Edge
- **Dispositivos:** Desktop, Tablet, Smartphone

### **Recursos Adicionais**
- **📺 Vídeos Tutoriais:** [YouTube Channel]
- **📖 Base de Conhecimento:** [Help Center]
- **💬 Comunidade:** [Discord/Forum]

---

## 🔄 ATUALIZAÇÕES E NOVIDADES

### **Versão 1.0.0 (Janeiro 2025)**
✅ Sistema completo de gestão  
✅ Dashboard com KPIs em tempo real  
✅ Módulo financeiro com DRE automático  
✅ Lista da vez com sincronização realtime  
✅ Sistema completo de relatórios  
✅ Interface responsiva e acessível  
✅ Temas claro e escuro  
✅ Exportação PDF e Excel  

### **Próximas Funcionalidades**
🔜 Integração com maquininhas de cartão  
🔜 App móvel nativo (iOS/Android)  
🔜 Sistema de agendamento online  
🔜 Programa de fidelidade  
🔜 Análise preditiva com IA  
🔜 Integração WhatsApp Business  

---

## 📝 GLOSSÁRIO DE TERMOS

**DRE:** Demonstração de Resultado do Exercício - relatório contábil que mostra lucros e prejuízos

**KPI:** Key Performance Indicator - indicadores-chave de desempenho

**Ticket Médio:** Valor médio gasto por cliente por atendimento

**RLS:** Row-Level Security - sistema de segurança que isola dados por unidade

**Realtime:** Atualização em tempo real, instantânea

**WCAG:** Web Content Accessibility Guidelines - diretrizes de acessibilidade web

**Breakpoint:** Ponto de quebra responsivo para diferentes tamanhos de tela

**JWT:** JSON Web Token - sistema seguro de autenticação

---

*📖 Manual do Usuário - Barber Analytics Pro v1.0.0*  
*Desenvolvido com ❤️ para gestão profissional de barbearias*  
*© 2025 - Todos os direitos reservados*