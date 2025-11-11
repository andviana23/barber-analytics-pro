#!/bin/bash
# Script para iniciar o servidor de desenvolvimento com ambiente correto

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Iniciando Barber Analytics Pro...${NC}"

# Carregar nvm
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  echo -e "${GREEN}✓${NC} Carregando nvm..."
  \. "$NVM_DIR/nvm.sh"
else
  echo -e "${RED}✗${NC} nvm não encontrado em $NVM_DIR"
  exit 1
fi

# Usar Node 20
echo -e "${GREEN}✓${NC} Ativando Node 20..."
nvm use 20 2>/dev/null || nvm install 20

# Verificar versões
NODE_VERSION=$(node --version)
PNPM_VERSION=$(pnpm --version 2>/dev/null || echo "não instalado")

echo -e "${GREEN}✓${NC} Node: $NODE_VERSION"
echo -e "${GREEN}✓${NC} pnpm: $PNPM_VERSION"

# Verificar se node atende requisito
REQUIRED_NODE="20.19.0"
CURRENT_NODE=$(echo $NODE_VERSION | sed 's/v//')

echo ""
echo -e "${YELLOW}📦 Verificando dependências...${NC}"

# Verificar se node_modules existe
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}⚠️${NC}  node_modules não encontrado. Instalando dependências..."
  pnpm install
else
  echo -e "${GREEN}✓${NC} Dependências já instaladas"
fi

echo ""
echo -e "${GREEN}🎉 Ambiente configurado!${NC}"
echo -e "${YELLOW}📍 Servidor será iniciado em: http://localhost:5173${NC}"
echo ""

# Iniciar servidor
pnpm dev
