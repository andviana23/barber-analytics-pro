# 📚 Guias de Desenvolvimento

> **Central de documentação técnica do Barber Analytics Pro**

Esta pasta contém guias completos e práticos para desenvolvedores trabalhando no projeto.

---

## 📖 Guias Disponíveis

Atualmente esta pasta mantém dois guias operacionais que complementam a documentação principal (`docs/DOCUMENTACAO_INDEX.md`). Os materiais mais antigos citados em versões anteriores deste README foram consolidados nos documentos centrais.

### 🧠 Relatórios Inteligentes

#### [📊 RELATORIO_DIARIO_AUTOMATICO.md](./RELATORIO_DIARIO_AUTOMATICO.md)

- Arquitetura completa do relatório diário automatizado (ApoIA)
- Fluxo do cron job das 21:00, serviços envolvidos e exemplos de mensagens
- Checklist de configuração (variables, Supabase, Telegram)
- Troubleshooting específico para o pipeline de relatórios

**Quando usar**: configurar, debugar ou evoluir o relatório diário enviado pelo Telegram.

---

### 🔐 Segurança Operacional

#### [🛡️ PERMISSOES_GERENTE_ANALISE.md](./PERMISSOES_GERENTE_ANALISE.md)

- Detalhamento das políticas RLS para o perfil de gerente
- Explicação de queries, roles suportadas e soft delete
- Exemplos SQL para verificação e auditoria

**Quando usar**: validar permissões de acesso ao fluxo de caixa ou ajustar políticas de segurança.

---

## 🔗 Para Outras Referências

- Índice completo e materiais de onboarding: [`docs/DOCUMENTACAO_INDEX.md`](../DOCUMENTACAO_INDEX.md)
- Guia rápido (rotas, estrutura, comandos): [`docs/QUICK_REFERENCE_GUIDE.md`](../QUICK_REFERENCE_GUIDE.md)
- Fluxos detalhados e arquitetura: [`docs/MAPEAMENTO_FLUXO_DADOS.md`](../MAPEAMENTO_FLUXO_DADOS.md)

Caso precise de guias adicionais, utilize o índice principal. Quando novos tutoriais específicos forem criados, este README será atualizado para refletir os arquivos realmente existentes nesta pasta.
