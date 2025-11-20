#!/bin/bash
set -e

echo "🧪 Configurando ambiente de testes..."

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para limpar ao sair
cleanup() {
    echo ""
    echo -e "${YELLOW}🧹 Limpando ambiente de testes...${NC}"
    docker-compose stop db-test 2>/dev/null || true
    docker-compose rm -f db-test 2>/dev/null || true
    echo -e "${GREEN}✅ Container de testes removido${NC}"
}

# Registrar cleanup para ser executado ao sair (mesmo com erro)
trap cleanup EXIT

# Verificar se está na raiz do projeto
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ Erro: Execute este script da raiz do projeto${NC}"
    exit 1
fi

# Verificar se backend existe
if [ ! -d "backend" ]; then
    echo -e "${RED}❌ Erro: Diretório backend não encontrado${NC}"
    exit 1
fi

echo -e "${BLUE}🐳 Iniciando container do banco de testes...${NC}"
docker-compose up -d db-test

echo -e "${BLUE}⏳ Aguardando banco de dados ficar pronto...${NC}"
sleep 5

# Verificar se o container está rodando
if ! docker ps | grep -q garcom-db-test; then
    echo -e "${RED}❌ Erro: Container de testes não está rodando${NC}"
    exit 1
fi

echo -e "${BLUE}📦 Instalando dependências...${NC}"
cd backend
npm install --silent

echo -e "${BLUE}🔄 Executando migrations no banco de testes...${NC}"
DATABASE_URL="postgresql://admin:admin@localhost:5433/garcom_test?schema=public" npx prisma migrate deploy

echo ""
echo -e "${GREEN}🎯 Rodando testes...${NC}"
echo ""

# Rodar testes e capturar código de saída
if npm test; then
    echo ""
    echo -e "${GREEN}✅ Todos os testes passaram!${NC}"
    TEST_EXIT_CODE=0
else
    echo ""
    echo -e "${RED}❌ Alguns testes falharam${NC}"
    TEST_EXIT_CODE=1
fi

# Voltar para raiz
cd ..

# cleanup será executado automaticamente pelo trap
exit $TEST_EXIT_CODE
