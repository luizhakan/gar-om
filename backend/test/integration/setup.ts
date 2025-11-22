import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

export async function criarApp(): Promise<INestApplication> {
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  
  // Adiciona validação global igual ao main.ts
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  return app;
}

export async function limparBancoDeDados(app: INestApplication): Promise<void> {
  const prisma = app.get(PrismaService);
  // Ordem importa devido às foreign keys
  await prisma.itemPedido.deleteMany();
  await prisma.pedido.deleteMany();
  await prisma.mesa.deleteMany();
  await prisma.produto.deleteMany();
  await prisma.categoria.deleteMany();
  await prisma.usuarioCozinha.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.restaurante.deleteMany();
}

export async function popularBancoDeDados(app: INestApplication): Promise<void> {
    const prisma = app.get(PrismaService);

    const restaurante = await prisma.restaurante.create({
        data: {
            nome: 'Restaurante Teste',
        },
    });

    const senhaHash = await bcrypt.hash('senha123', 10);

    await prisma.admin.create({
        data: {
            nome: 'Admin Teste',
            email: 'admin@teste.com',
            cpf: '12345678901',
            senhaHash,
            restauranteId: restaurante.id,
        },
    });

    await prisma.usuarioCozinha.create({
        data: {
            login: 'restaurante-teste',
            senhaHash,
            restauranteId: restaurante.id,
        },
    });

    for (let i = 1; i <= 3; i++) {
        await prisma.mesa.create({
            data: {
                numero: i,
                codigoQr: `http://localhost:5173/mesa/${i}?restauranteId=${restaurante.id}`,
                restauranteId: restaurante.id,
            },
        });
    }
}
