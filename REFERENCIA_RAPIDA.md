# 📌 REFERÊNCIA RÁPIDA - Linux Pop-OS Setup

## 🚀 TL;DR (30 segundos)

```bash
# Copie e cole:
sudo apt install -y postgresql-client && npm install -g supabase && cp .env.example .env

# Depois edite .env:
nano .env
# Cole credenciais Supabase

# Depois rode:
npm run dev
# Abra: http://localhost:5173
```

---

## 📋 Comandos Essenciais

### Instalar Dependências

```bash
# PostgreSQL Client (2 min)
sudo apt update
sudo apt install -y postgresql-client

# Supabase CLI (2 min)
npm install -g supabase

# .env (1 min)
cp .env.example .env
nano .env  # Editar com credenciais
```

### Verificar Instalação

```bash
psql --version          # PostgreSQL
supabase --version      # Supabase CLI
npm --version           # npm
node --version          # Node.js
```

### Desenvolvimento

```bash
npm run dev             # Iniciar dev server (localhost:5173)
npm run build           # Build de produção
npm run lint            # Verificar código
npm run lint:fix        # Corrigir automaticamente
npm run format          # Formatar código
npm test                # Rodar testes
npm run test:e2e        # E2E tests
```

### Troubleshooting

```bash
# Porta em uso
sudo lsof -ti:5173 | xargs kill -9

# Limpar cache
npm cache clean --force

# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install

# Ver processos
ps aux | grep node
```

---

## 🔐 Configurar .env

**Arquivo:** `/home/andrey/barber-analytics-pro/.env`

**Variáveis obrigatórias:**

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Como encontrar:**

1. https://app.supabase.com
2. Settings → API
3. Copie Project URL e anon public key

---

## 📁 Estrutura Importante

```
/home/andrey/barber-analytics-pro/
├── src/                   # Código fonte
├── docs/                  # Documentação
├── package.json           # Dependências
├── .env                   # Credenciais (criar)
├── .env.example           # Template (referência)
├── vite.config.js         # Build config
├── tailwind.config.js     # Estilos config
└── README.md              # Projeto
```

---

## 🔗 Links Importantes

| Recurso            | URL                                                   |
| ------------------ | ----------------------------------------------------- |
| Supabase Dashboard | https://app.supabase.com                              |
| Documentação       | `/home/andrey/barber-analytics-pro/docs/`             |
| PostgreSQL         | https://www.postgresql.org/docs/current/app-psql.html |
| Supabase CLI       | https://supabase.com/docs/reference/cli/introduction  |

---

## ✅ Checklist Rápido

- [ ] PostgreSQL Client: `psql --version`
- [ ] Supabase CLI: `supabase --version`
- [ ] .env criado: `ls -la .env`
- [ ] npm run dev funciona
- [ ] http://localhost:5173 acessível

---

## 🆘 SOS Rápido

| Erro                          | Fix                                      |
| ----------------------------- | ---------------------------------------- |
| `psql: command not found`     | `sudo apt install -y postgresql-client`  |
| `supabase: command not found` | `npm install -g supabase`                |
| Port already in use           | `sudo lsof -ti:5173 \| xargs kill -9`    |
| Build fails                   | `npm cache clean --force && npm install` |
| .env not found                | `cp .env.example .env`                   |

---

## 📞 Documentação Completa

Para referências mais detalhadas, leia:

- **QUICK_START_LINUX.md** - Início rápido
- **CHECKLIST_PRATICO.md** - Passo a passo completo
- **DIAGNOSTICO_AMBIENTE_LINUX.md** - Análise detalhada
- **VISUAL_SETUP_GUIDE.md** - Guia visual
- **GUIA_TRANSICAO_WINDOWS_LINUX.md** - Mapeamento Windows→Linux

---

_Linux Pop-OS | Barber Analytics Pro | Nov 1, 2025_
