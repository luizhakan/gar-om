import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BASE = 'https://images.unsplash.com/photo-';
const Q    = '?w=640&auto=format&fit=crop&q=80';

// Mapa: fragmento do nome do produto (lowercase) → ID da foto no Unsplash
const IMAGENS: { match: string; url: string }[] = [
    { match: 'coca',     url: `${BASE}1554866585-cd94860890b7${Q}` },
    { match: 'suco',     url: `${BASE}1621506289937-a8e4df240d0b${Q}` },
    { match: 'heineken', url: `${BASE}1608270586351-342b9f0ef23e${Q}` },
    { match: 'cerveja',  url: `${BASE}1608270586351-342b9f0ef23e${Q}` },
    { match: 'x-bacon',  url: `${BASE}1568901346375-23c9450c58cd${Q}` },
    { match: 'bacon',    url: `${BASE}1568901346375-23c9450c58cd${Q}` },
    { match: 'clássico', url: `${BASE}1550547660-d9450f859349${Q}` },
    { match: 'classico', url: `${BASE}1550547660-d9450f859349${Q}` },
    { match: 'x-salada', url: `${BASE}1512621776951-a57141f2eefd${Q}` },
    { match: 'salada',   url: `${BASE}1512621776951-a57141f2eefd${Q}` },
    { match: 'batata',   url: `${BASE}1573080496032-b24219e2aa84${Q}` },
    { match: 'frango',   url: `${BASE}1626082927389-6cd097cdc6ec${Q}` },
    { match: 'onion',    url: `${BASE}1618160702438-9b02de25ebde${Q}` },
    { match: 'petit',    url: `${BASE}1606313564200-e75d5e30476c${Q}` },
    { match: 'brownie',  url: `${BASE}1578985545062-69928b1d9587${Q}` },
];

function resolverUrl(nome: string): string | null {
    const lower = nome.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    for (const { match, url } of IMAGENS) {
        const matchNorm = match.normalize('NFD').replace(/[̀-ͯ]/g, '');
        if (lower.includes(matchNorm)) return url;
    }
    return null;
}

async function main() {
    const produtos = await prisma.produto.findMany();

    for (const p of produtos) {
        const url = resolverUrl(p.nome);
        if (!url) {
            console.log(`⚠  Sem imagem mapeada para: ${p.nome}`);
            continue;
        }
        await prisma.produto.update({ where: { id: p.id }, data: { imagemUrl: url } });
        console.log(`✓  ${p.nome}`);
    }

    console.log('\nDone.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
