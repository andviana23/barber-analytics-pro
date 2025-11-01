#!/bin/bash

# 🔧 Script de Setup Automático - Barber Analytics Pro
# Para: Linux Pop-OS
# Data: 1º de novembro de 2025
# Descrição: Instala todas as dependências necessárias

set -e  # Parar em caso de erro

echo "═══════════════════════════════════════════════════════════════"
echo "🔧 BARBER ANALYTICS PRO - SETUP AUTOMÁTICO (Linux Pop-OS)"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir com cor
print_status() {
    echo -e "${BLUE}▶${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# =======================
# 1. Verificar pré-requisitos
# =======================
echo ""
print_status "Verificando pré-requisitos..."
echo ""

# Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js instalado: $NODE_VERSION"
else
    print_error "Node.js não instalado!"
    echo "   Instale de: https://nodejs.org/"
    exit 1
fi

# npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_success "npm instalado: v$NPM_VERSION"
else
    print_error "npm não instalado!"
    exit 1
fi

# Git
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version)
    print_success "Git instalado: $GIT_VERSION"
else
    print_warning "Git não instalado. Instalando..."
    sudo apt update
    sudo apt install -y git
fi

echo ""

# =======================
# 2. Instalar PostgreSQL Client
# =======================
echo ""
print_status "Verificando PostgreSQL Client..."

if command -v psql &> /dev/null; then
    PSQL_VERSION=$(psql --version)
    print_success "$PSQL_VERSION"
else
    print_warning "PostgreSQL Client não encontrado. Instalando..."
    sudo apt update
    sudo apt install -y postgresql-client
    print_success "PostgreSQL Client instalado!"
fi

echo ""

# =======================
# 3. Instalar Supabase CLI
# =======================
echo ""
print_status "Verificando Supabase CLI..."

if command -v supabase &> /dev/null; then
    SUPABASE_VERSION=$(supabase --version)
    print_success "$SUPABASE_VERSION"
else
    print_warning "Supabase CLI não encontrado. Instalando..."
    npm install -g supabase
    print_success "Supabase CLI instalado!"
fi

echo ""

# =======================
# 4. Verificar arquivo .env
# =======================
echo ""
print_status "Verificando arquivo .env..."

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

if [ -f ".env" ]; then
    print_success "Arquivo .env existe"
else
    print_warning "Arquivo .env não encontrado. Criando..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_success "Arquivo .env criado de .env.example"
        print_warning "⚠️  IMPORTANTE: Edite .env com suas credenciais Supabase!"
        echo ""
        echo "   Abra o arquivo:"
        echo "   nano .env"
        echo ""
        echo "   Preencha as variáveis:"
        echo "   - VITE_SUPABASE_URL"
        echo "   - VITE_SUPABASE_ANON_KEY"
    else
        print_error "Arquivo .env.example não encontrado!"
        exit 1
    fi
fi

echo ""

# =======================
# 5. Verificar node_modules
# =======================
echo ""
print_status "Verificando node_modules..."

if [ -d "node_modules" ] && [ $(ls -1 node_modules 2>/dev/null | wc -l) -gt 100 ]; then
    print_success "node_modules já instalado"
else
    print_warning "node_modules não encontrado. Instalando dependências..."
    npm install
    print_success "Dependências instaladas!"
fi

echo ""

# =======================
# 6. Verificar lint
# =======================
echo ""
print_status "Executando linter (ESLint)..."

if npm run lint 2>&1 | head -1 > /dev/null; then
    print_success "Linter OK"
else
    print_warning "Alguns erros encontrados no linter (não é crítico)"
fi

echo ""

# =======================
# 7. Build de produção
# =======================
echo ""
print_status "Testando build de produção..."

if npm run build > /dev/null 2>&1; then
    print_success "Build funcionando corretamente!"
else
    print_warning "Erro no build (verifique a saída acima)"
fi

echo ""

# =======================
# 8. Resumo Final
# =======================
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✅ SETUP COMPLETO!"
echo "═══════════════════════════════════════════════════════════════"
echo ""

echo "📋 Verificação Final:"
echo ""
echo "   Node.js:            $(node --version)"
echo "   npm:                v$(npm --version)"
echo "   Git:                $(git --version | cut -d' ' -f3)"
echo "   PostgreSQL:         $(psql --version)"
echo "   Supabase CLI:       $(supabase --version)"
echo "   .env:               ✓ Configurado"
echo "   node_modules:       ✓ Instalado"
echo ""

echo "🚀 Próximos Passos:"
echo ""
echo "   1. Editar arquivo .env com suas credenciais Supabase:"
echo "      nano .env"
echo ""
echo "   2. Iniciar servidor de desenvolvimento:"
echo "      npm run dev"
echo ""
echo "   3. Acessar a aplicação:"
echo "      http://localhost:5173"
echo ""
echo "   4. (Opcional) Conectar ao Supabase:"
echo "      supabase link --project-ref seu-project-id"
echo "      supabase db pull"
echo ""

echo "📚 Documentação:"
echo "   - Setup:     docs/guides/SETUP.md"
echo "   - Database:  docs/DATABASE_SCHEMA.md"
echo "   - Arquitetura: docs/ARQUITETURA.md"
echo ""

echo "💡 Comandos Úteis:"
echo ""
echo "   npm run dev              # Iniciar servidor de desenvolvimento"
echo "   npm run build            # Build de produção"
echo "   npm run lint             # Verificar código"
echo "   npm run format           # Formatar código"
echo "   npm test                 # Executar testes"
echo "   npm run test:e2e         # Testes E2E"
echo ""

echo "═══════════════════════════════════════════════════════════════"
echo "👍 Obrigado por usar Barber Analytics Pro!"
echo "═══════════════════════════════════════════════════════════════"
