#!/bin/bash

echo "🔧 Iniciando correção geral do sistema..."

# 1. Garantir Backend com Node 20
echo "📦 Garantindo Node 20 no Backend..."
sed -i 's/node:18-alpine/node:20-alpine/g' backend/Dockerfile

# 2. Ajustar CORS (adiciona www e non-www)
echo "🌐 Ajustando CORS no docker-compose..."
sed -i 's|CORS_ORIGIN: https://garcomagil.com|CORS_ORIGIN: https://garcomagil.com,https://www.garcomagil.com|g' docker-compose.yml

# 3. Corrigir tsconfig.json para NodeNext (Solução do erro TS5109)
echo "📝 Configurando TypeScript para Node 20 (NodeNext)..."
cat > backend/tsconfig.json <<EOF
{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2022",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": ".",
    "incremental": true,
    "strict": true,
    "skipLibCheck": true,
    "types": ["node", "jest"],
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

echo "✅ Concluído! Sistema rodando com TypeScript corrigido."