# 🧭 Barber Analytics Pro

Sistema completo de gestão para barbearias com dashboard de KPIs, controle financeiro e lista da vez em tempo real.

## 🚀 Configuração do Ambiente

### 1. Variáveis de Ambiente

1. **Copie o arquivo de exemplo:**
   ```bash
   cp .env.example .env.local
   ```

2. **Configure suas variáveis do Supabase:**
   - Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
   - Vá em **Settings > API**
   - Copie a **Project URL** e **anon public key**
   - Cole no arquivo `.env.local`:

   ```env
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
   ```

### 2. Instalação

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

### 3. Funcionalidades Implementadas

- ✅ **Sistema de Temas**: Dark/Light mode com persistência
- ✅ **Layout Responsivo**: Navbar, Sidebar e Container principal
- ✅ **Dashboard Demo**: KPIs, gráficos e ações rápidas
- ✅ **Design System**: Atomic Design com Tailwind CSS
- ✅ **Configuração de Desenvolvimento**: ESLint, Prettier, Vite

## 🛠 Tecnologias

- **Frontend**: React 19, Vite, TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Deploy**: Vercel

## 📁 Estrutura do Projeto

```
src/
├── atoms/          # Componentes básicos (Button, Input, Card)
├── molecules/      # Componentes compostos
├── organisms/      # Componentes complexos (Navbar, Sidebar)
├── templates/      # Layouts de página
├── pages/          # Páginas da aplicação
├── context/        # Contextos React (Theme, Auth)
├── services/       # Integração com APIs
└── styles/         # Estilos globais
```

## 🔐 Segurança

- Todas as variáveis sensíveis estão no `.env` (não commitadas)
- Row-Level Security (RLS) configurado no Supabase
- Autenticação via Supabase Auth
- Validação de permissões por unidade

## 📊 Status do Projeto

**Progresso: 45% Concluído**

Veja o [Plano de Execução](./EXECUTION_PLAN_BARBER_ANALYTICS_PRO.md) para detalhes das próximas etapas.

---

**Barber Analytics Pro © 2025**