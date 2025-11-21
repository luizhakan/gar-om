#!/bin/bash

echo "🔧 Iniciando correção geral do sistema..."

# 1. Atualizar Backend para Node 20 (Correção do erro EBADENGINE)
echo "📦 Atualizando Backend para Node 20..."
sed -i 's/node:18-alpine/node:20-alpine/g' backend/Dockerfile

# 2. Ajustar CORS para aceitar www e sem www
echo "🌐 Ajustando CORS no docker-compose..."
sed -i 's|CORS_ORIGIN: https://garcomagil.com|CORS_ORIGIN: https://garcomagil.com,https://www.garcomagil.com|g' docker-compose.yml

# 3. Garantir configuração correta do TypeScript (Correção do erro de Seed)
echo "📝 Corrigindo tsconfig.json..."
cat > backend/tsconfig.json <<EOF
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "es2019",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": ".",
    "incremental": true,
    "strict": true,
    "skipLibCheck": true,
    "types": ["node", "jest"],
    "moduleResolution": "node",
    "esModuleInterop": true
  },
  "include": ["src/**/*.ts", "prisma/**/*.ts", "test/**/*.ts"]
}
EOF

# 4. Reconstruir e Reiniciar tudo
echo "🏗️ Reconstruindo containers (isso pode levar 1-2 min)..."
docker-compose down
docker-compose up -d --build

# 5. Aguardar DB e rodar Seed
echo "⏳ Aguardando banco de dados iniciar..."
sleep 10
echo "🌱 Rodando Seed do banco..."
docker exec gar-om_backend_1 npm run prisma:seed

echo "✅ Concluído! Tente acessar https://garcomagil.com ou https://www.garcomagil.com"