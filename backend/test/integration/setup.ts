import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

export async function setupTestDatabase() {
    try {
        execSync('npx prisma migrate deploy', {
            env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
            stdio: 'inherit',
        });
    } catch (error) {
        console.error('Failed to setup test database:', error);
        throw error;
    }
}

export async function cleanDatabase() {
    await prisma.$transaction([
        prisma.itemPedido.deleteMany(),
        prisma.pedido.deleteMany(),
        prisma.mesa.deleteMany(),
        prisma.produto.deleteMany(),
        prisma.categoria.deleteMany(),
        prisma.usuarioCozinha.deleteMany(),
        prisma.admin.deleteMany(),
        prisma.restaurante.deleteMany(),
    ]);
}

export async function closeDatabase() {
    await prisma.$disconnect();
}

export { prisma };
