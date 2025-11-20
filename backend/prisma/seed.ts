import { PrismaClient, PedidoStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    await prisma.itemPedido.deleteMany();
    await prisma.pedido.deleteMany();
    await prisma.produto.deleteMany();
    await prisma.categoria.deleteMany();
    await prisma.mesa.deleteMany();

    const categorias = await prisma.categoria.createMany({
        data: [
            { id: '1', nome: 'Bebidas', ordem: 1 },
            { id: '2', nome: 'Lanches', ordem: 2 },
            { id: '3', nome: 'Porções', ordem: 3 },
            { id: '4', nome: 'Sobremesas', ordem: 4 },
        ],
    });

    console.log(`Categorias criadas: ${categorias.count}`);

    const produtos = await prisma.produto.createMany({
        data: [
            { id: '1', nome: 'Coca-Cola Lata', descricao: 'Refrigerante 350ml gelado', preco: 5.0, idCategoria: '1' },
            { id: '2', nome: 'Suco de Laranja Natural', descricao: 'Suco fresco 500ml', preco: 8.0, idCategoria: '1' },
            { id: '3', nome: 'Cerveja Heineken Long Neck', descricao: 'Cerveja importada 330ml', preco: 12.0, idCategoria: '1' },
            { id: '4', nome: 'X-Burger Clássico', descricao: 'Hambúrguer artesanal 180g, queijo, alface, tomate e molho especial', preco: 25.0, idCategoria: '2' },
            { id: '5', nome: 'X-Bacon', descricao: 'Hambúrguer 180g, bacon crocante, queijo cheddar e cebola caramelizada', preco: 28.0, idCategoria: '2' },
            { id: '6', nome: 'X-Salada', descricao: 'Hambúrguer 180g, queijo, alface, tomate, milho e batata palha', preco: 22.0, idCategoria: '2' },
            { id: '7', nome: 'Batata Frita Grande', descricao: 'Porção de batata frita crocante (500g)', preco: 18.0, idCategoria: '3' },
            { id: '8', nome: 'Onion Rings', descricao: 'Anéis de cebola empanados (300g)', preco: 20.0, idCategoria: '3' },
            { id: '9', nome: 'Frango à Passarinho', descricao: 'Frango frito temperado com alho (400g)', preco: 32.0, idCategoria: '3' },
            { id: '10', nome: 'Petit Gateau', descricao: 'Bolo de chocolate quente com sorvete de baunilha', preco: 15.0, idCategoria: '4' },
            { id: '11', nome: 'Brownie com Sorvete', descricao: 'Brownie caseiro com sorvete e calda de chocolate', preco: 14.0, idCategoria: '4' },
        ],
    });

    console.log(`Produtos criados: ${produtos.count}`);

    const baseUrl = 'http://localhost:5173';
    const mesas = await prisma.mesa.createMany({
        data: Array.from({ length: 10 }, (_, index) => {
            const numero = index + 1;
            return {
                id: `mesa-${numero}`,
                numero,
                codigoQr: `${baseUrl}/mesa/${numero}`,
            };
        }),
    });

    console.log(`Mesas criadas: ${mesas.count}`);

    await prisma.pedido.create({
        data: {
            id: 'pedido-demo',
            idMesa: 'mesa-1',
            status: PedidoStatus.pendente,
            itens: {
                create: [
                    {
                        produtoId: '4',
                        quantidade: 1,
                        observacao: 'Sem cebola',
                        precoUnitario: 25.0,
                    },
                    {
                        produtoId: '1',
                        quantidade: 2,
                        precoUnitario: 5.0,
                    },
                ],
            },
        },
    });

    console.log('Pedido de demonstração criado.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
