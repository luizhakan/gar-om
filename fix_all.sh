#!/bin/bash

echo "🔧 Iniciando reestruturação do Seed via API..."

# 1. Criar o SeedController (Lógica de criação do Master)
echo "📝 Criando backend/src/master/seed.controller.ts..."
cat > backend/src/master/seed.controller.ts <<EOF
import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Controller('seed')
export class SeedController {
    constructor(private readonly prisma: PrismaService) {}

    @Get()
    async execute() {
        // 1. Verifica se já existe algum usuário Master
        const existe = await this.prisma.masterUser.count();
        if (existe > 0) {
            return { 
                message: 'Seed ignorado: O usuário Master já existe.',
                status: 'skipped'
            };
        }

        // 2. Cria o Master padrão
        const senhaHash = await bcrypt.hash('senha123', 10);
        
        await this.prisma.masterUser.create({
            data: {
                nome: 'Founder Master',
                email: 'founder@garcom.com',
                senhaHash,
            },
        });

        return { 
            message: 'Sucesso: Usuário Master criado (founder@garcom.com / senha123)',
            status: 'created'
        };
    }
}
EOF

# 2. Atualizar o MasterModule para incluir o SeedController
echo "📝 Atualizando backend/src/master/master.module.ts..."
cat > backend/src/master/master.module.ts <<EOF
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { MasterController } from './master.controller';
import { MasterService } from './master.service';
import { SeedController } from './seed.controller'; // <--- Importado

@Module({
    imports: [PrismaModule, AuthModule],
    controllers: [MasterController, SeedController], // <--- Adicionado
    providers: [MasterService],
})
export class MasterModule {}
EOF

# 3. Reverter o tsconfig.json para CommonJS (Garante compatibilidade geral)
echo "📝 Configurando tsconfig.json..."
cat > backend/tsconfig.json <<EOF
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
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

# 4. Reconstruir e Reiniciar
echo "🏗️ Reconstruindo containers..."
docker-compose down
docker-compose up -d --build

# 5. Aguardar API e Executar Seed via HTTP
echo "⏳ Aguardando API iniciar (20s)..."
sleep 20

echo "🌱 Executando Seed via API..."
# Tenta rodar o seed via requisição interna (do host para o container via porta exposta)
# Se falhar, tenta via rede interna do docker seria necessário outro comando, mas localhost:3001 deve funcionar se mapeado
RESPONSE=$(curl -s http://localhost:3001/seed)

echo ""
echo "RESPOSTA DO SEED:"
echo "$RESPONSE"
echo ""
echo "✅ Concluído! Tente logar em /master/login com founder@garcom.com / senha123"